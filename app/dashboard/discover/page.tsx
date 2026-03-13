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
  url?: string | null;
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
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  
  const [showCreds, setShowCreds] = useState<any>(null);
  const [credsLoading, setCredsLoading] = useState(false);
  const [revealedCreds, setRevealedCreds] = useState<any>(null);

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
        // Immediate update
        setServices(prev => prev.map(s => s.id === serviceId ? { ...s, hasPendingRequest: true } : s));
        alert("Žádost byla odeslána! Majitel služby tě bude kontaktovat.");
      } else {
        const err = await res.json();
        alert(err.error || "Chyba při odesílání žádosti.");
      }
    } finally {
      setRequestingId(null);
    }
  }

  async function handleViewCredentials(svc: any) {
    setShowCreds(svc);
    setCredsLoading(true);
    setRevealedCreds(null);
    try {
      // First get credential IDs
      const res = await fetch(`/api/services/${svc.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (data.credentials && data.credentials.length > 0) {
        // Auto-reveal first one for simplicity or show list
        const cid = data.credentials[0].id;
        const decRes = await fetch(`/api/services/${svc.id}/credentials/decrypt?cid=${cid}`);
        const decData = await decRes.json();
        setRevealedCreds({ ...data.credentials[0], ...decData });
      }
    } catch (e) {
      alert("Nepodařilo se načíst údaje. Zkuste to déle nebo kontaktujte majitele.");
    } finally {
      setCredsLoading(false);
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
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Služba</th>
                  <th className="hidden-mobile" style={{ textAlign: "left", padding: "16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "120px" }}>Kategorie</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "100px" }}>Cena</th>
                  <th className="hidden-mobile" style={{ textAlign: "left", padding: "16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "130px" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", width: "60px" }}>Sdílí</th>
                  <th style={{ width: "100px", padding: "12px 16px" }}></th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc: any) => {
                  const icon = CATEGORY_ICONS[svc.category?.toLowerCase() || "other"] || "📦";
                  const hasRequested = svc.hasPendingRequest;
                  const hasAccess = svc.hasActiveGrant;

                  return (
                    <tr key={svc.id} style={{ borderBottom: "1px solid var(--border-subtle)", verticalAlign: "middle" }}>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                        {hasAccess ? (
                           <span className="badge badge-green">Schváleno</span>
                        ) : (
                          svc.freeSlots === null ? (
                            <span className="badge badge-green">Volno</span>
                          ) : (
                            <span className={`badge ${svc.freeSlots > 0 ? 'badge-blue' : 'badge-red'}`}>
                              {svc.freeSlots > 0 ? `${svc.freeSlots} místa` : 'Obsazeno'}
                            </span>
                          )
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', flexShrink: 0 }} title={svc.owner.name}>
                          {svc.owner.name[0].toUpperCase()}
                        </div>
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "right" }}>
                        {hasAccess ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: "100%" }}
                            onClick={() => handleViewCredentials(svc)}
                          >
                            🔐 Údaje
                          </button>
                        ) : (
                          <button
                            className={`btn ${hasRequested ? 'btn-glow' : 'btn-primary'} btn-sm`}
                            style={{ width: "100%" }}
                            onClick={() => !hasRequested && handleRequestAccess(svc.id)}
                            disabled={requestingId === svc.id || svc.freeSlots === 0 || hasRequested}
                          >
                            {requestingId === svc.id ? "..." : (hasRequested ? "Požádáno" : "Požádat")}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Credentials Modal */}
      {showCreds && (
        <div className="modal-overlay" onClick={() => setShowCreds(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>🔐 Přihlašovací údaje</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreds(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="p-4 bg-muted rounded-xl mb-4 text-center">
                <div className="font-bold text-lg mb-1">{showCreds.serviceName}</div>
                <div className="text-xs text-muted uppercase">Sdílí {showCreds.owner.name}</div>
                {showCreds.url && (
                  <div className="mt-2 text-xs">
                    <a 
                      href={showCreds.url.startsWith('http') ? showCreds.url : `https://${showCreds.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 font-bold hover:underline break-all"
                    >
                      🔗 Otevřít službu
                    </a>
                  </div>
                )}
              </div>

              {credsLoading ? (
                <div className="flex flex-col items-center py-8">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <div className="text-sm text-muted">Načítám zabezpečené údaje...</div>
                </div>
              ) : revealedCreds ? (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-white rounded-xl border border-subtle">
                     <div className="text-[10px] font-bold uppercase text-muted mb-2 tracking-widest">Login / Email</div>
                     <div className="font-mono text-sm break-all bg-muted p-2 rounded border border-subtle flex justify-between items-center group">
                        <span>{revealedCreds.login || revealedCreds.value}</span>
                        <button 
                          className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon btn-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(revealedCreds.login || revealedCreds.value);
                            alert("Zkopírováno!");
                          }}
                        >
                          📋
                        </button>
                     </div>
                  </div>
                  {revealedCreds.password && (
                    <div className="p-4 bg-white rounded-xl border border-subtle">
                       <div className="text-[10px] font-bold uppercase text-muted mb-2 tracking-widest">Heslo</div>
                       <div className="font-mono text-sm break-all bg-muted p-2 rounded border border-subtle flex justify-between items-center group">
                          <span>{revealedCreds.password}</span>
                          <button 
                            className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon btn-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(revealedCreds.password);
                              alert("Zkopírováno!");
                            }}
                          >
                            📋
                          </button>
                       </div>
                    </div>
                  )}
                  {revealedCreds.note && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                       <div className="text-[10px] font-bold uppercase text-amber-700 mb-1 tracking-widest">Poznámka od majitele</div>
                       <div className="text-sm italic text-amber-800">"{revealedCreds.note}"</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-muted italic">
                  Žádné údaje nebyly nalezeny nebo k nim nemáte přístup.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary w-full" onClick={() => setShowCreds(null)}>Rozumím</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
