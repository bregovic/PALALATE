import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const db = prisma as any;

/**
 * ČNB API pro roční průměrné kurzy:
 * https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/rok.txt?rok=YYYY
 *
 * Formát plain text: záhlaví "Zem|Měna|Množství|Kód|Kurz" + řádky dat
 */

interface CnbRateRow {
  code: string;
  amount: number;
  rate: number; // kurz za 1 jednotku v CZK
}

async function fetchCnbYearlyRates(year: number): Promise<CnbRateRow[]> {
  const currentYear = new Date().getFullYear();
  
  // Pro aktuální rok se rok.txt na webu ČNB chová jako časová řada (jiný formát), 
  // tak raději použijeme denní kurz pro získání aktuálních dat.
  // Pro minulé roky rok.txt vrací tabulku ročních průměrů.
  const url = (year === currentYear) 
    ? `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt`
    : `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/rok.txt?rok=${year}`;

  const res = await fetch(url, {
    headers: { "Accept": "text/plain; charset=utf-8" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ČNB API vrátilo ${res.status}`);
  }

  // ČNB odpovídá v windows-1250 kódování
  const buffer = await res.arrayBuffer();
  const decoder = new TextDecoder("windows-1250");
  const text = decoder.decode(buffer);

  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  if (lines.length < 2) throw new Error("Neplatná odpověď z ČNB (málo řádků)");

  // Pomocná funkce pro normalizaci textu (odstranění diakritiky a na malá písmena)
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Najdeme řádek se záhlavím (může být na 1. nebo 2. řádku)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = norm(lines[i]);
    if (l.includes("|") && (l.includes("kod") || l.includes("mena") || l.includes("kurz") || l.includes("prumer"))) {
      headerIdx = i;
      break;
    }
  }

  // Speciální případ: Pokud rok.txt pro aktuální rok vrátí formát "Datum|1 AUD|1 BRL|..."
  if (headerIdx === -1 && norm(lines[0]).startsWith("datum|")) {
    return parseCnbPivotFormat(lines);
  }

  if (headerIdx === -1) {
    throw new Error(`Neznámý formát ČNB (záhlaví nebylo rozpoznáno). První řádek: ${lines[0].substring(0, 100)}`);
  }

  const headers = lines[headerIdx].split("|").map(h => norm(h));
  const dataLines = lines.slice(headerIdx + 1);

  const amountIdx = headers.findIndex(h => h.includes("mnozstvi") || h.includes("mnozst"));
  const codeIdx = headers.findIndex(h => h === "kod" || h.includes("kod"));
  const rateIdx = headers.findIndex(h => h === "kurz" || h === "prumer" || h.includes("prumer"));

  if (codeIdx === -1 || rateIdx === -1) {
    throw new Error(`Neznámý formát ČNB záhlaví (kod=${codeIdx}, rate=${rateIdx}). Záhlaví: ${lines[headerIdx]}`);
  }

  const rows: CnbRateRow[] = [];
  for (const line of dataLines) {
    const cols = line.split("|");
    if (cols.length <= Math.max(codeIdx, rateIdx)) continue;

    const code = cols[codeIdx]?.trim().toUpperCase();
    const amountStr = amountIdx !== -1 ? cols[amountIdx] : "1";
    const amount = parseFloat(amountStr?.replace(",", ".")) || 1;
    const rateStr = cols[rateIdx]?.replace(",", ".").trim();
    const rateRaw = parseFloat(rateStr);

    if (!code || isNaN(rateRaw)) continue;

    rows.push({
      code,
      amount,
      rate: rateRaw / amount
    });
  }

  return rows;
}

/**
 * Zpracuje formát kde sloupce jsou měny a řádky dny (použije poslední dostupný den).
 * Záhlaví: Datum|1 AUD|1 BRL|1 CAD|...
 */
function parseCnbPivotFormat(lines: string[]): CnbRateRow[] {
  const headerCols = lines[0].split("|");
  const dataCols = lines[lines.length - 1].split("|"); // Poslední (nejnovější) řádek

  if (headerCols.length !== dataCols.length) {
    throw new Error("Pivot formát ČNB: Počet sloupců v záhlaví a datech nesouhlasí.");
  }

  const rows: CnbRateRow[] = [];
  // Od indexu 1 (přeskakujeme 'Datum')
  for (let i = 1; i < headerCols.length; i++) {
    const header = headerCols[i].trim(); // např. "1 AUD" nebo "100 HUF"
    const valStr = dataCols[i].trim().replace(",", ".");
    const rateRaw = parseFloat(valStr);
    
    if (isNaN(rateRaw)) continue;

    // Rozdělíme "100 HUF" na množství a kód
    const parts = header.split(/\s+/);
    let amount = 1;
    let code = header;
    
    if (parts.length >= 2) {
      amount = parseFloat(parts[0]) || 1;
      code = parts[1].toUpperCase();
    } else {
      code = header.toUpperCase();
    }

    rows.push({
      code,
      amount,
      rate: rateRaw / amount
    });
  }
  return rows;
}


// POST /api/currencies/import-cnb — importuje kurzy pro daný rok
export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { year } = await req.json();

    if (!year || isNaN(Number(year)) || Number(year) < 1990 || Number(year) > 2100) {
      return NextResponse.json({ error: "Neplatný rok" }, { status: 400 });
    }

    const targetYear = Number(year);

    const activeCurrencies = await db.currency.findMany({
      where: { isActive: true, isBase: false },
    });

    if (activeCurrencies.length === 0) {
      return NextResponse.json({
        error: "Nejsou žádné aktivní měny k importu. Nejdříve přidejte měny do číselníku."
      }, { status: 400 });
    }

    let cnbRates: CnbRateRow[];
    try {
      cnbRates = await fetchCnbYearlyRates(targetYear);
    } catch (e: any) {
      return NextResponse.json({ error: `Chyba při stahování z ČNB: ${e.message}` }, { status: 502 });
    }

    const cnbMap = new Map(cnbRates.map(r => [r.code, r]));
    const results: { code: string; rate: number | null; status: string }[] = [];

    for (const currency of activeCurrencies) {
      const cnbRow = cnbMap.get(currency.code);
      if (!cnbRow) {
        results.push({ code: currency.code, rate: null, status: "Měna nenalezena v ČNB" });
        continue;
      }

      await db.exchangeRate.upsert({
        where: {
          currencyCode_year_month: {
            currencyCode: currency.code,
            year: targetYear,
            month: null,
          },
        },
        create: {
          currencyCode: currency.code,
          year: targetYear,
          month: null,
          rateToCzk: cnbRow.rate,
          source: "CNB",
        },
        update: {
          rateToCzk: cnbRow.rate,
          source: "CNB",
          updatedAt: new Date(),
        },
      });

      results.push({ code: currency.code, rate: cnbRow.rate, status: "OK" });
    }

    return NextResponse.json({
      year: targetYear,
      imported: results.filter(r => r.status === "OK").length,
      skipped: results.filter(r => r.status !== "OK").length,
      results,
    });

  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/currencies/import-cnb]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/currencies/import-cnb?year=YYYY — náhled kurzů z ČNB (bez uložení)
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const rows = await fetchCnbYearlyRates(year);
    return NextResponse.json({ year, currencies: rows });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/currencies/import-cnb]", err);
    return NextResponse.json({ error: `Chyba při načítání z ČNB: ${(err as any).message}` }, { status: 502 });
  }
}
