import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { ServiceGridPicker } from "@/components/services/ServiceGridPicker";
import { ImportExportTools } from "@/components/services/ImportExportTools";
import { VoiceServiceAssigner } from "@/components/services/VoiceServiceAssigner";
import { ServicesListClient } from "./ServicesListClient";

export const metadata: Metadata = { title: "Služby" };

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // 1. Fetch owned services
  const ownedServices = await prisma.service.findMany({
    where: { ownerId: user.id, status: { not: "ARCHIVED" } },
    include: {
      owner: { select: { name: true, avatar: true } },
      _count: {
        select: {
          accessGrants: { where: { status: "ACTIVE" } },
          accessRequests: { where: { status: "PENDING" } },
        },
      },
    },
    orderBy: { serviceName: "asc" },
  });

  // 2. Fetch services where user has an active grant (Shared with me)
  const sharedGrants = await prisma.accessGrant.findMany({
    where: { granteeId: user.id, status: "ACTIVE" },
    include: {
      service: {
        include: {
          owner: { select: { name: true, avatar: true } },
        }
      }
    }
  });

  const sharedServices = sharedGrants.map(g => ({
    ...g.service,
    isShared: true,
  }));

  // 3. Fetch available services from friends (Discover)
  const availableServices = await getAvailableServices(user.id);

  const allServices = [
    ...ownedServices.map(s => ({ ...s, isShared: false, isAvailable: false })),
    ...sharedServices.map(s => ({ ...s, isAvailable: false })),
    ...availableServices.map(s => ({ ...s, isShared: false, isAvailable: true }))
  ].filter((s, i, self) => self.findIndex(x => x.id === s.id) === i);

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header services-header">
        <div>
          <h1 className="page-title">Služby</h1>
          <p className="page-subtitle">
            Tvůj kompletní přehled předplatných a sdílení.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <VoiceServiceAssigner />
          <ImportExportTools />
        </div>
      </div>

      <ServiceGridPicker activeServiceNames={allServices.map((s: any) => s.serviceName)} />

      <ServicesListClient initialServices={allServices.map((s: any) => ({
        ...s,
        periodicPrice: s.periodicPrice.toString(),
        renewalDate: s.renewalDate?.toISOString() || null,
        isTerminated: s.isTerminated,
        isShared: s.isShared,
        isAvailable: s.isAvailable,
        hasPendingRequest: (s as any).hasPendingRequest,
        hasActiveGrant: (s as any).hasActiveGrant,
        freeSlots: (s as any).freeSlots
      })) as any} />
    </div>
  );
}

async function getAvailableServices(userId: string) {
  try {
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }], status: "ACCEPTED" },
    });
    const friendIds = friendships.map(f => f.requesterId === userId ? f.addresseeId : f.requesterId);
    if (friendIds.length === 0) return [];

    const services = await prisma.service.findMany({
      where: {
        ownerId: { in: friendIds },
        sharingStatus: "SHARING_ENABLED",
        sharingVisibility: { in: ["FRIENDS_ONLY", "PUBLIC"] },
        status: "ACTIVE",
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { accessGrants: { where: { status: "ACTIVE" } }, accessRequests: { where: { status: "PENDING" } } } },
      },
    });

    const requests = await prisma.accessRequest.findMany({
      where: { requesterId: userId, status: "PENDING" },
      select: { serviceId: true }
    });
    const requestedIds = new Set(requests.map(r => r.serviceId));

    return services.map(s => ({
      ...s,
      isShared: false,
      isAvailable: true,
      hasPendingRequest: requestedIds.has(s.id),
      freeSlots: s.maxSharedSlots > 0 ? Math.max(0, s.maxSharedSlots - (s._count.accessGrants)) : null,
    }));
  } catch { return []; }
}
