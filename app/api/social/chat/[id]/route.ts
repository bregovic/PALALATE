import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/social/chat/[id] - Get messages with a specific contact
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: partnerId } = await params;

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: partnerId },
          { senderId: partnerId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: {
        senderId: partnerId,
        receiverId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ messages });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/social/chat/[id] - Send a message to a specific contact
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: partnerId } = await params;
    const { content } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Zpráva nesmí být prázdná" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: user.id,
        receiverId: partnerId,
        content: content.trim(),
      },
      include: {
        sender: { select: { name: true } }
      }
    });

    // Notify receiver
    await prisma.notification.create({
      data: {
        userId: partnerId,
        type: "CHAT_MESSAGE_RECEIVED",
        payload: {
          senderId: user.id,
          senderName: user.name,
          preview: content.substring(0, 50),
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
