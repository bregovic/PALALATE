import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [
    services,
    pendingRequests,
    activeGrants,
    unpaidItems,
    notifications,
  ] = await Promise.all([
    prisma.service.count({ where: { ownerId: user.id, status: { not: "ARCHIVED" } } }),
    prisma.accessRequest.count({ where: { ownerId: user.id, status: "PENDING" } }),
    prisma.accessGrant.count({ where: { granteeId: user.id, status: "ACTIVE" } }),
    prisma.settlementItem.count({
      where: { userId: user.id, status: { in: ["PROPOSED", "OVERDUE"] } },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  // Moje služby – přehled
  const myServices = await prisma.service.findMany({
    where: { ownerId: user.id, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true, serviceName: true, providerName: true,
      periodicPrice: true, currency: true, billingCycle: true,
      renewalDate: true, sharingStatus: true, status: true,
      _count: { select: { accessGrants: { where: { status: "ACTIVE" } } } },
    },
  });

  // Sdílené se mnou
  const sharedWithMe = await prisma.accessGrant.findMany({
    where: { granteeId: user.id, status: "ACTIVE" },
    include: {
      service: {
        select: { id: true, serviceName: true, providerName: true, periodicPrice: true, currency: true },
      },
      grantedBy: { select: { name: true } },
    },
    take: 5,
  });

  // Blížící se obnovy (do 14 dní)
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);
  const renewals = await prisma.service.findMany({
    where: {
      ownerId: user.id,
      status: "ACTIVE",
      renewalDate: { lte: soon, gte: new Date() },
    },
    orderBy: { renewalDate: "asc" },
    take: 3,
    select: { id: true, serviceName: true, renewalDate: true, periodicPrice: true, currency: true },
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Dobré ráno" : hour < 18 ? "Dobré odpoledne" : "Dobrý večer";

  const billingLabels: Record<string, string> = {
    WEEKLY: "týdně",
    MONTHLY: "měsíčně",
    QUARTERLY: "čtvrtletně",
    YEARLY: "ročně",
    CUSTOM: "",
  };

  const sharingBadge = (status: string) => {
    if (status === "SHARING_ENABLED") return <span className="sharing-indicator sharing-enabled">Sdílím</span>;
    if (status === "SHARING_PAUSED") return <span className="sharing-indicator sharing-paused">Pozastaveno</span>;
    return <span className="sharing-indicator sharing-disabled">Nesdílím</span>;
  };

  const daysTo = (date: Date) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

  return (
    <div className="page-content animate-fade-in">
      {/* Hero */}
      <div className="dashboard-hero mb-6">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", marginBottom: 6 }}>
              {greeting}, <span className="gradient-text">{user.name.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-secondary">
              Tady je přehled tvých předplatných. Doufáme, že Spotify playlist byl dnes ok. 🎵
            </p>
          </div>
          <Link href="/dashboard/services/new" className="btn btn-primary" id="add-service-hero-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Přidat službu
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4 mb-6">
        <div className="stat-card">
          <div className="stat-label">Mé služby</div>
          <div className="stat-value">{services}</div>
          <div className="stat-change">aktivní předplatná</div>
          <div className="stat-icon" style={{ background: "rgba(139,92,246,0.15)", color: "var(--brand-400)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Čekající žádosti</div>
          <div className="stat-value" style={{ color: pendingRequests > 0 ? "var(--warning-400)" : "var(--text-primary)" }}>
            {pendingRequests}
          </div>
          <div className="stat-change">ke schválení</div>
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning-400)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sdíleno se mnou</div>
          <div className="stat-value">{activeGrants}</div>
          <div className="stat-change">aktivní přístupy</div>
          <div className="stat-icon" style={{ background: "rgba(6,182,212,0.15)", color: "var(--accent-400)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Nevyrovnané</div>
          <div className="stat-value" style={{ color: unpaidItems > 0 ? "var(--danger-400)" : "var(--text-primary)" }}>
            {unpaidItems}
          </div>
          <div className="stat-change">položky k uhrazení</div>
          <div className="stat-icon" style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger-400)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid-2 mb-6" style={{ gridTemplateColumns: "1.5fr 1fr" }}>

        {/* Mé služby */}
        <div className="card">
          <div className="card-header">
            <h3>Mé služby</h3>
            <Link href="/dashboard/services" className="btn btn-ghost btn-sm">Zobrazit vše →</Link>
          </div>
          <div className="card-body" style={{ padding: "12px 24px 20px" }}>
            {myServices.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px 0" }}>
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                </div>
                <div className="empty-title">Žádné služby</div>
                <p className="empty-desc">Přidej své první předplatné a začni ho spravovat jako profesionál.</p>
                <Link href="/dashboard/services/new" className="btn btn-primary btn-sm mt-4">
                  Přidat první službu
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {myServices.map((svc) => (
                  <Link
                    key={svc.id}
                    href={`/dashboard/services/${svc.id}`}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: "var(--radius-md)", transition: "background var(--transition-fast)", textDecoration: "none" }}
                    className="service-row"
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                      {svc.serviceName.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svc.serviceName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{svc.providerName}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {Number(svc.periodicPrice).toFixed(0)} {svc.currency}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{billingLabels[svc.billingCycle]}</div>
                    </div>
                    {sharingBadge(svc.sharingStatus)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Blížící se obnovy */}
          <div className="card">
            <div className="card-header">
              <h4>⏰ Blíží se obnova</h4>
            </div>
            <div className="card-body">
              {renewals.length === 0 ? (
                <p className="text-muted text-sm">Žádná obnova v příštích 14 dnech. Pohoda! ✌️</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {renewals.map((r) => {
                    const days = daysTo(r.renewalDate!);
                    return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{r.serviceName}</div>
                          <div style={{ fontSize: "0.75rem", color: days <= 3 ? "var(--danger-400)" : "var(--warning-400)" }}>
                            za {days} dní
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                          {Number(r.periodicPrice).toFixed(0)} {r.currency}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sdíleno se mnou */}
          <div className="card">
            <div className="card-header">
              <h4>🤝 Sdíleno se mnou</h4>
              <Link href="/dashboard/requests" className="btn btn-ghost btn-sm">Vše →</Link>
            </div>
            <div className="card-body">
              {sharedWithMe.length === 0 ? (
                <p className="text-muted text-sm">Nikdo ti zatím nic nesdílí. Zkus se zeptat kamarádů! 😅</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sharedWithMe.map((g) => (
                    <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{g.service.serviceName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>od {g.grantedBy.name}</div>
                      </div>
                      <span className="badge badge-green">Aktivní</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-body" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/dashboard/services/new" className="btn btn-secondary" id="qa-add-service">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Přidat službu
          </Link>
          <Link href="/dashboard/contacts" className="btn btn-secondary" id="qa-contacts">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>
            Kontakty
          </Link>
          <Link href="/dashboard/requests" className="btn btn-secondary" id="qa-requests">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
            Žádosti
            {pendingRequests > 0 && <span className="nav-badge">{pendingRequests}</span>}
          </Link>
          <Link href="/dashboard/settlements" className="btn btn-secondary" id="qa-settlements">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Vyúčtování
          </Link>
        </div>
      </div>
    </div>
  );
}
