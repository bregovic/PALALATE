"use client";

import { useState, useEffect } from "react";

interface RegistryService {
  id: string;
  name: string;
  category: string | null;
  defaultPrice: number | null;
  currency: string;
}

export function ServiceGridPicker({ activeServiceNames }: { activeServiceNames: string[] }) {
  const [registry, setRegistry] = useState<RegistryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("/api/service-registry")
      .then(res => res.json())
      .then(data => {
        setRegistry(data);
        setLoading(false);
      });
  }, []);

  const toggleService = async (item: RegistryService) => {
    const isActive = activeServiceNames.includes(item.name);
    if (isActive) return; // For now don't delete from here, just add

    setProcessing(prev => [...prev, item.id]);
    
    try {
      const res = await fetch("/api/services", {
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

      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(prev => prev.filter(id => id !== item.id));
    }
  };

  const addNewToRegistry = async () => {
    if (!newName) return;
    setLoading(true);

    try {
      const res = await fetch("/api/service-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setRegistry(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        setNewName("");
        setShowAddForm(false);
        // Automatically toggle it
        await toggleService(newItem);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = registry.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && registry.length === 0) return <div>Načítám číselník...</div>;

  return (
    <div className="card mb-8">
      <div className="card-header">
        <h3 className="text-lg font-semibold">🔍 Aktivovat nové služby</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input 
            type="text" 
            placeholder="Hledat v číselníku..." 
            className="form-input" 
            style={{ maxWidth: 240 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="card-body">
        <div className="grid-auto">
          {filtered.map(item => {
            const isActive = activeServiceNames.includes(item.name);
            const isProcessing = processing.includes(item.id);

            return (
              <label 
                key={item.id} 
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${isActive ? 'bg-brand-50 border-brand-200' : 'hover:bg-slate-50'}`}
              >
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  disabled={isActive || isProcessing}
                  onChange={() => toggleService(item)}
                  className="w-5 h-5"
                />
                <span className={isActive ? 'font-medium text-brand-700' : 'text-slate-600'}>
                  {item.name}
                </span>
                {isProcessing && <div className="spinner-sm" />}
              </label>
            );
          })}
          
          {!showAddForm ? (
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 p-3 border border-dashed rounded-lg text-slate-400 hover:text-brand-600 hover:border-brand-300 transition-all text-sm"
            >
              ➕ Přidat jinou službu...
            </button>
          ) : (
            <div className="flex gap-2 p-2 border rounded-lg bg-slate-50">
               <input 
                 autoFocus
                 className="form-input btn-sm" 
                 placeholder="Název služby" 
                 value={newName}
                 onChange={e => setNewName(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && addNewToRegistry()}
               />
               <button onClick={addNewToRegistry} className="btn btn-primary btn-sm">OK</button>
               <button onClick={() => setShowAddForm(false)} className="btn btn-ghost btn-sm">✖</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
