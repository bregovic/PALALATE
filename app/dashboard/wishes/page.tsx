"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Wish {
  id: string;
  serviceName: string;
  description: string | null;
  link: string | null;
  priority: number;
  status: string;
  createdAt: string;
}

export default function WishesPage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    serviceName: "",
    description: "",
    link: "",
    priority: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/wishes");
      if (res.ok) setWishes(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleAddWish() {
    if (!form.serviceName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ serviceName: "", description: "", link: "", priority: 0 });
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWish(id: string) {
    if (!confirm("Opravdu chcete toto přání smazat?")) return;
    const res = await fetch(`/api/wishes/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  if (loading && wishes.length === 0) {
    return <div className="page-content"><div className="skeleton" style={{ height: 400 }} /></div>;
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">✨ Moje přání</h1>
          <p className="page-subtitle">Služby, o které bys měl zájem. Třeba se k tobě někdo přidá!</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ＋ Přidat přání
        </button>
      </div>

      {wishes.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">✨</div>
          <h3 className="empty-title">Zatím nemáš žádná přání</h3>
          <p className="empty-desc">Napiš si sem služby, které bys chtěl odebírat, ale zatím je nemáš s kým sdílet.</p>
          <button className="btn btn-secondary mt-4" onClick={() => setShowModal(true)}>Přidat první přání</button>
        </div>
      ) : (
        <div className="grid-auto">
          {wishes.map(wish => (
            <div key={wish.id} className="card p-6 relative group">
              <button 
                className="absolute top-4 right-4 text-danger opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full"
                onClick={() => handleDeleteWish(wish.id)}
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="user-avatar" style={{ borderRadius: 12, background: 'var(--brand-50)', color: 'var(--brand-600)' }}>
                  ✨
                </div>
                <div>
                   <h3 className="text-lg">{wish.serviceName}</h3>
                   <span className="text-[10px] text-muted uppercase tracking-wider font-bold">
                     Přidáno: {new Date(wish.createdAt).toLocaleDateString()}
                   </span>
                </div>
              </div>

              {wish.description && (
                <p className="text-sm text-secondary mb-4 italic">"{wish.description}"</p>
              )}

              {wish.link && (
                <a href={wish.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline flex items-center gap-1 mb-4">
                   🌐 Odkaz na službu
                </a>
              )}

              <div className="mt-auto pt-4 border-t border-dashed border-subtle">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted">Priorita:</span>
                    <span className={`font-bold ${wish.priority > 0 ? 'text-amber-600' : 'text-muted'}`}>
                      {wish.priority > 0 ? '🔥 Vysoká' : '🛡️ Standard'}
                    </span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>✨ Co by sis přál?</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Název služby</label>
                <input 
                  className="form-input" 
                  placeholder="Např. YouTube Premium, Midjourney..."
                  value={form.serviceName}
                  onChange={e => setForm({...form, serviceName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Proč to chceš? (dobrovolné)</label>
                <textarea 
                  className="form-input" 
                  placeholder="Hledám 2 lidi do rodinného tarifu..."
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Odkaz</label>
                <input 
                  className="form-input" 
                  placeholder="https://..."
                  value={form.link}
                  onChange={e => setForm({...form, link: e.target.value})}
                />
              </div>
              <div className="form-group">
                 <label className="form-label">Priorita</label>
                 <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: parseInt(e.target.value)})}>
                    <option value={0}>Standardní</option>
                    <option value={1}>Vysoká (Důležité)</option>
                 </select>
              </div>
            </div>
            <div className="modal-footer flex gap-3">
              <button className="btn btn-ghost w-full" onClick={() => setShowModal(false)}>Zrušit</button>
              <button className="btn btn-primary w-full" disabled={saving || !form.serviceName} onClick={handleAddWish}>
                {saving ? "Ukládám..." : "Přidat do seznamu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
