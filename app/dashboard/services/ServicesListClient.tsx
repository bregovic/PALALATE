"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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
  const [services] = useState(initialServices);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortCol, setSortCol] = useState<"name" | "price" | "renewal" | "category">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [showFilters, setShowFilters] = useState(false);

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
      return matchesSearch && matchesCategory;
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
      }

      if (v1 < v2) return sortDir === "asc" ? -1 : 1;
      if (v1 > v2) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [services, search, categoryFilter, sortCol, sortDir]);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
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

  const sharingBadge = (status: string) => {
    if (status === "SHARING_ENABLED") return <span className="sharing-indicator sharing-enabled">Sdílím</span>;
    if (status === "SHARING_PAUSED") return <span className="sharing-indicator sharing-paused">Pauza</span>;
    return <span className="sharing-indicator sharing-disabled">Nesdílím</span>;
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
          <Link href="/dashboard/services/new" className="btn btn-primary mt-4">
            Přidat první službu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Hledat službu..." 
            className="form-input pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-secondary' : 'btn-ghost'} flex items-center gap-2 px-4`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="font-bold">Filtr</span>
          {hasActiveFilters && (
             <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
          )}
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

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort("name")} className="cursor-pointer hover:text-brand-600">
                  Služba {sortCol === "name" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("category")} className="cursor-pointer hover:text-brand-600">
                  Kategorie {sortCol === "category" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("price")} className="cursor-pointer hover:text-brand-600">
                  Cena {sortCol === "price" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th>Perioda</th>
                <th onClick={() => toggleSort("renewal")} className="cursor-pointer hover:text-brand-600">
                  Obnova {sortCol === "renewal" && (sortDir === "asc" ? "↑" : "↓")}
                </th>
                <th>Stav</th>
                <th>Sdílení</th>
                <th>Uživatelé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((svc) => {
                const icon = CATEGORY_ICONS[svc.category?.toLowerCase() || "other"] || "📦";
                const days = svc.renewalDate
                  ? Math.ceil((new Date(svc.renewalDate).getTime() - Date.now()) / 86400000)
                  : null;

                return (
                  <tr key={svc.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="text-xl w-8 text-center">{icon}</div>
                        <div>
                          <div className="font-bold text-primary">{svc.serviceName}</div>
                          <div className="text-[11px] text-muted">{svc.providerName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                       <span className="text-xs font-medium text-muted bg-muted px-2 py-0.5 rounded-full">
                         {svc.category || "Ostatní"}
                       </span>
                    </td>
                    <td className="font-bold text-primary">
                      {Number(svc.periodicPrice).toFixed(2)} {svc.currency}
                    </td>
                    <td className="text-sm">{billingLabels[svc.billingCycle]}</td>
                    <td>
                      {days !== null ? (
                        <span className={`text-sm ${days <= 7 ? "text-amber-500 font-bold" : "text-muted"}`}>
                          {days <= 0 ? "Dnes!" : `za ${days} dní`}
                        </span>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                    <td>{statusBadge(svc.status)}</td>
                    <td>{sharingBadge(svc.sharingStatus)}</td>
                    <td>
                      <span className="text-xs text-muted">
                        {svc._count.accessGrants} aktivních
                        {svc._count.accessRequests > 0 && (
                          <span className="badge badge-yellow ml-2">
                            {svc._count.accessRequests}
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/services/${svc.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Detail →
                      </Link>
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
