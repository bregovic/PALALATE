import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// DELETE /api/invitations/[id] - cancel a pending invitation
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation) return NextResponse.json({ error: "Pozvánka nenalezena" }, { status: 404 });
    if (invitation.inviterId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Only allow deleting pending invitations? Or any.
    await prisma.invitation.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/invitations/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
