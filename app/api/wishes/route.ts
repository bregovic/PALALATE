import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const scope = searchParams.get("scope");

    // Get list of friends to verify access
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: user.id },
          { addresseeId: user.id },
        ],
        status: "ACCEPTED",
      },
      select: { requesterId: true, addresseeId: true }
    });

    const friendIds = friendships.map(f => f.requesterId === user.id ? f.addresseeId : f.requesterId);

    let where: any = { userId: user.id };

    if (scope === "friends") {
      where = { userId: { in: friendIds } };
    } else if (targetUserId) {
      if (targetUserId !== user.id && !friendIds.includes(targetUserId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where = { userId: targetUserId };
    }

    const wishes = await prisma.wish.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(wishes);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/wishes]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { serviceName, description, link, priority } = body;

    if (!serviceName) {
      return NextResponse.json({ error: "Název služby je povinný" }, { status: 400 });
    }

    const wish = await prisma.wish.create({
      data: {
        userId: user.id,
        serviceName,
        description,
        link,
        priority: priority || 0,
      }
    });

    return NextResponse.json(wish, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
