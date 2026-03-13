import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/contacts
export async function GET() {
  try {
    const user = await requireAuth();

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: user.id },
          { addresseeId: user.id },
        ],
      },
      include: {
        requester: { select: { id: true, name: true, email: true, avatar: true } },
        addressee: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(friendships);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/contacts – send friend request
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { email, message } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email je povinný" }, { status: 400 });
    }

    if (email.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json({ error: "Nemůžeš si poslat žádost sám sobě 🫠" }, { status: 400 });
    }

    const addressee = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!addressee) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem nebyl nalezen" },
        { status: 404 }
      );
    }

    // Check existing
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, addresseeId: addressee.id },
          { requesterId: addressee.id, addresseeId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return NextResponse.json({ error: "Už jste propojeni" }, { status: 409 });
      }
      return NextResponse.json({ error: "Žádost již existuje" }, { status: 409 });
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: user.id,
        addresseeId: addressee.id,
        message: message || null,
        status: "PENDING",
      },
      include: {
        addressee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/contacts]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
