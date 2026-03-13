import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/services/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        credentials: {
          select: { id: true, secretType: true, label: true, visibilityRule: true, createdAt: true, rotatedAt: true },
        },
        accessGrants: {
          where: { status: { in: ["ACTIVE", "SCHEDULED"] } },
          include: { grantee: { select: { id: true, name: true, email: true } } },
        },
        accessRequests: {
          where: { status: "PENDING" },
          include: { requester: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { accessGrants: { where: { status: "ACTIVE" } } } },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Služba nenalezena" }, { status: 404 });
    }

    // Check access
    const isOwner = service.ownerId === user.id;
    const isGranted = service.accessGrants.some((g) => g.granteeId === user.id);
    if (!isOwner && !isGranted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ...service, isOwner });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/services/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/services/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...body,
        periodicPrice: body.periodicPrice != null ? parseFloat(body.periodicPrice) : undefined,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : undefined,
        maxSharedSlots: body.maxSharedSlots != null ? parseInt(body.maxSharedSlots) : undefined,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "Service",
        entityId: id,
        action: "UPDATE",
        metadata: { changes: Object.keys(body) },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PATCH /api/services/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/services/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Soft delete
    await prisma.service.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/services/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
