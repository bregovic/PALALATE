import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/services
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "mine";

    if (filter === "shared") {
      const grants = await prisma.accessGrant.findMany({
        where: { granteeId: user.id, status: { in: ["ACTIVE", "SCHEDULED"] } },
        include: {
          service: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
              _count: { select: { accessGrants: { where: { status: "ACTIVE" } } } },
            },
          },
          grantedBy: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json(grants);
    }

    const services = await prisma.service.findMany({
      where: { ownerId: user.id, status: { not: "ARCHIVED" } },
      include: {
        _count: {
          select: {
            accessGrants: { where: { status: "ACTIVE" } },
            accessRequests: { where: { status: "PENDING" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(services);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/services]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/services
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const {
      serviceName, providerName, category, description,
      periodicPrice, currency, billingCycle, renewalDate,
      sharingStatus, sharingVisibility, maxSharedSlots,
      legalNote, tags, iconUrl, websiteUrl,
      licenseType, sharingConditions, internalNote, startDate
    } = body;

    if (!serviceName || !providerName || periodicPrice == null) {
      return NextResponse.json(
        { error: "Název, poskytovatel a cena jsou povinné" },
        { status: 400 }
      );
    }

    const price = periodicPrice != null ? parseFloat(periodicPrice.toString()) : 0;
    const slots = maxSharedSlots != null ? parseInt(maxSharedSlots.toString()) : 0;

    const service = await prisma.service.create({
      data: {
        ownerId: user.id,
        serviceName,
        providerName,
        category: category || null,
        description: description || null,
        periodicPrice: isNaN(price) ? 0 : price,
        currency: currency || "CZK",
        billingCycle: billingCycle || "MONTHLY",
        pricingType: body.pricingType || "PAID",
        pricingDetails: body.pricingDetails || null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        sharingStatus: sharingStatus || "SHARING_DISABLED",
        sharingVisibility: sharingVisibility || "FRIENDS_ONLY",
        maxSharedSlots: isNaN(slots) ? 0 : slots,
        legalNote: legalNote || null,
        tags: tags || [],
        iconUrl: iconUrl || null,
        websiteUrl: websiteUrl || null,
        licenseType: licenseType || null,
        sharingConditions: sharingConditions || null,
        internalNote: internalNote || null,
        status: "ACTIVE",
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "Service",
        entityId: service.id,
        action: "CREATE",
        metadata: { serviceName },
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/services]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
