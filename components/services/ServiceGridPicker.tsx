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
  const [registry, setRegistry] = useState<RegistryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Vše");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");

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
    if (active) return; // Already active, cannot select for adding
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

      router.refresh();
      setSelectedIds([]);
      // Reload page to reflect changes in the main list
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Některé služby se nepodařilo přidat.");
    } finally {
      setIsAdding(false);
    }
  };

  const addNewToRegistry = async () => {
    if (!newName) return;
    setLoading(true);

    try {
      const res = await fetch("/api/service-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, category: selectedCategory !== "Vše" ? selectedCategory : "Ostatní" }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setRegistry(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        setNewName("");
        setShowAddForm(false);
        toggleSelection(newItem.id, false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && registry.length === 0) {
    return (
      <div className="card mb-8">
        <div className="p-12 text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted">Načítám číselník služeb...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-8 animate-slide-up">
      <div className="card-header" style={{ borderBottom: "1px solid var(--border-subtle)", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>✨ Rychlé přidání služeb</h3>
            <p className="text-xs text-muted">Vyber si z číselníku nebo přidej vlastní</p>
          </div>
          
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="input-with-icon" style={{ maxWidth: 220 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Hledat (např. 'spot')..." 
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
              {isAdding ? "Přidávám..." : `Přidat vybrané (${selectedIds.length})`}
            </button>
          </div>
        </div>

        {/* Categories */}
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
              onClick={() => { setShowAddForm(true); setNewName(searchTerm); }}
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
                    ${isActive ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed' : ''}
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
                    {isActive && (
                      <div style={{ fontSize: "0.7rem", color: "var(--success-500)" }}>Již aktivní</div>
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
              <span>Vlastní...</span>
            </div>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="p-4 border-t bg-slate-50 rounded-b-xl animate-fade-in" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input 
              autoFocus
              className="form-input" 
              placeholder="Zadej název nové služby..." 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNewToRegistry()}
            />
          </div>
          <button onClick={addNewToRegistry} className="btn btn-primary">Uložit a vybrat</button>
          <button onClick={() => setShowAddForm(false)} className="btn btn-ghost">Zrušit</button>
        </div>
      )}
    </div>
  );
}
