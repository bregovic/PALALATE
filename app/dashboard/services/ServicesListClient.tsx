"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImportExportTools } from "@/components/services/ImportExportTools";
import { VoiceServiceAssigner } from "@/components/services/VoiceServiceAssigner";
import { ServiceGridPicker } from "@/components/services/ServiceGridPicker";

interface Service {
  id: string;
  serviceName: string;
  providerName: string;
  category: string | null;
  periodicPrice: any; // Decimal from Prisma
  currency: string;
  billingCycle: string;
  renewalDate: string | null;
  status: string;
  sharingStatus: string;
  usageMode: string;
  isTerminated: boolean;
  isShared?: boolean;
  isAvailable?: boolean;
  hasPendingRequest?: boolean;
  hasActiveGrant?: boolean;
  freeSlots?: number | null;
  url: string | null;
  iconUrl: string | null;
  owner?: { name: string; avatar: string | null };
  _count: {
    accessGrants: number;
    accessRequests: number;
  };
}

interface Props {
  initialServices: Service[];
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

const billingLabels: Record<string, string> = {
  WEEKLY: "týdně",
  MONTHLY: "měsíčně",
  QUARTERLY: "čtvrtletně",
  SEMI_ANNUALLY: "půlročně",
  YEARLY: "ročně",
  ONEOFF: "jednorázově",
  CUSTOM: "",
};

export function ServicesListClient({ initialServices }: Props) {
  const router = useRouter();
  const [services] = useState(initialServices);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortCol, setSortCol] = useState<"name" | "price" | "renewal" | "category" | "sharing">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewFilter, setViewFilter] = useState<"ALL" | "MANAGED" | "AVAILABLE" | "SHARED_OUT">("ALL");
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updatingBulk, setUpdatingBulk] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    services.forEach(s => { if (s.category) cats.add(s.category); });
    return Array.from(cats).sort();
  }, [services]);

  const hasActiveFilters = categoryFilter !== "" || sortCol !== "name" || sortDir !== "asc";

  const filteredAndSorted = useMemo(() => {
    let result = services.filter(s => {
      const matchesSearch = s.serviceName.toLowerCase().includes(search.toLowerCase()) || 
                           s.providerName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || s.category === categoryFilter;
      
      let matchesView = true;
      if (viewFilter === "MANAGED") matchesView = !s.isShared && !s.isAvailable && s.status === "ACTIVE";
      if (viewFilter === "AVAILABLE") matchesView = s.isAvailable === true;
      if (viewFilter === "SHARED_OUT") matchesView = !s.isShared && !s.isAvailable && s._count.accessGrants > 0;

      return matchesSearch && matchesCategory && matchesView;
    });

    result.sort((a, b) => {
      let v1: any, v2: any;
      if (sortCol === "name") {
        v1 = a.serviceName.toLowerCase();
        v2 = b.serviceName.toLowerCase();
      } else if (sortCol === "price") {
        v1 = Number(a.periodicPrice);
        v2 = Number(b.periodicPrice);
      } else if (sortCol === "category") {
        v1 = (a.category || "zzz").toLowerCase();
        v2 = (b.category || "zzz").toLowerCase();
      } else if (sortCol === "renewal") {
        v1 = a.renewalDate ? new Date(a.renewalDate).getTime() : Infinity;
        v2 = b.renewalDate ? new Date(b.renewalDate).getTime() : Infinity;
      } else if (sortCol === "sharing") {
        v1 = (a.usageMode || "zzz").toLowerCase();
        v2 = (b.usageMode || "zzz").toLowerCase();
      }

      if (v1 < v2) return sortDir === "asc" ? -1 : 1;
      if (v1 > v2) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [services, search, categoryFilter, sortCol, sortDir, viewFilter]);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSorted.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async (mode: string) => {
    if (selectedIds.length === 0) return;
    setUpdatingBulk(true);
    try {
      const res = await fetch("/api/services/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, usageMode: mode }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setUpdatingBulk(false);
    }
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

  const sharingBadge = (mode: string) => {
    if (mode === "PRIVATE") return <span className="sharing-indicator sharing-disabled">🔒 Soukromé</span>;
    if (mode === "SHARED") return <span className="sharing-indicator sharing-enabled">👥 Sdílené</span>;
    if (mode === "SHARED_ROTATION") return <span className="sharing-indicator sharing-paused">🕒 Střídání</span>;
    if (mode === "LICENSE") return <span className="sharing-indicator sharing-enabled">🔑 Licence</span>;
    return <span className="sharing-indicator sharing-disabled">Soukromé</span>;
  };

  if (services.length === 0) {
    return (
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex bg-muted p-1 rounded-xl self-start mb-2">
        <button onClick={() => setViewFilter("ALL")} className={`btn btn-sm px-4 py-1.5 rounded-lg border-none ${viewFilter === "ALL" ? "btn-primary shadow-sm" : "btn-ghost"}`}>Vše</button>
        <button onClick={() => setViewFilter("MANAGED")} className={`btn btn-sm px-4 py-1.5 rounded-lg border-none ${viewFilter === "MANAGED" ? "btn-primary shadow-sm" : "btn-ghost"}`}>Moje aktivní služby</button>
        <button onClick={() => setViewFilter("AVAILABLE")} className={`btn btn-sm px-4 py-1.5 rounded-lg border-none ${viewFilter === "AVAILABLE" ? "btn-primary shadow-sm" : "btn-ghost"}`}>K dispozici (přátelé)</button>
        <button onClick={() => setViewFilter("SHARED_OUT")} className={`btn btn-sm px-4 py-1.5 rounded-lg border-none ${viewFilter === "SHARED_OUT" ? "btn-primary shadow-sm" : "btn-ghost"}`}>Poskytnuté služby</button>
      </div>

      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ServiceGridPicker activeServiceNames={services.map(s => s.serviceName)} />
          <VoiceServiceAssigner />
          <ImportExportTools />
          
          <div className="w-px h-6 bg-border-subtle mx-2" />
          
          <button 
            onClick={() => { setShowBulk(!showBulk); if(showBulk) setSelectedIds([]); }}
            className={`btn btn-sm ${showBulk ? 'btn-secondary' : 'btn-ghost'} px-4 border border-subtle`}
          >
            {showBulk ? 'Zavřít hromadnou změnu' : 'Hromadná změna'}
          </button>
        </div>

        <div className="input-with-icon flex-1 min-w-[200px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            placeholder="Hledat službu..." 
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-secondary' : 'btn-ghost'} flex items-center gap-2 px-4 h-[44px] border border-subtle`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="font-bold">Filtr</span>
        </button>
      </div>

      {showFilters && (
        <div className="p-4 bg-elevated rounded-2xl border border-subtle flex flex-wrap items-end gap-6 animate-fade-in shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted ml-1">Kategorie</label>
            <select 
              className="form-select w-auto min-w-[200px] h-10"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">Všechny kategorie</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted ml-1">Abecedně</label>
            <div className="flex gap-2">
              <button 
                onClick={() => { setSortCol("name"); setSortDir("asc"); }}
                className={`btn btn-sm h-10 px-4 ${sortCol === "name" && sortDir === "asc" ? 'btn-secondary' : 'btn-ghost border border-subtle'}`}
              >
                A-Z
              </button>
              <button 
                onClick={() => { setSortCol("name"); setSortDir("desc"); }}
                className={`btn btn-sm h-10 px-4 ${sortCol === "name" && sortDir === "desc" ? 'btn-secondary' : 'btn-ghost border border-subtle'}`}
              >
                Z-A
              </button>
            </div>
          </div>
          
          <button 
            className="btn btn-ghost btn-sm h-10 text-muted ml-auto"
            onClick={() => {
              setCategoryFilter("");
              setSortCol("name");
              setSortDir("asc");
              setSearch("");
            }}
          >
            Resetovat
          </button>
        </div>
      )}

      {selectedIds.length > 0 && (
         <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200 flex items-center gap-4 animate-fade-in shadow-sm">
            <span className="text-sm font-bold text-brand-700">Vybráno: {selectedIds.length} položek</span>
            <div className="flex gap-2 ml-auto items-center">
               <span className="text-xs text-muted uppercase font-bold">Změnit režim:</span>
               <button onClick={() => handleBulkUpdate("PRIVATE")} disabled={updatingBulk} className="btn btn-ghost btn-sm bg-white border border-brand-200">🔒 Soukromé</button>
               <button onClick={() => handleBulkUpdate("SHARED")} disabled={updatingBulk} className="btn btn-ghost btn-sm bg-white border border-brand-200">👥 Sdílené</button>
               <button onClick={() => handleBulkUpdate("SHARED_ROTATION")} disabled={updatingBulk} className="btn btn-ghost btn-sm bg-white border border-brand-200">🕒 Střídání</button>
               <button onClick={() => handleBulkUpdate("LICENSE")} disabled={updatingBulk} className="btn btn-ghost btn-sm bg-white border border-brand-200">🔑 Licence</button>
               <div className="w-px h-6 bg-brand-200 mx-2" />
               <button onClick={() => setSelectedIds([])} className="btn btn-ghost btn-sm">Zrušit výběr</button>
            </div>
         </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {showBulk && (
                  <th style={{ width: 40, paddingRight: 0 }}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer"
                      checked={filteredAndSorted.length > 0 && selectedIds.length === filteredAndSorted.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th onClick={() => toggleSort("name")} className="cursor-pointer hover:text-brand-600">
                  Služba {sortCol === "name" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("category")} className="cursor-pointer hover:text-brand-600 mobile-hide">
                  Kategorie {sortCol === "category" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-center mobile-hide">Stav</th>
                <th onClick={() => toggleSort("sharing")} className="cursor-pointer hover:text-brand-600 text-center mobile-hide">
                  Sdílení {sortCol === "sharing" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-right">Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((svc) => {
                const icon = CATEGORY_ICONS[svc.category?.toLowerCase() || "other"] || "📦";
                return (
                  <tr 
                    key={svc.id} 
                    className={`cursor-pointer transition-all ${selectedIds.includes(svc.id) ? "bg-brand-50/30" : ""} hover:bg-slate-50`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('a')) return;
                      router.push(`/dashboard/services/${svc.id}`);
                    }}
                  >
                    {showBulk && (
                      <td style={{ width: 40, paddingRight: 0 }}>
                        {!svc.isShared && (
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 cursor-pointer"
                            checked={selectedIds.includes(svc.id)}
                            onChange={(e) => { e.stopPropagation(); toggleSelect(svc.id); }}
                          />
                        )}
                      </td>
                    )}
                    <td>
                      <div className="flex items-center gap-3">
                        <div 
                          className="user-avatar" 
                          style={{ width: 32, height: 32, borderRadius: 6, fontSize: '0.9rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', flexShrink: 0, overflow: 'hidden' }}
                        >
                          {svc.iconUrl ? (
                            <img src={svc.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            icon
                          )}
                        </div>
                          <div>
                            <div className="font-bold text-primary flex items-center gap-2">
                               {svc.serviceName}
                               {svc.isShared && <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-brand-100 text-brand-600 rounded">Host</span>}
                               {svc.isAvailable && <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">Nabídka</span>}
                            </div>
                            {(svc.isShared || svc.isAvailable) && <span className="text-[10px] text-muted italic">Vlastní {svc.owner?.name}</span>}
                          </div>
                      </div>
                    </td>
                    <td className="text-center mobile-hide">
                       <span className="text-xs font-medium text-muted bg-muted px-2 py-0.5 rounded-full">
                         {svc.category || "Ostatní"}
                       </span>
                    </td>
                    <td className="text-center mobile-hide">
                      {svc.isTerminated ? (
                        <span className="badge badge-red">Ukončeno</span>
                      ) : (
                        statusBadge(svc.status)
                      )}
                    </td>
                     <td className="text-center mobile-hide">
                        {svc.isShared ? (
                          <span className="sharing-indicator sharing-disabled" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>👀 Čtení</span>
                        ) : svc.isAvailable ? (
                          <span className={`badge ${svc.freeSlots ? 'badge-blue' : 'badge-red'}`}>
                            {svc.freeSlots ? `${svc.freeSlots} volná místa` : 'Plno'}
                          </span>
                        ) : sharingBadge((svc as any).usageMode)}
                     </td>
                    <td className="text-right">
                      {svc.isAvailable ? (
                        <button
                          className={`btn ${svc.hasPendingRequest ? 'btn-glow' : 'btn-primary'} btn-sm`}
                          onClick={async (e) => {
                             e.stopPropagation();
                             if (svc.hasPendingRequest || requestingId) return;
                             setRequestingId(svc.id);
                             const res = await fetch(`/api/services/${svc.id}/access-requests`, {
                               method: "POST",
                               headers: { "Content-Type": "application/json" },
                               body: JSON.stringify({ message: "Zájem o sdílení ze seznamu služeb." }),
                             });
                             if (res.ok) alert("Žádost odeslána!");
                             setRequestingId(null);
                          }}
                          disabled={requestingId === svc.id || svc.freeSlots === 0 || svc.hasPendingRequest}
                        >
                          {requestingId === svc.id ? "..." : (svc.hasPendingRequest ? "Požádáno" : "Požádat")}
                        </button>
                      ) : (
                        <Link
                          href={`/dashboard/services/${svc.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={e => e.stopPropagation()}
                        >
                          {svc.isShared ? "Prohlédnout →" : "Detail →"}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAndSorted.length === 0 && (
             <div className="p-8 text-center text-muted italic">
                Nebyly nalezeny žádné služby odpovídající filtrům.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
