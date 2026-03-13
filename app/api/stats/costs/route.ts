import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

interface PriceInterval {
  startDate: Date | string;
  endDate: Date | string | null;
  price: any;
}

interface ServiceWithIntervals {
  id: string;
  serviceName: string;
  category: string | null;
  periodicPrice: any;
  billingCycle: string;
  status: string;
  isTerminated: boolean;
  url: string | null;
  createdAt: Date;
  startDate: Date | string | null;
  archivedAt: Date | null;
  priceIntervals: PriceInterval[];
}

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Fetch all services including ones that are archived/terminated for historical data
    const services = await (prisma.service as any).findMany({
      where: { ownerId: user.id },
      include: {
        priceIntervals: { orderBy: { startDate: "asc" } },
      }
    }) as ServiceWithIntervals[];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // We'll calculate data for the last 12 months + current year
    const monthlyStats: Record<string, { total: number; byCategory: Record<string, number> }> = {};
    const yearlyStats: Record<number, number> = {};
    const serviceRankings: Record<string, { name: string; total: number }> = {};
    const categoryRankings: Record<string, number> = {};
    
    let lifetimeTotal = 0;

    // Helper to get price for a specific date
    const getPriceForDate = (service: ServiceWithIntervals, date: Date) => {
      // Check intervals first
      const interval = service.priceIntervals.find((pi: PriceInterval) => {
        const start = new Date(pi.startDate);
        const end = pi.endDate ? new Date(pi.endDate) : null;
        return date >= start && (!end || date <= end);
      });

      const price = interval ? Number(interval.price) : Number(service.periodicPrice);
      const cycle = service.billingCycle;

      // Normalize to monthly
      switch (cycle) {
        case "WEEKLY": return price * 4.33;
        case "MONTHLY": return price;
        case "QUARTERLY": return price / 3;
        case "SEMI_ANNUALLY": return price / 6;
        case "YEARLY": return price / 12;
        case "ONEOFF": 
          // One-off prices are tricky in a monthly timeline. 
          // For now, let's only count them in the month they happened (startDate).
          const sdRaw = service.startDate || service.createdAt;
          const sd = new Date(sdRaw);
          if (date.getMonth() === sd.getMonth() && date.getFullYear() === sd.getFullYear()) {
             return price;
          }
          return 0;
        default: return price;
      }
    };

    // Iterate through months from the earliest service start date to now
    let earliestDate = new Date();
    services.forEach((s: ServiceWithIntervals) => {
      if (s.startDate && new Date(s.startDate) < earliestDate) {
        earliestDate = new Date(s.startDate);
      } else if (new Date(s.createdAt) < earliestDate) {
        earliestDate = new Date(s.createdAt);
      }
    });

    // Start from the beginning of that month
    let iterDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    
    while (iterDate <= now) {
      const monthKey = `${iterDate.getFullYear()}-${String(iterDate.getMonth() + 1).padStart(2, '0')}`;
      const year = iterDate.getFullYear();
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { total: 0, byCategory: {} };
      }

      services.forEach((service: ServiceWithIntervals) => {
        // Check if service was active during iterDate
        const startRaw = service.startDate || service.createdAt;
        const start = new Date(startRaw);
        
        const isArchived = service.status === "ARCHIVED" || service.isTerminated;
        const archivedDate = service.archivedAt ? new Date(service.archivedAt) : null;

        const wasActive = iterDate >= new Date(start.getFullYear(), start.getMonth(), 1) && 
                          (!isArchived || !archivedDate || iterDate <= archivedDate);

        if (wasActive) {
          const monthlyPrice = getPriceForDate(service, iterDate);
          
          monthlyStats[monthKey].total += monthlyPrice;
          yearlyStats[year] = (yearlyStats[year] || 0) + monthlyPrice;
          lifetimeTotal += monthlyPrice;

          // Category stats
          const cat = service.category || "Ostatní";
          monthlyStats[monthKey].byCategory[cat] = (monthlyStats[monthKey].byCategory[cat] || 0) + monthlyPrice;
          categoryRankings[cat] = (categoryRankings[cat] || 0) + monthlyPrice;

          // Service rankings
          if (!serviceRankings[service.id]) {
            serviceRankings[service.id] = { name: service.serviceName, total: 0 };
          }
          serviceRankings[service.id].total += monthlyPrice;
        }
      });

      // Move to next month
      iterDate.setMonth(iterDate.getMonth() + 1);
    }

    return NextResponse.json({
      lifetimeTotal,
      yearlyStats,
      monthlyStats,
      serviceRankings: Object.values(serviceRankings).sort((a, b: any) => b.total - a.total),
      categoryRankings: Object.entries(categoryRankings)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total),
      currentMonthly: monthlyStats[`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`]?.total || 0
    });

  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Stats API]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
