import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vyúčtování" };

export default async function SettlementsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [periods, myItems] = await Promise.all([
    prisma.settlementPeriod.findMany({
      where: { service: { ownerId: user.id } },
      include: {
        service: { select: { serviceName: true } },
        items: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.settlementItem.findMany({
      where: { userId: user.id },
      include: {
        period: { include: { service: { select: { serviceName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const totalOwed = myItems
    .filter((i) => i.status === "PROPOSED" || i.status === "OVERDUE")
    .reduce((s: number, i) => s + Number(i.amountDue), 0);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PROPOSED: { label: "📋 Navrženo", cls: "badge-yellow" },
      CONFIRMED: { label: "✓ Potvrzeno", cls: "badge-blue" },
      PAID: { label: "💚 Zaplaceno", cls: "badge-green" },
      OVERDUE: { label: "⚠️ Po splatnosti", cls: "badge-red" },
      DISPUTED: { label: "❓ Sporné", cls: "badge-gray" },
      OPEN: { label: "Otevřeno", cls: "badge-blue" },
      CLOSED: { label: "Uzavřeno", cls: "badge-green" },
    };
    const m = map[status] || { label: status, cls: "badge-gray" };
    return <span className={`badge ${m.cls}`}>{m.label}</span>;
  };

  const fmt = (n: number | { toString(): string }, currency = "CZK") =>
    `${Number(n).toFixed(2)} ${currency}`;

  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("cs-CZ");

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vyúčtování</h1>
          <p className="page-subtitle">
            {totalOwed > 0
              ? `Celkem dlužíš ${totalOwed.toFixed(2)} Kč. Čas platit, kamaráde! 💸`
              : "Všechno zaplaceno. Jsi zlatý! 🏆"}
          </p>
        </div>
      </div>

      {totalOwed > 0 && (
        <div className="alert alert-warning mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
          <span>
            Máš nevyrovnané závazky celkem <strong>{totalOwed.toFixed(2)} Kč</strong>.
            Doporuč platbu svým věřitelům!
          </span>
        </div>
      )}

      {/* Mé závazky */}
      <div className="card mb-6">
        <div className="card-header">
          <h3>💳 Mé závazky (platím já)</h3>
        </div>
        {myItems.length === 0 ? (
          <div className="card-body">
            <p className="text-muted text-sm">Žádné závazky. Jsi čistý! ✨</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Služba</th>
                  <th>Období</th>
                  <th>Částka</th>
                  <th>Stav</th>
                  <th>Poznámka</th>
                </tr>
              </thead>
              <tbody>
                {myItems.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.period.service.serviceName}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {fmtDate(item.period.periodFrom)} – {fmtDate(item.period.periodTo)}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                      {fmt(item.amountDue, item.period.currency)}
                    </td>
                    <td>{statusBadge(item.status)}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {item.explanation || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vyúčtování mých služeb */}
      <div className="card">
        <div className="card-header">
          <h3>📊 Vyúčtování mých služeb</h3>
        </div>
        {periods.length === 0 ? (
          <div className="card-body">
            <p className="text-muted text-sm">
              Zatím žádná vyúčtování. Generuj je z detailu konkrétní sdílené služby.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Služba</th>
                  <th>Období</th>
                  <th>Celkem</th>
                  <th>Účastníků</th>
                  <th>Stav</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {p.service.serviceName}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {fmtDate(p.periodFrom)} – {fmtDate(p.periodTo)}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {fmt(p.totalCost, p.currency)}
                    </td>
                    <td>
                      <span className="badge badge-purple">{p.items.length} lidí</span>
                    </td>
                    <td>{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
