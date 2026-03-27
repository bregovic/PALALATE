import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const db = prisma as any;

// GET /api/currencies — seznam všech evidovaných měn
export async function GET() {
  try {
    await requireAuth();
    const currencies = await db.currency.findMany({
      orderBy: [{ isBase: "desc" }, { code: "asc" }],
      include: {
        rates: {
          where: { month: null }, // jen roční průměry
          orderBy: [{ year: "desc" }],
        },
      },
    });
    return NextResponse.json(currencies);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/currencies — přidat novou měnu
export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { code, name, symbol } = await req.json();

    if (!code || !name) {
      return NextResponse.json({ error: "Kód a název jsou povinné" }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();

    const currency = await db.currency.upsert({
      where: { code: upperCode },
      create: { code: upperCode, name, symbol: symbol || null, isBase: upperCode === "CZK" },
      update: { name, symbol: symbol || null, isActive: true },
    });

    return NextResponse.json(currency, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/currencies]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
