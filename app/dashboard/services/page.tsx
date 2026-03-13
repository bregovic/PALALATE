import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { ServiceGridPicker } from "@/components/services/ServiceGridPicker";
import { ImportExportTools } from "@/components/services/ImportExportTools";
import { ServicesListClient } from "./ServicesListClient";

export const metadata: Metadata = { title: "Mé služby" };

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

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
    orderBy: { serviceName: "asc" },
  });

  const totalMonthly = services
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum: number, s: any) => {
      let monthly = Number(s.periodicPrice);
      if (s.billingCycle === "YEARLY") monthly /= 12;
      if (s.billingCycle === "SEMI_ANNUALLY") monthly /= 6;
      if (s.billingCycle === "QUARTERLY") monthly /= 3;
      if (s.billingCycle === "WEEKLY") monthly *= 4.33;
      return sum + monthly;
    }, 0);

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mé služby</h1>
          <p className="page-subtitle">
            Celkem utrácíš ~{totalMonthly.toFixed(0)} Kč / měsíc.{" "}
            {totalMonthly > 2000 ? "Na tvém místě bychom začali škrtat. 💸" : "Pohoda! 😎"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <ImportExportTools />
          <Link href="/dashboard/services/new" className="btn btn-primary" id="add-service-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            Textový formulář
          </Link>
        </div>
      </div>

      <ServiceGridPicker activeServiceNames={services.map(s => s.serviceName)} />

      <ServicesListClient initialServices={services.map(s => ({
        ...s,
        periodicPrice: s.periodicPrice.toString(),
        renewalDate: s.renewalDate?.toISOString() || null
      })) as any} />
    </div>
  );
}
