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

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: user.id
        }
      }
    });

    if (existingLike) {
      // Toggle off
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ liked: false });
    } else {
      // Toggle on
      await prisma.like.create({
        data: {
          postId: id,
          userId: user.id
        }
      });
      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    console.error("[POST /api/social/posts/[id]/like]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
