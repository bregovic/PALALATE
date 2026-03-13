import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const wish = await prisma.wish.findUnique({ where: { id } });
    if (!wish) return NextResponse.json({ error: "Přání nenalezeno" }, { status: 404 });
    if (wish.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.wish.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
