"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Service {
  id: string;
  serviceName: string;
  providerName: string;
  category: string | null;
  description: string | null;
  periodicPrice: number;
  currency: string;
  billingCycle: string;
  freeSlots: number | null;
  owner: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

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

export default function DiscoverPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services/available")
      .then(res => res.json())
      .then(data => {
        setServices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleRequestAccess(serviceId: string) {
    setRequestingId(serviceId);
    try {
      const res = await fetch(`/api/services/${serviceId}/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Ahoj, měl bych zájem o sdílení této služby." }),
      });
      if (res.ok) {
        alert("Žádost byla odeslána! Majitel služby tě bude kontaktovat.");
      } else {
        const err = await res.json();
        alert(err.error || "Chyba při odesílání žádosti.");
      }
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌍 Služby přátel</h1>
          <p className="page-subtitle">Objev služby, které sdílejí tvoji přátelé a mají volná místa.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="p-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton mb-4" style={{ height: 60, borderRadius: 12 }} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="empty-state p-12">
              <div className="empty-icon text-4xl mb-4">🌍</div>
              <h3 className="empty-title">Zatím se nic nesdílí</h3>
              <p className="empty-desc max-w-sm mx-auto">
                Tvoji přátelé zatím žádné služby veřejně nesdílejí, nebo jsou už všechna místa obsazená. Skus jim napsat!
              </p>
              <Link href="/dashboard/contacts" className="btn btn-primary mt-6">Zvětšit okruh přátel</Link>
            </div>
          ) : (
            <table style={{ tableLayout: "fixed", width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ textAlign: "left", padding: "16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Služba</th>
                  <th className="hidden-mobile" style={{ textAlign: "left", padding: "16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "120px" }}>Kategorie</th>
                  <th style={{ textAlign: "left", padding: "16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "120px" }}>Cena</th>
                  <th className="hidden-mobile" style={{ textAlign: "left", padding: "16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "130px" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "140px" }}>Sdílí</th>
                  <th style={{ width: "110px" }}></th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc: any) => {
                  const icon = CATEGORY_ICONS[svc.category?.toLowerCase() || "other"] || "📦";
                  const hasRequested = svc.hasPendingRequest;

                  return (
                    <tr key={svc.id} style={{ borderBottom: "1px solid var(--border-subtle)", verticalAlign: "middle" }}>
                      <td style={{ padding: "16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span className="hidden-mobile" style={{ fontSize: "1.4rem", width: 32, flexShrink: 0, textAlign: "center" }}>{icon}</span>
                          <div style={{ overflow: "hidden" }}>
                            <div className="font-bold text-primary" style={{ fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svc.serviceName}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svc.providerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden-mobile" style={{ padding: "16px", verticalAlign: "middle" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 600, background: "var(--bg-elevated)", padding: "4px 8px", borderRadius: "6px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {svc.category || "Ostatní"}
                        </span>
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                          {Number(svc.periodicPrice).toLocaleString()} {svc.currency}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>/ {svc.billingCycle}</div>
                      </td>
                      <td className="hidden-mobile" style={{ padding: "16px", verticalAlign: "middle" }}>
                        {svc.freeSlots === null ? (
                          <span className="badge badge-green">Volno</span>
                        ) : (
                          <span className={`badge ${svc.freeSlots > 0 ? 'badge-blue' : 'badge-red'}`}>
                            {svc.freeSlots > 0 ? `${svc.freeSlots} místa` : 'Obsazeno'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', flexShrink: 0 }}>
                            {svc.owner.name[0].toUpperCase()}
                          </div>
                          <span className="hidden-mobile" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svc.owner.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "right" }}>
                        <button
                          className={`btn ${hasRequested ? 'btn-glow' : 'btn-primary'} btn-sm`}
                          style={{ width: "100%", maxWidth: "90px" }}
                          onClick={() => !hasRequested && handleRequestAccess(svc.id)}
                          disabled={requestingId === svc.id || svc.freeSlots === 0 || hasRequested}
                        >
                          {requestingId === svc.id ? "..." : (hasRequested ? "Požádáno" : "Požádat")}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
