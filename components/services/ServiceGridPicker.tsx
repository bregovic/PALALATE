"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface RegistryService {
  id: string;
  name: string;
  category: string | null;
  defaultPrice: number | null;
  currency: string;
  isShareable: boolean;
  billingCycle: string;
  pricingType: string;
  usageMode?: string;
  requiresBookingApproval?: boolean;
  iconUrl?: string | null;
  url?: string | null;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

export function ServiceGridPicker({ activeServiceNames }: { activeServiceNames: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [registry, setRegistry] = useState<RegistryService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Vše");
  const [isAdding, setIsAdding] = useState(false);
  
  // Custom service form
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [customService, setCustomService] = useState({
    name: "",
    category: "",
    defaultPrice: 0,
    currency: "CZK",
    billingCycle: "MONTHLY",
    pricingType: "PAID",
    pricingDetails: "",
    description: "",
    usageMode: "PRIVATE",
    requiresBookingApproval: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regRes, catRes] = await Promise.all([
          fetch("/api/service-registry"),
          fetch("/api/categories")
        ]);
        const regData = await regRes.json();
        const catData = await catRes.json();
        setRegistry(regData);
        setCategories(catData);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const availableCategories = useMemo(() => {
    const names = new Set<string>();
    names.add("Vše");
    registry.forEach(s => {
      if (s.category) names.add(s.category);
    });
    categories.forEach(c => names.add(c.name));
    return Array.from(names);
  }, [registry, categories]);

  const filtered = useMemo(() => {
    return registry.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === "Vše" || s.category === selectedCategory;
      const shareable = s.isShareable !== false; 
      return matchesSearch && matchesCat && shareable;
    });
  }, [registry, searchTerm, selectedCategory]);

  const toggleSelection = (id: string, active: boolean) => {
    if (active) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsAdding(true);

    try {
      const toAdd = registry.filter(s => selectedIds.includes(s.id));
      
      for (const item of toAdd) {
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceName: item.name,
            providerName: item.name,
            periodicPrice: item.defaultPrice || 0,
            currency: item.currency || "CZK",
            category: item.category || "other",
            pricingType: item.pricingType || "PAID",
            billingCycle: item.billingCycle || "MONTHLY",
            usageMode: item.usageMode || "PRIVATE",
            requiresBookingApproval: item.requiresBookingApproval || false,
            iconUrl: item.iconUrl || null,
            url: item.url || null,
          }),
        });
      }

      setSelectedIds([]);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Některé služby se nepodařilo přidat.");
    } finally {
      setIsAdding(false);
    }
  };

  const addCustomService = async () => {
    if (!customService.name) return;
    setIsAdding(true);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...customService, 
          serviceName: customService.name,
          providerName: customService.name,
          periodicPrice: customService.defaultPrice 
        }),
      });

      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mb-8">
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: isOpen ? 24 : 0 }}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`btn ${isOpen ? 'btn-secondary' : 'btn-primary'} shadow-lg`}
          style={{ 
            width: 44, 
            height: 44, 
            borderRadius: "12px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            padding: 0,
            fontSize: "1.4rem",
            transform: isOpen ? 'rotate(45deg)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            marginLeft: '4px'
          }}
          title={isOpen ? "Zavřít číselník" : "Přidat službu z číselníku"}
        >
          ＋
        </button>
      </div>

      {isOpen && (
        <div className="card animate-slide-up bg-white border-2 border-brand-100">
          <div className="card-header" style={{ borderBottom: "1px solid var(--border-subtle)", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>🔍 Číselník služeb</h3>
                <p className="text-xs text-muted">Hledej podle názvu nebo filtruj podle kategorií</p>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="input-with-icon" style={{ maxWidth: 220 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Hledat..." 
                    className="form-input btn-sm" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={handleAddSelected}
                  disabled={selectedIds.length === 0 || isAdding}
                  className={`btn ${selectedIds.length > 0 ? 'btn-primary' : 'btn-glow'} btn-sm`}
                >
                  {isAdding ? "Přidávám..." : `Přidat vybrané (${selectedIds.length})`}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto", paddingBottom: 4 }}>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ fontSize: "0.75rem", borderRadius: "var(--radius-full)", padding: "4px 12px" }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body">
            {filtered.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-muted mb-4">Služba nenalezena.</p>
                <button 
                  onClick={() => { setShowAddForm(true); setCustomService({...customService, name: searchTerm}); }}
                  className="btn btn-secondary btn-sm"
                >
                  ➕ Přidat "{searchTerm}" do systému
                </button>
              </div>
            ) : (
              <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                {filtered.map(item => {
                  const isActive = activeServiceNames.includes(item.name);
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => toggleSelection(item.id, isActive)}
                      className={`
                        flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all
                        ${isActive ? 'opacity-50 bg-slate-50 border-slate-100 cursor-not-allowed' : ''}
                        ${isSelected ? 'bg-brand-50 border-brand-300 ring-2 ring-brand-100 shadow-sm' : 'bg-white hover:border-slate-300'}
                      `}
                    >
                      <div className={`
                        w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 bg-white'}
                        ${isActive ? 'bg-slate-200 border-slate-200' : ''}
                      `}>
                        {(isSelected || isActive) && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "0.875rem", color: isActive ? "var(--text-muted)" : "var(--text-primary)" }}>
                          {item.name}
                        </div>
                        {item.category && !isActive && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{item.category}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div 
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 p-3 border border-dashed rounded-xl text-slate-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all cursor-pointer text-sm"
                >
                  <div className="w-5 h-5 flex items-center justify-center">➕</div>
                  <span>Jiná...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddForm && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 1100 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddForm(false);
          }}
        >
          <div className="modal" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3>🆕 Nová služba</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-1" style={{ gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Název služby</label>
                  <input 
                    autoFocus
                    className="form-input" 
                    value={customService.name}
                    onChange={e => setCustomService({...customService, name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kategorie</label>
                  <select 
                    className="form-select"
                    value={customService.category}
                    onChange={e => setCustomService({...customService, category: e.target.value})}
                  >
                    <option value="">-- Vyber kategorii --</option>
                    {availableCategories.filter(c => c !== "Vše").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Typ platby</label>
                  <div className="grid-2" style={{ gap: 10 }}>
                    {[
                      { id: "PAID", label: "Pravidelná platba" },
                      { id: "AFFILIATE", label: "Affiliate / Deal" },
                      { id: "INCLUDED", label: "V ceně jiného balíčku" },
                      { id: "FREE", label: "Zdarma" }
                    ].map(type => (
                      <label key={type.id} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${customService.pricingType === type.id ? 'bg-brand-50 border-brand-300' : ''}`}>
                        <input 
                          type="radio" 
                          name="pricingType"
                          checked={customService.pricingType === type.id}
                          onChange={() => setCustomService({...customService, pricingType: type.id})}
                        />
                        <span className="text-sm">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group pb-4 border-b">
                   <label className="form-label">Režim používání / Sdílení</label>
                   <div className="flex flex-col gap-2">
                     <select 
                       className="form-select"
                       value={customService.usageMode}
                       onChange={e => setCustomService({...customService, usageMode: e.target.value as any})}
                     >
                       <option value="PRIVATE">🔒 Soukromé (nesdílím)</option>
                       <option value="SHARED">👥 Sdílené (souběžný přístup)</option>
                       <option value="SHARED_ROTATION">🕒 Sdílené (střídání / rezervace)</option>
                       <option value="LICENSE">🔑 Licence / Slot</option>
                     </select>
                     {customService.usageMode === "SHARED_ROTATION" && (
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input type="checkbox" checked={customService.requiresBookingApproval} onChange={e => setCustomService({...customService, requiresBookingApproval: e.target.checked})} />
                          <span className="text-xs">Uživatelé mi musí poslat žádost o termín</span>
                        </label>
                     )}
                   </div>
                </div>

                {customService.pricingType === "PAID" ? (
                  <div className="grid-3" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Cena</label>
                      <input 
                        type="number"
                        className="form-input" 
                        value={customService.defaultPrice}
                        onChange={e => setCustomService({...customService, defaultPrice: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Měna</label>
                      <select className="form-select" value={customService.currency} onChange={e => setCustomService({...customService, currency: e.target.value})}>
                        <option value="CZK">CZK</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Frekvence</label>
                      <select className="form-select" value={customService.billingCycle} onChange={e => setCustomService({...customService, billingCycle: e.target.value})}>
                        <option value="MONTHLY">Měsíčně</option>
                        <option value="YEARLY">Ročně</option>
                        <option value="SEMI_ANNUALLY">Půlročně</option>
                        <option value="QUARTERLY">Čtvrtletně</option>
                        <option value="WEEKLY">Týdně</option>
                        <option value="ONEOFF">Jednorázově</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Detaily k "neplacení"</label>
                    <input 
                      placeholder="Uveď důvod nebo deal..."
                      className="form-input"
                      value={customService.pricingDetails}
                      onChange={e => setCustomService({...customService, pricingDetails: e.target.value})}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Poznámka</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: 60 }}
                    value={customService.description}
                    onChange={e => setCustomService({...customService, description: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddForm(false)} className="btn btn-secondary">Zrušit</button>
              <button 
                onClick={addCustomService} 
                className="btn btn-primary"
                disabled={!customService.name || isAdding}
              >
                {isAdding ? "Přidávám..." : "Přidat službu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
