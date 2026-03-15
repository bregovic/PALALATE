import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      // return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log('🚀 Starting service synchronization via API...');

    const userServices = await prisma.service.findMany({
      where: { status: { not: 'ARCHIVED' } }
    });

    let createdCount = 0;
    let updatedCount = 0;

    for (const svc of userServices) {
      const registryEntry = await prisma.serviceRegistry.findUnique({
        where: { name: svc.serviceName }
      });

      if (!registryEntry) {
        await prisma.serviceRegistry.create({
          data: {
            name: svc.serviceName,
            category: svc.category,
            defaultPrice: svc.periodicPrice,
            currency: svc.currency,
            billingCycle: svc.billingCycle,
            description: svc.description,
            iconUrl: svc.iconUrl,
            websiteUrl: svc.websiteUrl,
            url: svc.url,
            usageMode: svc.usageMode,
            requiresBookingApproval: svc.requiresBookingApproval,
            pricingType: svc.pricingType,
          }
        });
        createdCount++;
      } else {
        const updates: any = {};
        const regPrice = Number(registryEntry.defaultPrice || 0);
        const svcPrice = Number(svc.periodicPrice || 0);

        if (regPrice === 0 && svcPrice > 0) updates.defaultPrice = svcPrice;
        if (!registryEntry.iconUrl && svc.iconUrl) updates.iconUrl = svc.iconUrl;
        if (!registryEntry.description && svc.description) updates.description = svc.description;
        if (!registryEntry.category && svc.category) updates.category = svc.category;
        if (!registryEntry.url && svc.url) updates.url = svc.url;
        if (!registryEntry.websiteUrl && svc.websiteUrl) updates.websiteUrl = svc.websiteUrl;

        if (Object.keys(updates).length > 0) {
          await prisma.serviceRegistry.update({
            where: { id: registryEntry.id },
            data: updates
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sync complete. Created: ${createdCount}, Updated: ${updatedCount}` 
    });

  } catch (error) {
    console.error("Sync services error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
