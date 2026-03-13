"use client";

import { useState, useEffect } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"profile" | "security" | "privacy" | "management">("profile");

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((data) => {
      if (data) {
        setUser(data);
        setName(data.name || "");
        setBio(data.bio || "");
      }
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nastavení</h1>
          <p className="page-subtitle">Tvůj profil, bezpečnost a preference</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
          👤 Profil
        </button>
        <button className={`tab ${tab === "security" ? "active" : ""}`} onClick={() => setTab("security")}>
          🔐 Bezpečnost
        </button>
        <button className={`tab ${tab === "privacy" ? "active" : ""}`} onClick={() => setTab("privacy")}>
          🛡️ Soukromí
        </button>
        <button className={`tab ${tab === "management" ? "active" : ""}`} onClick={() => setTab("management")}>
          ⚙️ Správa
        </button>
      </div>

      {tab === "profile" && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header"><h3>Profilové informace</h3></div>
          <form onSubmit={saveProfile}>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {saved && (
                <div className="alert alert-success">
                  ✅ Profil uložen!
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                <div className="user-avatar" style={{ width: 64, height: 64, fontSize: "1.4rem" }}>
                  {user?.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user?.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{user?.email}</div>
                  <div className="mt-2">
                    <span className={`badge ${user?.role === "ADMIN" ? "badge-purple" : "badge-blue"}`}>
                      {user?.role === "ADMIN" ? "👑 Admin" : "🙋 Uživatel"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Jméno</label>
                <input
                  id="settings-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">O mně</label>
                <textarea
                  id="settings-bio"
                  className="form-textarea"
                  placeholder="Pár slov o sobě... nebo jen emoji 🦄"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ""}
                  disabled
                  style={{ opacity: 0.7 }}
                />
                <span className="form-hint">Email zatím nelze změnit</span>
              </div>
            </div>
            <div className="card-footer" style={{ justifyContent: "flex-end" }}>
              <button
                id="save-profile-btn"
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Ukládám...</> : "Uložit změny"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "security" && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header"><h3>Bezpečnost účtu</h3></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Heslo</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Naposled změněno: neznámo</div>
                </div>
                <button className="btn btn-secondary btn-sm" disabled>Změnit heslo</button>
              </div>
            </div>

          </div>
        </div>
      )}
      {tab === "privacy" && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header"><h3>Soukromí a GDPR</h3></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="alert alert-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Tvá data jsou chráněna a nikdy nejsou sdílena třetím stranám bez tvého souhlasu.</span>
            </div>

            <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Export mých dat</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Stáhni všechna svá data (GDPR)</div>
                </div>
                <button className="btn btn-secondary btn-sm" disabled>Exportovat</button>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--danger-400)", marginBottom: 4 }}>Smazat účet</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Nevratná akce – smaže všechna tvá data
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" disabled>Smazat účet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "management" && <ManagementTab />}
    </div>
  );
}

function ManagementTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Category Form
  const [catName, setCatName] = useState("");
  
  // Service Form
  const [svcForm, setSvcForm] = useState({
    name: "",
    category: "",
    defaultPrice: 0,
    currency: "CZK",
    billingCycle: "MONTHLY",
    pricingType: "PAID",
    isShareable: true,
    description: ""
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cr, sr] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/service-registry")
      ]);
      setCategories(await cr.json());
      setServices(await sr.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName }),
    });
    if (res.ok) {
      setCatName("");
      load();
    }
  };

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcForm.name) return;
    
    const method = editingServiceId ? "PATCH" : "POST";
    const url = editingServiceId ? `/api/service-registry/${editingServiceId}` : "/api/service-registry";
    
    // We need to handle PATCH in a new API route or update the existing one
    // For now, let's assume we use the POST route with an ID if possible, 
    // but better practice is a separate route. 
    // Wait, the existing /api/service-registry route handles only POST.
    // I should check if I need to create /api/service-registry/[id]/route.ts
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(svcForm),
    });
    if (res.ok) {
      cancelEdit();
      load();
    }
  };

  const startEdit = (service: any) => {
    setSvcForm({
      name: service.name,
      category: service.category || "",
      defaultPrice: service.defaultPrice,
      currency: service.currency,
      billingCycle: service.billingCycle,
      pricingType: service.pricingType || "PAID",
      isShareable: service.isShareable,
      description: service.description || ""
    });
    setEditingServiceId(service.id);
  };

  const cancelEdit = () => {
    setSvcForm({
      name: "", category: "", defaultPrice: 0, currency: "CZK",
      billingCycle: "MONTHLY", pricingType: "PAID", isShareable: true, description: ""
    });
    setEditingServiceId(null);
  };

  if (loading) return <div>Načítám číselníky...</div>;

  return (
    <div className="grid-2" style={{ gridTemplateColumns: "1fr 1.5fr", gap: 24, alignItems: "start" }}>
      {/* Categories */}
      <div className="card">
        <div className="card-header"><h3>📁 Kategorie</h3></div>
        <div className="card-body">
          <form onSubmit={saveCategory} className="flex gap-2 mb-4">
            <input 
              className="form-input" 
              placeholder="Nová kategorie..." 
              value={catName}
              onChange={e => setCatName(e.target.value)}
            />
            <button className="btn btn-secondary">Přidat</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c.id} className="badge badge-blue">{c.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Services Registry */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Číselník služeb</h3>
          {editingServiceId && (
            <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Zrušit editaci</button>
          )}
        </div>
        <div className="card-body">
          <form onSubmit={saveService} className="grid-1 gap-4 mb-8 p-4 bg-muted rounded-lg">
            <div className="grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Název</label>
                <input className="form-input" value={svcForm.name} onChange={e => setSvcForm({...svcForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Kategorie</label>
                <select className="form-select" value={svcForm.category} onChange={e => setSvcForm({...svcForm, category: e.target.value})}>
                  <option value="">-- Vyber --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-3 gap-4">
              <div className="form-group">
                <label className="form-label">Výchozí cena</label>
                <input type="number" className="form-input" value={svcForm.defaultPrice} onChange={e => setSvcForm({...svcForm, defaultPrice: parseFloat(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Měna</label>
                <select className="form-select" value={svcForm.currency} onChange={e => setSvcForm({...svcForm, currency: e.target.value})}>
                  <option value="CZK">CZK</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Frekvence</label>
                <select className="form-select" value={svcForm.billingCycle} onChange={e => setSvcForm({...svcForm, billingCycle: e.target.value})}>
                  <option value="MONTHLY">Měsíčně</option>
                  <option value="YEARLY">Ročně</option>
                </select>
              </div>
            </div>
            <div className="flex gap-6 items-center">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" checked={svcForm.isShareable} onChange={e => setSvcForm({...svcForm, isShareable: e.target.checked})} />
                 <span className="text-sm">Lze sdílet?</span>
               </label>
               <div className="flex gap-2">
                 <label className="text-sm">Typ:</label>
                 <select className="form-select btn-sm" value={svcForm.pricingType} onChange={e => setSvcForm({...svcForm, pricingType: e.target.value})}>
                   <option value="PAID">Placené</option>
                   <option value="AFFILIATE">Affiliate</option>
                   <option value="INCLUDED">V ceně</option>
                 </select>
               </div>
            </div>
            <button className="btn btn-primary w-full">
              {editingServiceId ? "Uložit změny" : "Uložit do číselníku"}
            </button>
          </form>

          <div className="table-wrap">
            <table className="text-xs">
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Kategorie</th>
                  <th>Cena</th>
                  <th>Sdílet?</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td className="font-bold">{s.name}</td>
                    <td>{s.category}</td>
                    <td>{s.defaultPrice} {s.currency}</td>
                    <td>{s.isShareable ? "✅" : "❌"}</td>
                    <td>
                      <button 
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => startEdit(s)}
                        title="Upravit"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
