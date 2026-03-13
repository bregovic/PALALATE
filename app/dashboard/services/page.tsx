import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { ServiceGridPicker } from "@/components/services/ServiceGridPicker";
import { ImportExportTools } from "@/components/services/ImportExportTools";

export const metadata: Metadata = { title: "Mé služby" };

const CATEGORY_ICONS: Record<string, string> = {
  streaming: "🎬",
  music: "🎵",
  gaming: "🎮",
  productivity: "💼",
  cloud: "☁️",
  design: "🎨",
  ai: "🤖",
  security: "🔐",
  fitness: "💪",
  education: "📚",
  news: "📰",
  other: "📦",
};

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
    orderBy: { createdAt: "desc" },
  });

  const totalMonthly = services
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum: number, s: any) => {
      let monthly = Number(s.periodicPrice);
      if (s.billingCycle === "YEARLY") monthly /= 12;
      if (s.billingCycle === "QUARTERLY") monthly /= 3;
      if (s.billingCycle === "WEEKLY") monthly *= 4.33;
      return sum + monthly;
    }, 0);

  const billingLabels: Record<string, string> = {
    WEEKLY: "týdně",
    MONTHLY: "měsíčně",
    QUARTERLY: "čtvrtletně",
    YEARLY: "ročně",
    CUSTOM: "",
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      ACTIVE: { label: "Aktivní", cls: "badge-green" },
      PAUSED: { label: "Pozastaveno", cls: "badge-yellow" },
      CANCELLED: { label: "Zrušeno", cls: "badge-red" },
      DRAFT: { label: "Koncept", cls: "badge-gray" },
    };
    const m = map[status] || { label: status, cls: "badge-gray" };
    return <span className={`badge ${m.cls}`}>{m.label}</span>;
  };

  const sharingBadge = (status: string) => {
    if (status === "SHARING_ENABLED") return <span className="sharing-indicator sharing-enabled">Sdílím</span>;
    if (status === "SHARING_PAUSED") return <span className="sharing-indicator sharing-paused">Pauza</span>;
    return <span className="sharing-indicator sharing-disabled">Nesdílím</span>;
  };

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

      {services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <div className="empty-title">Zatím žádné služby</div>
            <p className="empty-desc">
              Víme, že platíš Spotify, Netflix a dalších 7 věcí. Přidej je sem a konečně
              zjisti, kolik tě to všechno stojí. 🫢
            </p>
            <Link href="/dashboard/services/new" className="btn btn-primary mt-4" id="empty-add-service-btn">
              Přidat první službu
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Služba</th>
                  <th>Cena</th>
                  <th>Perioda</th>
                  <th>Obnova</th>
                  <th>Stav</th>
                  <th>Sdílení</th>
                  <th>Uživatelé</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => {
                  const icon =
                    CATEGORY_ICONS[svc.category?.toLowerCase() || "other"] || "📦";
                  const days = svc.renewalDate
                    ? Math.ceil((new Date(svc.renewalDate).getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <tr key={svc.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: "1.3rem", width: 32, textAlign: "center" }}>{icon}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {svc.serviceName}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {svc.providerName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {Number(svc.periodicPrice).toFixed(2)} {svc.currency}
                      </td>
                      <td>{billingLabels[svc.billingCycle]}</td>
                      <td>
                        {days !== null ? (
                          <span style={{ color: days <= 7 ? "var(--warning-400)" : "var(--text-secondary)", fontSize: "0.85rem" }}>
                            {days <= 0 ? "Dnes!" : `za ${days} dní`}
                          </span>
                        ) : (
                          <span className="text-muted">–</span>
                        )}
                      </td>
                      <td>{statusBadge(svc.status)}</td>
                      <td>{sharingBadge(svc.sharingStatus)}</td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {svc._count.accessGrants} aktivních
                          {svc._count.accessRequests > 0 && (
                            <span className="badge badge-yellow" style={{ marginLeft: 6 }}>
                              {svc._count.accessRequests} žádostí
                            </span>
                          )}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/services/${svc.id}`}
                          className="btn btn-ghost btn-sm"
                          id={`service-detail-${svc.id}`}
                        >
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
