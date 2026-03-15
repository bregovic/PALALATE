import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Příspěvek nenalezen" }, { status: 404 });
    }

    if (post.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/social/posts/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
