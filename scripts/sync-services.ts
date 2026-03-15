import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting service synchronization...');

  // 1. Get all user services
  const userServices = await prisma.service.findMany({
    where: { status: { not: 'ARCHIVED' } }
  });

  console.log(`Found ${userServices.length} user services to process.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const svc of userServices) {
    // Try to find registry entry by name
    const registryEntry = await prisma.serviceRegistry.findUnique({
      where: { name: svc.serviceName }
    });

    if (!registryEntry) {
      // Create new registry entry if orphan
      console.log(`➕ Creating registry entry for orphans: ${svc.serviceName}`);
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
      // Update existing entry if missing info or price is 0
      const updates: any = {};
      
      const regPrice = Number(registryEntry.defaultPrice || 0);
      const svcPrice = Number(svc.periodicPrice || 0);

      if (regPrice === 0 && svcPrice > 0) {
        updates.defaultPrice = svcPrice;
      }

      if (!registryEntry.iconUrl && svc.iconUrl) updates.iconUrl = svc.iconUrl;
      if (!registryEntry.description && svc.description) updates.description = svc.description;
      if (!registryEntry.category && svc.category) updates.category = svc.category;
      if (!registryEntry.url && svc.url) updates.url = svc.url;
      if (!registryEntry.websiteUrl && svc.websiteUrl) updates.websiteUrl = svc.websiteUrl;

      if (Object.keys(updates).length > 0) {
        console.log(`📝 Updating registry entry for: ${svc.serviceName}`);
        await prisma.serviceRegistry.update({
          where: { id: registryEntry.id },
          data: updates
        });
        updatedCount++;
      }
    }
  }

  console.log('✅ Synchronization complete!');
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during sync:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
