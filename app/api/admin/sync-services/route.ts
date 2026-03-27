import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const isBase64 = (s: string | null | undefined) => !!s && s.startsWith("data:");

/** Returns true if iconA is "better" than iconB (base64 > http URL > null) */
function isBetterIcon(iconA: string | null | undefined, iconB: string | null | undefined): boolean {
  if (!iconA) return false;
  if (!iconB) return true;
  if (isBase64(iconA) && !isBase64(iconB)) return true; // uploaded beats favicon URL
  return false;
}

// POST /api/admin/sync-services — sync user services → registry + propagate icons back
export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    console.log('🚀 Starting service synchronization via API...');

    const userServices = await prisma.service.findMany({
      where: { status: { not: 'ARCHIVED' } }
    });

    let createdCount = 0;
    let updatedCount = 0;
    let iconsPropagated = 0;

    for (const svc of userServices) {
      const registryEntry = await prisma.serviceRegistry.findFirst({
        where: { name: { equals: svc.serviceName, mode: "insensitive" } }
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
        if (!registryEntry.description && svc.description) updates.description = svc.description;
        if (!registryEntry.category && svc.category) updates.category = svc.category;
        if (!registryEntry.url && svc.url) updates.url = svc.url;

        // Promote icon only if the user's icon is "better" than registry's
        if (isBetterIcon(svc.iconUrl, registryEntry.iconUrl)) {
          updates.iconUrl = svc.iconUrl;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.serviceRegistry.update({
            where: { id: registryEntry.id },
            data: updates,
          });
          updatedCount++;
        }

        // Propagate best available icon back to all user services
        const bestIcon = updates.iconUrl || registryEntry.iconUrl;
        if (bestIcon) {
          const isBestBase64 = isBase64(bestIcon);
          let result;
          if (isBestBase64) {
            // Push to everyone who doesn't have their own uploaded image
            result = await prisma.service.updateMany({
              where: {
                serviceName: { equals: registryEntry.name, mode: "insensitive" },
                NOT: { iconUrl: { startsWith: "data:" } },
              },
              data: { iconUrl: bestIcon },
            });
          } else {
            // Push URL favicon only to those with no icon
            result = await prisma.service.updateMany({
              where: {
                serviceName: { equals: registryEntry.name, mode: "insensitive" },
                OR: [{ iconUrl: null }, { iconUrl: "" }],
              },
              data: { iconUrl: bestIcon },
            });
          }
          iconsPropagated += result.count;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. Created: ${createdCount}, Updated: ${updatedCount}, Icons propagated: ${iconsPropagated}`
    });

  } catch (error) {
    console.error("Sync services error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}


// DELETE /api/admin/sync-services — deduplicate registry (merge duplicates by case-insensitive name)
export async function DELETE() {
  try {
    const user = await requireAuth();

    const allEntries = await prisma.serviceRegistry.findMany({
      orderBy: { createdAt: "asc" }, // keep oldest as canonical
    });

    // Group by lowercase name
    const groups: Record<string, typeof allEntries> = {};
    for (const entry of allEntries) {
      const key = entry.name.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }

    let mergedCount = 0;
    let deletedCount = 0;

    for (const [, entries] of Object.entries(groups)) {
      if (entries.length <= 1) continue;

      // Canonical = first (oldest). Merge best data into it.
      const canonical = entries[0];
      const duplicates = entries.slice(1);

      // Build best merged data from all duplicates
      const merged: any = {};
      for (const dup of duplicates) {
        if (!canonical.iconUrl && dup.iconUrl) merged.iconUrl = dup.iconUrl;
        if (!canonical.description && dup.description) merged.description = dup.description;
        if (!canonical.url && dup.url) merged.url = dup.url;
        if (!canonical.category && dup.category) merged.category = dup.category;
        if (Number(canonical.defaultPrice || 0) === 0 && Number(dup.defaultPrice || 0) > 0) {
          merged.defaultPrice = dup.defaultPrice;
        }
      }

      if (Object.keys(merged).length > 0) {
        await prisma.serviceRegistry.update({ where: { id: canonical.id }, data: merged });
        mergedCount++;
      }

      // Delete all duplicates
      const dupIds = duplicates.map(d => d.id);
      await prisma.serviceRegistry.deleteMany({ where: { id: { in: dupIds } } });
      deletedCount += dupIds.length;
    }

    // After dedup, do a full icon propagation pass
    const registryEntries = await prisma.serviceRegistry.findMany({
      where: { iconUrl: { not: null } },
    });
    let iconsPropagated = 0;
    for (const reg of registryEntries) {
      const r = await prisma.service.updateMany({
        where: {
          serviceName: { equals: reg.name, mode: "insensitive" },
          OR: [{ iconUrl: null }, { iconUrl: "" }],
        },
        data: { iconUrl: reg.iconUrl },
      });
      iconsPropagated += r.count;
    }

    return NextResponse.json({
      success: true,
      message: `Deduplicated: merged ${mergedCount} groups, deleted ${deletedCount} duplicates, propagated icons to ${iconsPropagated} user services.`
    });

  } catch (error) {
    console.error("Dedup error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

