import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { ServiceGridPicker } from "@/components/services/ServiceGridPicker";
import { ImportExportTools } from "@/components/services/ImportExportTools";
import { VoiceServiceAssigner } from "@/components/services/VoiceServiceAssigner";
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
    .filter((s: any) => s.status === "ACTIVE")
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
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <VoiceServiceAssigner />
          <ImportExportTools />
        </div>
      </div>

      <ServiceGridPicker activeServiceNames={services.map((s: import("@prisma/client").Service) => s.serviceName)} />

      <ServicesListClient initialServices={services.map((s: import("@prisma/client").Service) => ({
        ...s,
        periodicPrice: s.periodicPrice.toString(),
        renewalDate: s.renewalDate?.toISOString() || null,
        isTerminated: s.isTerminated
      })) as any} />
    </div>
  );
}
