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

interface Category {
  id: string;
  name: string;
  icon?: string;
}

export function WishGridPicker({ activeWishNames, onWishAdded }: { activeWishNames: string[], onWishAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [registry, setRegistry] = useState<RegistryService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Vše");
  const [isAdding, setIsAdding] = useState(false);
  
  // Custom wish form
  const [showAddForm, setShowAddForm] = useState(false);
  const [customWish, setCustomWish] = useState({
    name: "",
    description: "",
    link: "",
    priority: 1
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
        await fetch("/api/wishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceName: item.name,
            description: `Rád bych sdílel ${item.name}`,
            priority: 1
          }),
        });
      }

      setSelectedIds([]);
      setIsOpen(false);
      onWishAdded();
    } catch (err) {
      console.error(err);
      alert("Některá přání se nepodařilo přidat.");
    } finally {
      setIsAdding(false);
    }
  };

  const addCustomWish = async () => {
    if (!customWish.name) return;
    setIsAdding(true);

    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          serviceName: customWish.name,
          description: customWish.description,
          link: customWish.link,
          priority: customWish.priority
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setIsOpen(false);
        onWishAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mb-8" id="wish-grid-picker">
      {!isOpen && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button 
            onClick={() => setIsOpen(true)}
            className="btn btn-primary shadow-lg"
            style={{ 
              width: 56, 
              height: 56, 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontSize: "1.5rem",
              padding: 0
            }}
          >
            ＋
          </button>
        </div>
      )}

      {isOpen && (
        <div className="card animate-slide-up bg-white border-2 border-brand-100">
          <div className="card-header" style={{ borderBottom: "1px solid var(--border-subtle)", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold" style={{ color: "var(--text-primary)" }}>🔍 Co si přeješ?</h3>
                <p className="text-[10px] md:text-xs text-muted">Hledej v číselníku nebo přidej vlastní</p>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="input-with-icon flex-1 md:max-w-[220px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="hidden-mobile">
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
                  className={`btn ${selectedIds.length > 0 ? 'btn-primary' : 'btn-glow'} btn-sm px-4 whitespace-nowrap`}
                >
                  {isAdding ? "..." : `Přidat (${selectedIds.length})`}
                </button>
                
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIsOpen(false)}>✕</button>
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
                <p className="text-muted mb-4">Nic takového v číselníku není.</p>
                <button 
                  onClick={() => { setShowAddForm(true); setCustomWish({...customWish, name: searchTerm}); }}
                  className="btn btn-secondary btn-sm"
                >
                  ➕ Přidat vlastní přání: "{searchTerm}"
                </button>
              </div>
            ) : (
              <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                {filtered.map(item => {
                  const isActive = activeWishNames.includes(item.name);
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
                  <span>Jiný nápad...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>✨ Přidat vlastní přání</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-1" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Služba / Produkt</label>
                  <input 
                    autoFocus
                    placeholder="Např. HBO Max, YouTube Premium..."
                    className="form-input" 
                    value={customWish.name}
                    onChange={e => setCustomWish({...customWish, name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Priorita</label>
                  <select 
                    className="form-select"
                    value={customWish.priority}
                    onChange={e => setCustomWish({...customWish, priority: parseInt(e.target.value)})}
                  >
                    <option value={1}>Nízká - bylo by to fajn</option>
                    <option value={2}>Střední - tohle bych fakt chtěl</option>
                    <option value={3}>Vysoká - nutně sháním!</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Poznámka / Odkaz</label>
                  <textarea 
                    placeholder="Např. sháním někoho do rodinného tarifu..."
                    className="form-input" 
                    style={{ minHeight: 80 }}
                    value={customWish.description}
                    onChange={e => setCustomWish({...customWish, description: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddForm(false)} className="btn btn-secondary">Zrušit</button>
              <button 
                onClick={addCustomWish} 
                className="btn btn-primary"
                disabled={!customWish.name || isAdding}
              >
                {isAdding ? "Ukládám..." : "Přidat přání"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
