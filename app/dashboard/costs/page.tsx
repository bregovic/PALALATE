"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PieChart as PieChartIcon, 
  BarChart2, 
  DollarSign,
  ArrowUpRight,
  ChevronRight,
  History
} from "lucide-react";

interface CostStats {
  lifetimeTotal: number;
  currentMonthly: number;
  yearlyStats: Record<string, number>;
  monthlyStats: Record<string, { total: number; byCategory: Record<string, number> }>;
  serviceRankings: Array<{ name: string; total: number }>;
  categoryRankings: Array<{ name: string; total: number }>;
}

export default function CostsPage() {
  const [data, setData] = useState<CostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    fetch("/api/stats/costs")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-content animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
        <div className="grid-3 mb-8">
          <div className="h-32 bg-slate-100 rounded-xl"></div>
          <div className="h-32 bg-slate-100 rounded-xl"></div>
          <div className="h-32 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="h-64 bg-slate-50 rounded-xl mb-8"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8">Chyba při načítání dat.</div>;

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthEntries = Object.entries(data.monthlyStats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12);

  const yearEntries = Object.entries(data.yearlyStats)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const chartEntries = view === "monthly" ? monthEntries : yearEntries;
  const maxVal = Math.max(...chartEntries.map(e => typeof e[1] === 'number' ? e[1] : e[1].total), 1);

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Analýza nákladů</h1>
          <p className="page-subtitle">Kompletní přehled tvých výdajů za předplatná v čase.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-subtle shadow-sm">
          <button 
            onClick={() => setView("monthly")}
            className={`btn btn-sm ${view === "monthly" ? "btn-primary" : "btn-ghost"}`}
          >
            Měsíční
          </button>
          <button 
            onClick={() => setView("yearly")}
            className={`btn btn-sm ${view === "yearly" ? "btn-primary" : "btn-ghost"}`}
          >
            Roční
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid-3 mb-8">
        <div className="stat-card" style={{ borderLeft: "4px solid var(--brand-500)" }}>
          <div className="stat-label">Aktuální měsíc</div>
          <div className="stat-value">{data.currentMonthly.toLocaleString()} Kč</div>
          <div className="stat-change flex items-center gap-1">
             <ArrowUpRight size={12} className="text-secondary" /> 
             <span>odhad na tento měsíc</span>
          </div>
          <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.1)" }}>
            <DollarSign className="text-brand-500" size={20} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid var(--accent-500)" }}>
          <div className="stat-label">Průměrný měsíc</div>
          <div className="stat-value">
            {(data.lifetimeTotal / (Object.keys(data.monthlyStats).length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} Kč
          </div>
          <div className="stat-change">dlouhodobý průměr</div>
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
            <TrendingUp className="text-accent-500" size={20} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className="stat-label">Celkové náklady</div>
          <div className="stat-value">{data.lifetimeTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} Kč</div>
          <div className="stat-change">za celou dobu používání</div>
          <div className="stat-icon" style={{ background: "rgba(139, 92, 246, 0.1)" }}>
            <History className="text-purple-500" size={20} />
          </div>
        </div>
      </div>

      <div className="grid-2 mb-8 costs-main-grid">
        {/* Main Chart */}
        <div className="card">
          <div className="card-header">
            <h3>📈 {view === "monthly" ? "Vývoj nákladů (posledních 12 měsíců)" : "Historie nákladů po letech"}</h3>
          </div>
          <div className="card-body">
            <div className="relative" style={{ height: 260 }}>
              {/* SVG Line Chart */}
              <svg width="100%" height="200" viewBox="0 0 1000 200" preserveAspectRatio="none" className="overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(p => (
                  <line 
                    key={p} 
                    x1="0" y1={200 - p * 190} x2="1000" y2={200 - p * 190} 
                    stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4 4" 
                  />
                ))}

                {/* Area Fill */}
                <path
                  d={`
                    M 0 200
                    ${chartEntries.map((e, i) => {
                      const val = typeof e[1] === 'number' ? e[1] : e[1].total;
                      const x = (i / (chartEntries.length - 1)) * 1000;
                      const y = 200 - (val / maxVal) * 190;
                      return `L ${x} ${y}`;
                    }).join(" ")}
                    L 1000 200
                    Z
                  `}
                  fill="url(#chartGradient)"
                />

                {/* Line */}
                <path
                  d={`
                    M ${ (0 / (chartEntries.length - 1)) * 1000 } ${ 200 - ((typeof chartEntries[0][1] === 'number' ? chartEntries[0][1] : chartEntries[0][1].total) / maxVal) * 190 }
                    ${chartEntries.map((e, i) => {
                      if (i === 0) return "";
                      const val = typeof e[1] === 'number' ? e[1] : e[1].total;
                      const x = (i / (chartEntries.length - 1)) * 1000;
                      const y = 200 - (val / maxVal) * 190;
                      return `L ${x} ${y}`;
                    }).join(" ")}
                  `}
                  fill="none"
                  stroke="var(--brand-500)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {chartEntries.map((e, i) => {
                  const val = typeof e[1] === 'number' ? e[1] : e[1].total;
                  const x = (i / (chartEntries.length - 1)) * 1000;
                  const y = 200 - (val / maxVal) * 190;
                  const key = e[0];
                  const isCurrent = view === "monthly" ? key === currentKey : key === now.getFullYear().toString();

                  return (
                    <g key={key} className="group cursor-pointer">
                      <circle 
                        cx={x} cy={y} r="5" 
                        fill={isCurrent ? "var(--accent-500)" : "white"} 
                        stroke={isCurrent ? "var(--accent-600)" : "var(--brand-500)"} 
                        strokeWidth="2"
                        className="transition-all group-hover:r-[7px]"
                      />
                      {/* Tooltip Area (invisible but captures hover) */}
                      <rect x={x - 20} y="0" width="40" height="200" fill="transparent" />
                      
                      {/* Tooltip Content */}
                      <foreignObject x={x - 60} y={y - 50} width="120" height="40" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg text-center font-bold">
                          {val.toLocaleString()} Kč
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>

              {/* X-Axis Labels */}
              <div className="absolute bottom-0 inset-x-0 flex justify-between px-2">
                {chartEntries.map(([key]) => {
                  let label = key;
                  if (view === "monthly") {
                    try {
                      label = new Date(key + "-01").toLocaleDateString("cs-CZ", { month: "short" });
                    } catch { label = key; }
                  }
                  const isCurrent = view === "monthly" ? key === currentKey : key === now.getFullYear().toString();
                  return (
                    <div key={key} className={`text-[10px] font-bold uppercase ${isCurrent ? "text-accent-600" : "text-muted"}`}>
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Categories breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>📁 Podle kategorií</h3>
          </div>
          <div className="card-body">
             <div className="flex flex-col gap-4">
                {data.categoryRankings.slice(0, 6).map((cat, idx) => {
                  const percentage = (cat.total / data.lifetimeTotal) * 100;
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-slate-700">{cat.name}</span>
                        <span className="text-muted">{cat.total.toLocaleString()} Kč</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 rounded-full"
                          style={{ 
                            width: `${percentage}%`,
                            background: `hsl(${220 + idx * 25}, 80%, 60%)` 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Service Rankings */}
        <div className="card">
          <div className="card-header">
            <h3>🏆 Nejdražší služby (celkově)</h3>
          </div>
          <div className="card-body p-0">
            <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Služba</th>
                    <th className="text-right">Celkem utraceno</th>
                  </tr>
                </thead>
                <tbody>
                  {data.serviceRankings.slice(0, 10).map((svc, idx) => (
                    <tr key={svc.name}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded text-xs font-bold text-slate-500">{idx + 1}</span>
                          <span className="font-semibold">{svc.name}</span>
                        </div>
                      </td>
                      <td className="text-right font-bold text-slate-800">
                        {svc.total.toLocaleString()} Kč
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Yearly breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>📅 Roční přehled</h3>
          </div>
          <div className="card-body">
            <div className="flex flex-col gap-3">
              {Object.entries(data.yearlyStats)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([year, total]) => (
                <div key={year} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-subtle group hover:border-brand-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Calendar size={18} className="text-brand-500" />
                    </div>
                    <span className="font-bold text-lg">{year}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-slate-800">{total.toLocaleString()} Kč</div>
                    <div className="text-xs text-muted uppercase tracking-wider font-bold">celkové výdaje</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
