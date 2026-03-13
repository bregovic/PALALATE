import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// PATCH /api/contacts/[id] – accept/reject
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { action } = await req.json(); // "accept" | "reject" | "block"

    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (friendship.addresseeId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const statusMap: Record<string, string> = {
      accept: "ACCEPTED",
      reject: "REJECTED",
      block: "BLOCKED",
    };
    const newStatus = statusMap[action];
    if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const updated = await prisma.friendship.update({
      where: { id },
      data: {
        status: newStatus as "ACCEPTED" | "REJECTED" | "BLOCKED",
        acceptedAt: action === "accept" ? new Date() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/contacts/[id] – remove contact
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const friendship = await prisma.friendship.findUnique({ where: { id } });
    if (!friendship) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (friendship.requesterId !== user.id && friendship.addresseeId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.friendship.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
