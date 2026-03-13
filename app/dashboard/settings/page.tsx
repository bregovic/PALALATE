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
  const [tab, setTab] = useState<"profile" | "security" | "services" | "categories" | "system">("profile");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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
        <button className={`tab ${tab === "services" ? "active" : ""}`} onClick={() => setTab("services")}>
          📋 Číselník služeb
        </button>
        <button className={`tab ${tab === "categories" ? "active" : ""}`} onClick={() => setTab("categories")}>
          📁 Kategorie
        </button>
        {user && (
          <button className={`tab ${tab === "system" ? "active" : ""}`} onClick={() => setTab("system")}>
            ⚙️ Systém
          </button>
        )}
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
            {!showPasswordForm ? (
              <div style={{ padding: "16px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Heslo</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Změňte si své přístupové heslo</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowPasswordForm(true)}>Změnit heslo</button>
                </div>
              </div>
            ) : (
              <PasswordChangeForm onCancel={() => setShowPasswordForm(false)} />
            )}

          </div>
        </div>
      )}

      {tab === "services" && <ServicesTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "system" && <SystemTab user={user} />}
    </div>
  );
}

function SystemTab({ user }: { user: any }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [debug, setDebug] = useState<any>(null);
  const [genKey, setGenKey] = useState("");

  useEffect(() => {
    fetch("/api/system/config-check")
      .then(res => res.json())
      .then(data => setDebug(data.config))
      .catch(() => {});
  }, []);

  async function testEmail() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: "Nepodařilo se spojit se serverem." });
    } finally {
      setTesting(false);
    }
  }

  const generateKey = () => {
    const chars = '0123456789abcdef';
    let key = '';
    for (let i = 0; i < 64; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    setGenKey(key);
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: 600 }}>
      <div className="card-header"><h3>⚙️ Systémová nastavení</h3></div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Email Test */}
        <div>
          <h4 className="mb-2">📧 Test odesílání emailů</h4>
          <p className="text-sm text-muted mb-4">
            Tato funkce ověří, zda je správně nastaveno SMTP (Gmail) nebo Resend na Railway. 
            Testovací email bude odeslán na adresu: <strong>{user?.email}</strong>.
          </p>
          
          <button 
            className="btn btn-primary" 
            onClick={testEmail} 
            disabled={testing}
          >
            {testing ? "Odesílám..." : "Odeslat testovací email"}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded-xl border ${result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              {result.success ? (
                <>
                  <div className="font-bold mb-1">✅ Email byl úspěšně odeslán!</div>
                  <div className="text-xs">Zkontrolujte si schránku (včetně složky SPAM).</div>
                </>
              ) : (
                <>
                  <div className="font-bold mb-1">❌ Chyba při odesílání</div>
                  <pre className="text-xs break-all whitespace-pre-wrap">{JSON.stringify(result.error, null, 2)}</pre>
                  <p className="text-[10px] mt-2 italic text-muted">Zkontrolujte Railway logs pro více detailů.</p>
                </>
              )}
            </div>
          )}
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--border-subtle)" }} />

        {/* Encryption Key Generator */}
        <div>
          <h4 className="mb-2">🔐 Šifrovací klíč (Credentials)</h4>
          <p className="text-sm text-muted mb-4">
            Pro ukládání hesel potřebuje aplikace 32-bytový hex klíč v proměnné <code>CREDENTIAL_ENCRYPTION_KEY</code>.
            Pokud ho ještě nemáte nastavený na Railway, vygenerujte si ho zde a vložte ho do <strong>Variables</strong> projektu.
          </p>
          
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={generateKey}>Vygenerovat nový klíč</button>
            {genKey && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => {
                  navigator.clipboard.writeText(genKey);
                  alert("Klíč byl zkopírován!");
                }}
              >
                📋 Kopírovat
              </button>
            )}
          </div>

          {genKey && (
            <div className="mt-3 p-3 bg-muted rounded-lg border border-subtle font-mono text-[10px] break-all">
              {genKey}
            </div>
          )}
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--border-subtle)" }} />

        <div>
          <h4 className="mb-2">🛠️ Debug informace</h4>
          <div className="text-[10px] font-mono bg-muted p-4 rounded-xl border border-subtle">
            <div>User ID: {user?.id}</div>
            <div>Role: {user?.role}</div>
            <div>Node version: {typeof process !== 'undefined' ? process.version : 'unknown'}</div>
            <div className="mt-2 pt-2 border-t border-subtle">
              <div className="font-bold mb-1">Environment status:</div>
              {debug ? Object.entries(debug).map(([k, v]: any) => (
                <div key={k}>{k}: {v === true ? "✅ set" : (v === false ? "❌ missing" : v)}</div>
              )) : "Loading config..."}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function PasswordChangeForm({ onCancel }: { onCancel: () => void }) {
  const [current, setCurrent] = useState("");
  const [newP, setNewP] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newP !== confirm) return setError("Hesla se neshodují");
    if (newP.length < 8) return setError("Heslo musí mít aspoň 8 znaků");

    setSaving(true);
    const res = await fetch("/api/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: newP }),
    });

    if (res.ok) {
      setDone(true);
      setTimeout(onCancel, 2000);
    } else {
      const data = await res.json();
      setError(data.error || "Chyba při změně hesla");
    }
    setSaving(false);
  }

  if (done) return <div className="alert alert-success">✅ Heslo bylo změněno!</div>;

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0" }}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label className="form-label">Současné heslo</label>
        <input type="password" dsa-label="Současné heslo" className="form-input" value={current} onChange={e => setCurrent(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Nové heslo</label>
        <input type="password" dsa-label="Nové heslo" className="form-input" value={newP} onChange={e => setNewP(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Potvrzení nového hesla</label>
        <input type="password" dsa-label="Potvrzení hesla" className="form-input" value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Zrušit</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Ukládám..." : "Uložit nové heslo"}
        </button>
      </div>
    </form>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("📦");
  const [editingId, setEditingId] = useState<string | null>(null);

  const EMOJI_GALLERY = ["🎬", "🎵", "☁️", "🎨", "🚀", "📚", "🏠", "🎙️", "📰", "💳", "🛒", "🏦", "💼", "🎮", "🍔", "💪", "✈️", "🤖", "👔", "🛠️"];

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName, icon: catIcon }),
    });
    if (res.ok) {
      setCatName("");
      setCatIcon("📦");
      setEditingId(null);
      load();
    }
  };

  const startEdit = (c: any) => {
    setCatName(c.name);
    setCatIcon(c.icon || "📦");
    setEditingId(c.id);
  };

  if (loading) return <div className="p-8">Načítám kategorie...</div>;

  return (
    <div className="card animate-fade-in" style={{ maxWidth: 600 }}>
      <div className="card-header flex justify-between items-center">
        <h3>📁 Správa kategorií</h3>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={async () => {
             if (confirm("Chcete naplnit kategorie a číselník výchozími daty?")) {
                const res = await fetch("/api/admin/seed");
                if (res.ok) {
                   alert("Hotovo! Číselníky byly naplněny.");
                   load();
                } else {
                   alert("Chyba při plnění dat.");
                }
             }
          }}
        >
          🔄 Naplnit výchozí
        </button>
      </div>
      <div className="card-body">
        <form onSubmit={saveCategory} className="flex flex-col gap-4 mb-8 p-4 bg-muted rounded-xl shadow-sm">
          <div className="flex gap-2">
            <input 
              className="form-input" 
              placeholder="Název kategorie..." 
              value={catName}
              onChange={e => setCatName(e.target.value)}
            />
            <button className="btn btn-primary">{editingId ? "Uložit změny" : "Přidat kategorii"}</button>
          </div>
          <div>
            <label className="text-xs text-muted block mb-2 font-bold uppercase tracking-wider">Vyber piktogram:</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_GALLERY.map(e => (
                <button 
                  key={e}
                  type="button"
                  className={`btn btn-ghost p-2 text-xl hover:bg-white rounded-lg transition-transform hover:scale-110 ${catIcon === e ? "bg-white border-2 border-primary" : ""}`}
                  onClick={() => setCatIcon(e)}
                >
                  {e}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                 <span className="text-xs text-muted italic">Vlastní:</span>
                 <input className="form-input w-12 p-1 text-center" value={catIcon} onChange={e => setCatIcon(e.target.value)} />
              </div>
            </div>
          </div>
        </form>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {categories.map(c => (
            <div key={c.id} className="p-3 rounded-xl border border-subtle bg-elevated flex items-center gap-3 group hover:shadow-md transition-all">
              <span className="text-2xl">{c.icon || "📦"}</span>
              <span className="font-semibold text-sm">{c.name}</span>
              <button 
                className="btn btn-ghost btn-icon btn-sm ml-auto opacity-0 group-hover:opacity-100" 
                onClick={() => startEdit(c)}
              >
                ✏️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [svcForm, setSvcForm] = useState({
    name: "",
    category: "",
    defaultPrice: 0,
    currency: "CZK",
    billingCycle: "MONTHLY",
    pricingType: "PAID",
    isShareable: true,
    description: "",
    usageMode: "PRIVATE",
    requiresBookingApproval: false,
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

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcForm.name) return;
    
    const method = editingServiceId ? "PATCH" : "POST";
    const url = editingServiceId ? `/api/service-registry/${editingServiceId}` : "/api/service-registry";
    
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
      defaultPrice: Number(service.defaultPrice),
      currency: service.currency,
      billingCycle: service.billingCycle,
      pricingType: service.pricingType || "PAID",
      isShareable: service.isShareable,
      description: service.description || "",
      usageMode: service.usageMode || "PRIVATE",
      requiresBookingApproval: service.requiresBookingApproval ?? false,
    });
    setEditingServiceId(service.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setSvcForm({
      name: "", category: "", defaultPrice: 0, currency: "CZK",
      billingCycle: "MONTHLY", pricingType: "PAID", isShareable: true, description: "",
      usageMode: "PRIVATE", requiresBookingApproval: false
    });
    setEditingServiceId(null);
  };

  if (loading) return <div className="p-8">Načítám číselník...</div>;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="card">
        <div className="card-header">
          <h3>{editingServiceId ? "✏️ Upravit službu" : "➕ Přidat do číselníku"}</h3>
          {editingServiceId && (
            <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Zrušit editaci</button>
          )}
        </div>
        <div className="card-body">
          <form onSubmit={saveService} className="grid-1 gap-6">
            <div className="grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Název služby</label>
                <input className="form-input" value={svcForm.name} onChange={e => setSvcForm({...svcForm, name: e.target.value})} placeholder="Např. Netflix" />
              </div>
              <div className="form-group">
                <label className="form-label">Kategorie</label>
                <select className="form-select" value={svcForm.category} onChange={e => setSvcForm({...svcForm, category: e.target.value})}>
                  <option value="">-- Vyber kategorii --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid-3 gap-4">
              <div className="form-group">
                <label className="form-label">Výchozí cena</label>
                <input type="number" step="0.01" className="form-input" value={svcForm.defaultPrice} onChange={e => setSvcForm({...svcForm, defaultPrice: parseFloat(e.target.value)})} />
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
                <label className="form-label">Frekvence platby</label>
                <select className="form-select" value={svcForm.billingCycle} onChange={e => setSvcForm({...svcForm, billingCycle: e.target.value})}>
                  <option value="MONTHLY">Měsíčně</option>
                  <option value="QUARTERLY">Čtvrtletně</option>
                  <option value="SEMI_ANNUALLY">Půlročně</option>
                  <option value="YEARLY">Ročně</option>
                  <option value="WEEKLY">Týdně</option>
                </select>
              </div>
            </div>

            <div className="grid-2 gap-4 items-center">
               <div className="flex flex-col gap-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="checkbox" checked={svcForm.isShareable} onChange={e => setSvcForm({...svcForm, isShareable: e.target.checked})} />
                   <span className="text-sm">Lze sdílet ve skupině</span>
                 </label>
                 <div className="flex flex-col gap-1 mt-2">
                    <label className="text-xs font-bold text-muted uppercase">Režim používání</label>
                    <select 
                      className="form-select text-sm" 
                      value={svcForm.usageMode} 
                      onChange={e => setSvcForm({...svcForm, usageMode: e.target.value})}
                    >
                       <option value="PRIVATE">🔒 Soukromé</option>
                       <option value="SHARED">👥 Sdílené</option>
                       <option value="SHARED_ROTATION">🕒 Střídání (Rezervace)</option>
                       <option value="LICENSE">🔑 Licence</option>
                    </select>
                 </div>
                 {svcForm.usageMode === "SHARED_ROTATION" && (
                   <label className="flex items-center gap-2 cursor-pointer mt-1">
                     <input type="checkbox" checked={svcForm.requiresBookingApproval} onChange={e => setSvcForm({...svcForm, requiresBookingApproval: e.target.checked})} />
                     <span className="text-xs">Vyžadovat schválení rezervace</span>
                   </label>
                 )}
               </div>
               <div className="form-group">
                 <label className="form-label">Výchozí typ platby</label>
                 <select className="form-select" value={svcForm.pricingType} onChange={e => setSvcForm({...svcForm, pricingType: e.target.value})}>
                    <option value="PAID">Placené</option>
                    <option value="AFFILIATE">Affiliate / Deal</option>
                    <option value="INCLUDED">V balíčku</option>
                    <option value="FREE">Zdarma</option>
                 </select>
               </div>
            </div>

            <div className="form-group">
              <label className="form-label">Popis (interní)</label>
              <textarea 
                className="form-input" 
                style={{ minHeight: 60 }} 
                value={svcForm.description} 
                onChange={e => setSvcForm({...svcForm, description: e.target.value})}
                placeholder="Krátký popis pro číselník..."
              />
            </div>

            <button className="btn btn-primary w-full btn-lg">
              {editingServiceId ? "Aktualizovat službu v číselníku ✓" : "Přidat službu do systému →"}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>📋 Seznam služeb v systému</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Název</th>
                <th>Kategorie</th>
                <th>Výchozí cena</th>
                <th>Sdílení</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td className="font-bold">{s.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {categories.find(c => c.name === s.category)?.icon || "📦"}
                      </span>
                      {s.category || <span className="text-muted italic">není</span>}
                    </div>
                  </td>
                  <td>{Number(s.defaultPrice).toFixed(2)} {s.currency} / {s.billingCycle}</td>
                  <td>{s.isShareable ? <span className="badge badge-green">Povoleno</span> : <span className="badge badge-gray">Zakázáno</span>}</td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={async () => {
                          const res = await fetch("/api/services", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              serviceName: s.name,
                              providerName: s.name,
                              periodicPrice: s.defaultPrice || 0,
                              currency: s.currency || "CZK",
                              category: s.category || "other",
                              pricingType: s.pricingType || "PAID",
                              billingCycle: s.billingCycle || "MONTHLY",
                              usageMode: s.usageMode || "PRIVATE",
                              requiresBookingApproval: s.requiresBookingApproval || false
                            }),
                          });
                          if (res.ok) alert(`Služba ${s.name} byla přidána do tvého seznamu!`);
                        }}
                      >
                        ➕ Do mých služeb
                      </button>
                      <button 
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => startEdit(s)}
                        title="Upravit"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ManagementTab() {
  return null; // Deprecated
}
