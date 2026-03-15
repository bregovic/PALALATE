import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { calculateNextRenewal } from "@/lib/billing";

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
        _count: { 
          select: { 
            accessGrants: { where: { status: "ACTIVE" } },
            manualSlots: true
          } 
        },
        priceIntervals: { orderBy: { startDate: "asc" } },
        manualSlots: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Služba nenalezena" }, { status: 404 });
    }

    // Check access
    const isOwner = service.ownerId === user.id;
    const isGranted = service.accessGrants.some((g: any) => g.granteeId === user.id);
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

    const {
      serviceName, providerName, periodicPrice, currency,
      billingCycle, pricingType, pricingDetails, renewalDate, startDate,
      description, category, maxSharedSlots,
      usageMode, requiresBookingApproval, isTerminated,
      priceIntervals, iconUrl, url
    } = body;

    let finalRenewalDate = (renewalDate && !isNaN(Date.parse(renewalDate))) ? new Date(renewalDate) : (renewalDate === null ? null : undefined);
    
    // Auto-calculate if renewal date is explicitly cleared OR if it's missing but we have startDate and billingCycle
    // We only auto-calculate if finalRenewalDate is null (meaning user cleared it or didn't provide it)
    if (finalRenewalDate === null || (finalRenewalDate === undefined && !service.renewalDate)) {
       const effectiveStartDate = startDate || service.startDate;
       const effectiveBillingCycle = billingCycle || service.billingCycle;
       if (effectiveStartDate && effectiveBillingCycle) {
          finalRenewalDate = calculateNextRenewal(effectiveStartDate, effectiveBillingCycle) || null;
       }
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        serviceName,
        providerName,
        periodicPrice: periodicPrice !== undefined ? Number(periodicPrice) : undefined,
        currency,
        billingCycle: billingCycle as any,
        pricingType: pricingType as any,
        pricingDetails,
        renewalDate: finalRenewalDate,
        startDate: (startDate && !isNaN(Date.parse(startDate))) ? new Date(startDate) : (startDate === null ? null : undefined),
        description,
        category,
        maxSharedSlots: maxSharedSlots !== undefined ? parseInt(String(maxSharedSlots)) : undefined,
        usageMode: usageMode as any,
        requiresBookingApproval: requiresBookingApproval !== undefined ? Boolean(requiresBookingApproval) : undefined,
        isTerminated: isTerminated !== undefined ? Boolean(isTerminated) : undefined,
        iconUrl,
        url,
        priceIntervals: Array.isArray(priceIntervals) ? {
          deleteMany: {},
          create: priceIntervals.map((pi: any) => ({
            startDate: new Date(pi.startDate),
            endDate: pi.endDate ? new Date(pi.endDate) : null,
            price: Number(pi.price),
          })),
        } : undefined,
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
