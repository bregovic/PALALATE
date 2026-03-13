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
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Služba</th>
                  <th className="hidden-mobile" style={{ textAlign: "left", padding: "12px 16px" }}>Kategorie</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Cena</th>
                  <th className="hidden-mobile" style={{ textAlign: "left", padding: "12px 16px" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Sdílí</th>
                  <th></th>
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
                          <span className="hidden-mobile" style={{ fontSize: "1.4rem", lineHeight: 1, width: 32, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                          <div>
                            <div className="font-bold text-primary" style={{ fontSize: "0.9rem", lineHeight: 1.2 }}>{svc.serviceName}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{svc.providerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden-mobile" style={{ padding: "16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, background: "var(--bg-elevated)", padding: "4px 10px", borderRadius: "var(--radius-full)", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", lineHeight: 1 }}>
                            {svc.category || "Ostatní"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                          {Number(svc.periodicPrice).toLocaleString()} {svc.currency}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>/ {svc.billingCycle}</div>
                      </td>
                      <td className="hidden-mobile" style={{ padding: "16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {svc.freeSlots === null ? (
                            <span className="badge badge-green" style={{ padding: "4px 10px", lineHeight: 1 }}>Volno</span>
                          ) : (
                            <span className={`badge ${svc.freeSlots > 0 ? 'badge-blue' : 'badge-red'}`} style={{ padding: "4px 10px", lineHeight: 1 }}>
                              {svc.freeSlots > 0 ? `${svc.freeSlots} volných míst` : 'Obsazeno'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem', flexShrink: 0 }}>
                            {svc.owner.name[0].toUpperCase()}
                          </div>
                          <span className="hidden-mobile" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{svc.owner.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "right" }}>
                        <button
                          className={`btn ${hasRequested ? 'btn-glow' : 'btn-primary'} btn-sm`}
                          style={{ minWidth: 90 }}
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
