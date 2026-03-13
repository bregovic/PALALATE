import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/settlements
export async function GET() {
  try {
    const user = await requireAuth();

    const periods = await prisma.settlementPeriod.findMany({
      where: {
        service: { ownerId: user.id },
      },
      include: {
        service: { select: { id: true, serviceName: true } },
        items: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const myItems = await prisma.settlementItem.findMany({
      where: { userId: user.id },
      include: {
        period: {
          include: {
            service: { select: { serviceName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ periods, myItems });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/settlements – generate settlement for a service
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { serviceId, periodFrom, periodTo, calculationModel } = await req.json();

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const from = new Date(periodFrom);
    const to = new Date(periodTo);
    const days = (to.getTime() - from.getTime()) / 86400000;

    // Find active grants in period
    const grants = await prisma.accessGrant.findMany({
      where: {
        serviceId,
        status: { in: ["ACTIVE", "EXPIRED", "REVOKED"] },
        startsAt: { lte: to },
        OR: [{ endsAt: null }, { endsAt: { gte: from } }],
      },
      include: { grantee: { select: { id: true, name: true } } },
    });

    const totalParticipants = grants.length + 1; // +1 owner
    const pricePerPeriod = Number(service.periodicPrice);
    // Adjust for billing cycle vs period
    let periodCost = pricePerPeriod;
    if (service.billingCycle === "YEARLY") periodCost = (pricePerPeriod / 365) * days;
    if (service.billingCycle === "QUARTERLY") periodCost = (pricePerPeriod / 90) * days;
    if (service.billingCycle === "MONTHLY") periodCost = (pricePerPeriod / 30) * days;

    const period = await prisma.settlementPeriod.create({
      data: {
        serviceId,
        periodFrom: from,
        periodTo: to,
        totalCost: periodCost,
        currency: service.currency,
        calculationModel: calculationModel || "EQUAL_SPLIT",
        status: "OPEN",
      },
    });

    // Create items for each grantee
    if (grants.length > 0) {
      const sharePerPerson = periodCost / totalParticipants;
      for (const grant of grants) {
        let amount = sharePerPerson;
        if (calculationModel === "BY_DAYS" && grant.endsAt) {
          const grantDays = Math.min(
            (grant.endsAt.getTime() - Math.max(grant.startsAt.getTime(), from.getTime())) / 86400000,
            days
          );
          amount = (grantDays / days) * periodCost;
        }
        if (calculationModel === "FIXED" && grant.fixedAmount) {
          amount = Number(grant.fixedAmount);
        }
        if (calculationModel === "BY_WEIGHT" && grant.weight) {
          amount = (grant.weight / totalParticipants) * periodCost;
        }

        await prisma.settlementItem.create({
          data: {
            settlementPeriodId: period.id,
            userId: grant.granteeId,
            accessGrantId: grant.id,
            amountDue: Math.round(amount * 100) / 100,
            explanation: `Podíl za ${grant.grantee.name} (${calculationModel === "EQUAL_SPLIT" ? "rovným dílem" : "dle dní"})`,
            status: "PROPOSED",
          },
        });
      }
    }

    return NextResponse.json(period, { status: 201 });
  } catch (err) {
    console.error("[POST /api/settlements]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
