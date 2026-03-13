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
  freeSlots: number;
  owner: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export default function DiscoverPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services/available")
      .then(res => res.json())
      .then(data => {
        setServices(data);
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

  if (loading) {
    return (
      <div className="page-content">
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 20 }} />
        <div className="grid-auto">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌍 Služby k dispozici</h1>
          <p className="page-subtitle">Služby, které sdílejí tvoji přátelé a mají volná místa.</p>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🌍</div>
          <h3 className="empty-title">Zatím tu nic není</h3>
          <p className="empty-desc">Tvoji přátelé zatím žádné služby nesdílejí, nebo jsou už všechny obsazené.</p>
          <Link href="/dashboard/contacts" className="btn btn-primary mt-4">Pozvat další přátele</Link>
        </div>
      ) : (
        <div className="grid-auto">
          {services.map(service => (
            <div key={service.id} className="card card-interactive overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="user-avatar" style={{ width: 48, height: 48, borderRadius: 12 }}>
                    {service.serviceName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{Number(service.periodicPrice).toLocaleString()} {service.currency}</div>
                    <div className="text-[10px] text-muted uppercase">/ {service.billingCycle}</div>
                  </div>
                </div>

                <h3 className="mb-1">{service.serviceName}</h3>
                <p className="text-xs text-muted mb-4">{service.providerName} • {service.category || "Ostatní"}</p>
                
                {service.description && (
                  <p className="text-xs line-clamp-2 text-secondary mb-4 italic">"{service.description}"</p>
                )}

                <div className="divider" />

                <div className="flex items-center gap-3">
                  <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>
                    {service.owner.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-xs">
                    <span className="text-muted">Sdílí:</span> <span className="font-bold">{service.owner.name}</span>
                  </div>
                  <div className="ml-auto">
                    {service.freeSlots === Infinity ? (
                      <span className="badge badge-green">Volno</span>
                    ) : (
                      <span className={`badge ${service.freeSlots > 0 ? 'badge-blue' : 'badge-red'}`}>
                        {service.freeSlots} volných míst
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-footer bg-muted/30 border-t border-subtle">
                <button 
                  className="btn btn-primary w-full btn-sm"
                  onClick={() => handleRequestAccess(service.id)}
                  disabled={requestingId === service.id || service.freeSlots === 0}
                >
                  {requestingId === service.id ? "Odesílám..." : "Požádat o přístup"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
