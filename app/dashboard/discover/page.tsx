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
            <table>
              <thead>
                <tr>
                  <th>Služba</th>
                  <th className="hidden-mobile">Kategorie</th>
                  <th>Cena</th>
                  <th className="hidden-mobile">Status</th>
                  <th>Sdílí</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => {
                  const icon = CATEGORY_ICONS[svc.category?.toLowerCase() || "other"] || "📦";
                  return (
                    <tr key={svc.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="text-xl w-8 h-8 flex items-center justify-center bg-brand-50 rounded-lg text-brand-600 hidden-mobile">
                            {icon}
                          </div>
                          <div>
                            <div className="font-bold text-primary">{svc.serviceName}</div>
                            <div className="text-[11px] text-muted">{svc.providerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden-mobile">
                        <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full text-muted">
                           {svc.category || "Ostatní"}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-primary">
                          {Number(svc.periodicPrice).toLocaleString()} {svc.currency}
                        </div>
                        <div className="text-[10px] text-muted uppercase">/ {svc.billingCycle}</div>
                      </td>
                      <td className="hidden-mobile">
                        {(svc.freeSlots === null || svc.freeSlots === Infinity) ? (
                          <span className="badge badge-green">Volno</span>
                        ) : (
                          <span className={`badge ${svc.freeSlots > 0 ? 'badge-blue' : 'badge-red'}`}>
                            {svc.freeSlots > 0 ? `${svc.freeSlots} volných míst` : 'Obsazeno'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>
                            {svc.owner.name[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-muted hidden-mobile">{svc.owner.name}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleRequestAccess(svc.id)}
                          disabled={requestingId === svc.id || svc.freeSlots === 0}
                        >
                          {requestingId === svc.id ? "..." : "Požádat"}
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
