import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { content } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Komentář nesmí být prázdný" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        userId: user.id,
        content: content.trim()
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error("[POST /api/social/posts/[id]/comment]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
