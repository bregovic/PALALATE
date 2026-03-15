"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  payload: Record<string, string>;
  createdAt: string;
  readAt: string | null;
}

const NOTIF_ICONS: Record<string, string> = {
  ACCESS_REQUEST_RECEIVED: "📬",
  ACCESS_REQUEST_APPROVED: "✅",
  ACCESS_REQUEST_REJECTED: "❌",
  ACCESS_EXPIRING_SOON: "⏰",
  SERVICE_RENEWAL_SOON: "🔄",
  SETTLEMENT_CREATED: "💰",
  TRANSACTION_OVERDUE: "⚠️",
  FRIEND_REQUEST_RECEIVED: "👋",
  FRIEND_REQUEST_ACCEPTED: "🤝",
  CREDENTIAL_VIEWED: "👁️",
};

const NOTIF_LABELS: Record<string, string> = {
  ACCESS_REQUEST_RECEIVED: "Nová žádost o přístup",
  ACCESS_REQUEST_APPROVED: "Přístup schválen",
  ACCESS_REQUEST_REJECTED: "Žádost zamítnuta",
  ACCESS_EXPIRING_SOON: "Přístup brzy vyprší",
  SERVICE_RENEWAL_SOON: "Blíží se obnova",
  SETTLEMENT_CREATED: "Nové vyúčtování",
  TRANSACTION_OVERDUE: "Transakce po splatnosti",
  FRIEND_REQUEST_RECEIVED: "Nová žádost o kontakt",
  FRIEND_REQUEST_ACCEPTED: "Kontakt přijat",
  CREDENTIAL_VIEWED: "Zobrazení přihlašovacích údajů",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: "all" }),
    });
    load();
    router.refresh(); // Sync sidebar badge
  }

  async function markAsRead(id: string) {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.readAt) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    load();
    router.refresh(); // Sync sidebar badge
  }

  useEffect(() => { load(); }, []);

  const unread = notifications.filter((n) => !n.readAt).length;

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return "právě teď";
    if (diff < 3600) return `před ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `před ${Math.floor(diff / 3600)} hod`;
    return date.toLocaleDateString("cs-CZ");
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifikace</h1>
          <p className="page-subtitle">
            {unread > 0
              ? `${unread} nepřečtených. Čti, nebo to přečte za tebe AI. 🤖`
              : "Vše přečteno. Jsi rychlý. 🚀"}
          </p>
        </div>
        {unread > 0 && (
          <button
            id="mark-all-read-btn"
            className="btn btn-secondary"
            onClick={markAllRead}
          >
            Označit vše jako přečtené
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: "var(--radius-md)" }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <div className="empty-title">Žádné notifikace</div>
            <p className="empty-desc">Klid. Žádný poplach, žádné zprávy, žádný stres. 😌</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifications.map((n, i) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px 24px",
                  borderBottom: i < notifications.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  background: n.readAt ? "transparent" : "rgba(139, 92, 246, 0.04)",
                  transition: "background var(--transition-fast)",
                  cursor: n.readAt ? "default" : "pointer",
                }}
                className={!n.readAt ? "hover-notif" : ""}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--radius-md)",
                  background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.2rem", flexShrink: 0,
                }}>
                  {NOTIF_ICONS[n.type] || "🔔"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.readAt ? 400 : 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                    {n.type === 'FRIEND_REQUEST_ACCEPTED' && n.payload?.friendName 
                      ? `${n.payload.friendName} přijal(a) váš kontakt`
                      : (NOTIF_LABELS[n.type] || n.type)}
                  </div>
                  {n.payload?.serviceName && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                      Služba: <strong>{n.payload.serviceName}</strong>
                      {n.payload.requesterName ? ` • Od: ${n.payload.requesterName}` : ""}
                      {n.payload.ownerName ? ` • Schválil/a: ${n.payload.ownerName}` : ""}
                    </div>
                  )}
                  {n.type === 'FRIEND_REQUEST_ACCEPTED' && !n.payload?.friendName && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                      Vaše žádost o přátelství byla schválena.
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmtDate(n.createdAt)}</span>
                  {!n.readAt && <div className="notif-dot" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
