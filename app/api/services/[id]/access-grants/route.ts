import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { granteeId, pricingModel, startsAt } = await req.json();

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const grant = await prisma.accessGrant.create({
      data: {
        serviceId: id,
        granteeId,
        grantedById: user.id,
        pricingModel: pricingModel || "EQUAL_SPLIT",
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        status: "ACTIVE"
      }
    });

    return NextResponse.json(grant);
  } catch (err) {
    console.error("[POST access-grants]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
