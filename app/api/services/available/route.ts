import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    // 1. Get IDs of all accepted friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: user.id },
          { addresseeId: user.id },
        ],
        status: "ACCEPTED",
      },
    });

    const friendIds = friendships.map(f => f.requesterId === user.id ? f.addresseeId : f.requesterId);

    if (friendIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Get services shared by these friends
    // We only show services where sharingStatus is SHARING_ENABLED
    // and sharingVisibility is PUBLIC or FRIENDS_ONLY
    const services = await prisma.service.findMany({
      where: {
        ownerId: { in: friendIds },
        sharingStatus: "SHARING_ENABLED",
        sharingVisibility: { in: ["FRIENDS_ONLY", "PUBLIC"] },
        status: "ACTIVE",
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { 
          select: { 
            accessGrants: { where: { status: "ACTIVE" } },
            manualSlots: true 
          } 
        },
      },
    });

    // 3. Get my pending requests and active grants
    const [myRequests, myGrants] = await Promise.all([
      prisma.accessRequest.findMany({
        where: { requesterId: user.id, status: "PENDING" },
        select: { serviceId: true }
      }),
      prisma.accessGrant.findMany({
        where: { granteeId: user.id, status: "ACTIVE" },
        select: { serviceId: true }
      })
    ]);

    const requestedServiceIds = new Set(myRequests.map(r => r.serviceId));
    const grantedServiceIds = new Set(myGrants.map(g => g.serviceId));

    // 4. Map to include free slots info and request status
    const enrichedServices = services.map(s => {
      const occupied = s._count.accessGrants + s._count.manualSlots;
      const freeSlots = s.maxSharedSlots > 0 ? Math.max(0, s.maxSharedSlots - occupied) : null;
      return {
        ...s,
        freeSlots,
        hasPendingRequest: requestedServiceIds.has(s.id),
        hasActiveGrant: grantedServiceIds.has(s.id),
      };
    });

    return NextResponse.json(enrichedServices);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/services/available]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
