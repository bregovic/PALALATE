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
  const url = `https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/rok.txt?rok=${year}`;
  const res = await fetch(url, {
    headers: { "Accept": "text/plain; charset=utf-8" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ČNB API vrátilo ${res.status}`);
  }

  // ČNB odpovídá v windows-1250, ale většinou jako latin1 — potřebujeme přečíst jako arrayBuffer a dekódovat
  const buffer = await res.arrayBuffer();
  const decoder = new TextDecoder("windows-1250");
  const text = decoder.decode(buffer);

  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) throw new Error("Neplatná odpověď z ČNB");

  const headerLine = lines[0];
  const dataLines = lines.slice(1);

  // Záhlaví: "Zem|Měna|Množství|Kód|Kurz" (case insensitive, různé diakritiky)
  const headers = headerLine.split("|").map(h => h.trim().toLowerCase()
    .replace(/\u00e1/g, "a").replace(/\u011b/g, "e").replace(/\u00ed/g, "i")
    .replace(/\u00fd/g, "y").replace(/\u016f/g, "u").replace(/\u017e/g, "z")
  );

  const amountIdx = headers.findIndex(h => h.includes("mnozstvi") || h.includes("mnozst"));
  const codeIdx = headers.findIndex(h => h === "kod" || h.includes("kod"));
  const rateIdx = headers.findIndex(h => h === "kurz");

  if (codeIdx === -1 || rateIdx === -1) {
    throw new Error(`Neznámý formát ČNB (záhlaví: ${headerLine})`);
  }

  const rows: CnbRateRow[] = [];
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = line.split("|");
    if (cols.length <= rateIdx) continue;

    const code = cols[codeIdx]?.trim().toUpperCase();
    const amount = amountIdx !== -1 ? parseFloat(cols[amountIdx]?.replace(",", ".")) : 1;
    const rateRaw = parseFloat(cols[rateIdx]?.replace(",", ".").trim());

    if (!code || isNaN(rateRaw)) continue;

    const ratePer1 = rateRaw / (isNaN(amount) || amount === 0 ? 1 : amount);
    rows.push({ code, amount: isNaN(amount) ? 1 : amount, rate: ratePer1 });
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
