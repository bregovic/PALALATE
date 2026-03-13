import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";

// GET /api/requests
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "incoming"; // incoming | outgoing

    if (type === "outgoing") {
      const requests = await prisma.accessRequest.findMany({
        where: { requesterId: user.id },
        include: {
          service: {
            include: { owner: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(requests);
    }

    const requests = await prisma.accessRequest.findMany({
      where: { ownerId: user.id },
      include: {
        requester: { select: { id: true, name: true, email: true, avatar: true } },
        service: { select: { id: true, serviceName: true, providerName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/requests – create access request
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { serviceId, message, requestedFrom, requestedTo, requestedMode } = await req.json();

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId je povinný" }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    if (!service) return NextResponse.json({ error: "Služba nenalezena" }, { status: 404 });
    if (service.ownerId === user.id) {
      return NextResponse.json({ error: "Nemůžeš žádat o přístup ke své vlastní službě" }, { status: 400 });
    }
    if (service.sharingStatus !== "SHARING_ENABLED") {
      return NextResponse.json({ error: "Tato služba momentálně nepřijímá žádosti" }, { status: 409 });
    }

    // Check for existing pending request
    const existing = await prisma.accessRequest.findFirst({
      where: { serviceId, requesterId: user.id, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json({ error: "Žádost již byla odeslána" }, { status: 409 });
    }

    const request = await prisma.accessRequest.create({
      data: {
        serviceId,
        requesterId: user.id,
        ownerId: service.ownerId,
        message: message || null,
        requestedFrom: requestedFrom ? new Date(requestedFrom) : null,
        requestedTo: requestedTo ? new Date(requestedTo) : null,
        requestedMode: requestedMode || "STANDARD",
        status: "PENDING",
      },
    });

    // Notify owner
    await prisma.notification.create({
      data: {
        userId: service.ownerId,
        type: "ACCESS_REQUEST_RECEIVED",
        payload: {
          requestId: request.id,
          serviceId,
          serviceName: service.serviceName,
          requesterName: user.name,
        },
      },
    });

    // Send email (fire-and-forget)
    const tmpl = emailTemplates.accessRequestReceived(
      service.owner.name,
      user.name,
      service.serviceName,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/requests`
    );
    sendEmail({ to: service.owner.email, ...tmpl }).catch(console.error);

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/requests]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
