import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const db = prisma as any;

// PATCH /api/currencies/[code]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await requireAuth();
    const { code } = await params;
    const body = await req.json();

    if (code === "CZK") {
      return NextResponse.json({ error: "Základní měna CZK nelze upravovat" }, { status: 400 });
    }

    const updated = await db.currency.update({
      where: { code: code.toUpperCase() },
      data: {
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        name: body.name || undefined,
        symbol: body.symbol !== undefined ? body.symbol : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PATCH /api/currencies/[code]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/currencies/[code]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await requireAuth();
    const { code } = await params;

    if (code === "CZK") {
      return NextResponse.json({ error: "Základní měna CZK nelze odebrat" }, { status: 400 });
    }

    await db.currency.delete({ where: { code: code.toUpperCase() } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/currencies/[code]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
