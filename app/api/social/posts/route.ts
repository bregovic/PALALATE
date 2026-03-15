import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/social/posts - Get wall posts (mine and friends)
export async function GET() {
  try {
    const user = await requireAuth();

    // Get friends IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
    });

    const friendIds = friendships.map(f => 
      f.requesterId === user.id ? f.addresseeId : f.requesterId
    );

    // Include myself in the feed
    const allvisibleIds = [...friendIds, user.id];

    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: allvisibleIds },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ posts });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/social/posts - Create a new post
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { content } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Příspěvek nesmí být prázdný" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Notify friends about new post (simplified notification)
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
    });

    const friendIds = friendships.map(f => 
      f.requesterId === user.id ? f.addresseeId : f.requesterId
    );

    // Notification creation can be slow, but for a small number of friends it's okay
    await Promise.all(friendIds.map(friendId => 
      prisma.notification.create({
        data: {
          userId: friendId,
          type: "NEW_POST_FRIEND",
          payload: {
            authorId: user.id,
            authorName: user.name,
            postId: post.id,
          },
        },
      })
    ));

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
