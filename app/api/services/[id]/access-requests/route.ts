import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST /api/services/[id]/access-requests
// Sends an access request from the current user to the service owner
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { message } = body;

    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true, ownerId: true, serviceName: true, sharingStatus: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Služba nenalezena." }, { status: 404 });
    }

    if (service.ownerId === user.id) {
      return NextResponse.json({ error: "Nemůžeš požádat o přístup ke své vlastní službě." }, { status: 400 });
    }

    // Check if there's already a pending request
    const existing = await prisma.accessRequest.findFirst({
      where: {
        serviceId: id,
        requesterId: user.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Žádost již existuje nebo máš přístup." }, { status: 409 });
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        serviceId: id,
        requesterId: user.id,
        ownerId: service.ownerId,
        message: message || null,
        status: "PENDING",
      },
    });

    // Create notification for the service owner
    await prisma.notification.create({
      data: {
        userId: service.ownerId,
        type: "ACCESS_REQUEST_RECEIVED",
        payload: {
          requestId: accessRequest.id,
          serviceId: id,
          serviceName: service.serviceName,
          requesterName: user.name,
          message: message || null,
        },
      },
    });

    return NextResponse.json(accessRequest, { status: 201 });
  } catch (err) {
    console.error("[POST access-requests]", err);
    return NextResponse.json({ error: "Chyba serveru." }, { status: 500 });
  }
}

// GET /api/services/[id]/access-requests
// Returns all access requests for this service (owner only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const service = await prisma.service.findUnique({ where: { id }, select: { ownerId: true } });
    if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const requests = await prisma.accessRequest.findMany({
      where: { serviceId: id },
      include: { requester: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (err) {
    console.error("[GET access-requests]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
