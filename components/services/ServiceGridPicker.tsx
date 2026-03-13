"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface RegistryService {
  id: string;
  name: string;
  category: string | null;
  defaultPrice: number | null;
  currency: string;
}

export function ServiceGridPicker({ activeServiceNames }: { activeServiceNames: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [registry, setRegistry] = useState<RegistryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Vše");
  const [isAdding, setIsAdding] = useState(false);
  
  // Custom service form
  const [showAddForm, setShowAddForm] = useState(false);
  const [customService, setCustomService] = useState({
    name: "",
    category: "Ostatní",
    defaultPrice: 0,
    currency: "CZK",
    billingCycle: "MONTHLY",
    description: ""
  });

  useEffect(() => {
    fetch("/api/service-registry")
      .then(res => res.json())
      .then(data => {
        setRegistry(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch registry", err);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("Vše");
    registry.forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [registry]);

  const filtered = useMemo(() => {
    return registry.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === "Vše" || s.category === selectedCategory;
      return matchesSearch && matchesCat;
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
            category: item.category || "other"
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

  const addNewToRegistry = async () => {
    if (!customService.name) return;
    setLoading(true);

    try {
      const res = await fetch("/api/service-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customService),
      });

      if (res.ok) {
        const newItem = await res.json();
        setRegistry(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        setShowAddForm(false);
        setCustomService({
          name: "",
          category: "Ostatní",
          defaultPrice: 0,
          currency: "CZK",
          billingCycle: "MONTHLY",
          description: ""
        });
        // Automatically select it
        toggleSelection(newItem.id, false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: isOpen ? 16 : 0 }}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`btn ${isOpen ? 'btn-secondary' : 'btn-primary'} btn-sm shadow-sm`}
          style={{ height: 44, padding: "0 24px", borderRadius: "var(--radius-full)" }}
        >
          {isOpen ? "✕ Zavřít číselník" : "✨ Rychlé přidání z číselníku"}
        </button>
      </div>

      {isOpen && (
        <div className="card animate-slide-up bg-white border-2 border-brand-100">
          <div className="card-header" style={{ borderBottom: "1px solid var(--border-subtle)", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>🔍 Najdi a přidej služby</h3>
                <p className="text-xs text-muted">Vyber si služby ze seznamu a potvrď tlačítkem</p>
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
                  className={`btn ${selectedIds.length > 0 ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                >
                  {isAdding ? "Přidávám..." : `Aktivovat vybrané (${selectedIds.length})`}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto", paddingBottom: 4 }}>
              {categories.map(cat => (
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

          <div className="card-body" style={{ minHeight: 120 }}>
            {filtered.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-muted mb-4">Nic jsme nenašli...</p>
                <button 
                  onClick={() => { setShowAddForm(true); setCustomService({...customService, name: searchTerm}); }}
                  className="btn btn-secondary btn-sm"
                >
                  ➕ Přidat "{searchTerm}" jako novou službu
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
                  <span>Přidat vlastní...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Custom Service Modal/Form */}
      {showAddForm && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>🆕 Přidat novou službu do číselníku</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-1" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Název služby</label>
                  <input 
                    autoFocus
                    className="form-input" 
                    value={customService.name}
                    onChange={e => setCustomService({...customService, name: e.target.value})}
                  />
                </div>
                <div className="grid-2" style={{ gap: 16 }}>
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
                    <select 
                      className="form-select"
                      value={customService.currency}
                      onChange={e => setCustomService({...customService, currency: e.target.value})}
                    >
                      <option value="CZK">CZK</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Kategorie</label>
                    <input 
                      className="form-input" 
                      value={customService.category}
                      onChange={e => setCustomService({...customService, category: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Frekvence</label>
                    <select 
                      className="form-select"
                      value={customService.billingCycle}
                      onChange={e => setCustomService({...customService, billingCycle: e.target.value})}
                    >
                      <option value="MONTHLY">Měsíčně</option>
                      <option value="YEARLY">Ročně</option>
                      <option value="WEEKLY">Týdně</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Poznámka / Popis</label>
                  <textarea 
                    className="form-input" 
                    value={customService.description}
                    onChange={e => setCustomService({...customService, description: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddForm(false)} className="btn btn-secondary">Zrušit</button>
              <button 
                onClick={addNewToRegistry} 
                className="btn btn-primary"
                disabled={!customService.name || loading}
              >
                Uložit a vybrat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
