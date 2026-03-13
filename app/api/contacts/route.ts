import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/contacts
export async function GET() {
  try {
    const user = await requireAuth();

    const [friendships, invitations] = await Promise.all([
      prisma.friendship.findMany({
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
      }),
      prisma.invitation.findMany({
        where: { inviterId: user.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ friendships, invitations });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/contacts – send friend request or invitation
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { email, message } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email je povinný" }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();

    if (targetEmail === user.email.toLowerCase()) {
      return NextResponse.json({ error: "Nemůžeš si poslat žádost sám sobě 🫠" }, { status: 400 });
    }

    const addressee = await prisma.user.findUnique({ where: { email: targetEmail } });

    if (!addressee) {
      // NEW: Logic for non-existing users – Invitation
      const existingInvite = await prisma.invitation.findFirst({
        where: { inviterId: user.id, email: targetEmail, status: "PENDING" }
      });

      if (existingInvite) {
        return NextResponse.json({ error: "Pozvánka pro tento email už visí ve vzduchu 📩" }, { status: 409 });
      }

      const invitation = await prisma.invitation.create({
        data: {
          inviterId: user.id,
          email: targetEmail,
          message: message || null,
        }
      });

      const { sendEmail, emailTemplates } = await import("@/lib/email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const registerUrl = `${appUrl}/register?email=${encodeURIComponent(targetEmail)}`;
      
      const template = emailTemplates.invitationReceived(user.name, registerUrl, message);
      await sendEmail({ to: targetEmail, subject: template.subject, html: template.html });

      return NextResponse.json({ 
        message: "Pozvánka byla odeslána na email", 
        type: "INVITATION",
        invitation 
      }, { status: 201 });
    }

    // Logic for existing users – Friend Request
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

    // Send email notification for friend request
    try {
      const { sendEmail, emailTemplates } = await import("@/lib/email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const contactsUrl = `${appUrl}/dashboard/contacts`;
      const template = emailTemplates.friendRequestReceived(addressee.name, user.name, contactsUrl);
      await sendEmail({ to: addressee.email, subject: template.subject, html: template.html });
    } catch (e) {
      console.error("[Email] Failed to send friend request email", e);
    }

    return NextResponse.json(friendship, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/contacts]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
