import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Nebyl rozpoznán žádný text." }, { status: 400 });
    }

    const normalizedText = text.toLowerCase().trim();
    const registry = await prisma.serviceRegistry.findMany();
    
    // Get currently owned service names to avoid duplicates
    const existing = await prisma.service.findMany({
      where: { ownerId: user.id },
      select: { serviceName: true }
    });
    const existingNames = new Set(existing.map(s => s.serviceName.toLowerCase()));

    const added = [];

    // Simple but effective: check if any registry service name is mentioned in the text
    for (const item of registry as any[]) {
      const itemName = item.name.toLowerCase();
      // Look for the name with word boundaries or as a sub-string
      const regex = new RegExp(`\\b${itemName}\\b`, 'i');
      
      if (regex.test(normalizedText) && !existingNames.has(itemName)) {
        // Create the service for the user
        const newService = await prisma.service.create({
          data: {
            ownerId: user.id,
            serviceName: item.name,
            providerName: item.name,
            category: item.category,
            periodicPrice: item.defaultPrice || 0,
            currency: item.currency,
            billingCycle: item.billingCycle,
            pricingType: item.pricingType,
            usageMode: item.usageMode,
            requiresBookingApproval: item.requiresBookingApproval || false,
            iconUrl: item.iconUrl,
            websiteUrl: item.websiteUrl,
            description: item.description,
            url: item.url || null,
            status: "ACTIVE"
          }
        });
        
        // Audit log
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            entityType: "Service",
            entityId: newService.id,
            action: "CREATE",
            metadata: { 
              serviceName: item.name,
              via: "voice_recognition"
            },
          },
        });

        added.push(item.name);
        existingNames.add(itemName);
      }
    }

    return NextResponse.json({ added });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Voice Match POST]", error);
    return NextResponse.json({ error: "Chyba při zpracování hlasového příkazu." }, { status: 500 });
  }
}
