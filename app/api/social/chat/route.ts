import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/social/chat - Get list of contacts with their last chat message
export async function GET() {
  try {
    const user = await requireAuth();

    // 1. Get all friends
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
        addressee: { select: { id: true, name: true, avatar: true } },
      },
    });

    const contacts = friendships.map(f => 
      f.requesterId === user.id ? f.addressee : f.requester
    );

    // 2. For each contact, get the last message
    const contactsWithLastMessage = await Promise.all(contacts.map(async (contact) => {
      const lastMessage = await prisma.chatMessage.findFirst({
        where: {
          OR: [
            { senderId: user.id, receiverId: contact.id },
            { senderId: contact.id, receiverId: user.id },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      const unreadCount = await prisma.chatMessage.count({
        where: {
          senderId: contact.id,
          receiverId: user.id,
          readAt: null,
        },
      });

      return {
        ...contact,
        lastMessage,
        unreadCount,
      };
    }));

    // Sort by last message date
    contactsWithLastMessage.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || new Date(0);
      const dateB = b.lastMessage?.createdAt || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ contacts: contactsWithLastMessage });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
