"use client";

import { useState, useEffect } from "react";
import AvatarEditor from "@/components/common/AvatarEditor";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  avatar?: string;
  emailNotifyGlobal?: boolean;
  emailNotifyRequests?: boolean;
  emailNotifyChat?: boolean;
  emailNotifyNewService?: boolean;
  emailNotifyGrants?: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"profile" | "security" | "services" | "categories" | "currencies" | "system" | "development">("profile");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [systemUnlocked, setSystemUnlocked] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [editorTarget, setEditorTarget] = useState<null | 'profile' | 'service'>(null);
  const [editorImage, setEditorImage] = useState<string | null>(null);

  const onFileSelectForAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditorImage(reader.result?.toString() || null);
        setEditorTarget('profile');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((data) => {
      if (data) {
        setUser(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setAvatar(data.avatar || "");
      }
    });
  }, []);

  async function updateProfile(partialData: { name?: string; bio?: string; avatar?: string }) {
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: partialData.name ?? name,
        bio: partialData.bio ?? bio,
        avatar: partialData.avatar ?? avatar,
        ...partialData
      }),
    });
    if (res.ok) {
      const updatedData = await res.json();
      setUser(updatedData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function saveProfile(e: React.FormEvent) {
    if (e) e.preventDefault();
    await updateProfile({ name, bio, avatar });
  }

  return (
    <>
      <div className="page-content animate-fade-in">
        <div className="tabs">
          <button className={`tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
            👤 Profil
          </button>
          <button className={`tab ${tab === "security" ? "active" : ""}`} onClick={() => setTab("security")}>
            🔒 Bezpečnost
          </button>
          <button className={`tab ${tab === "services" ? "active" : ""}`} onClick={() => setTab("services")}>
            📋 Číselník služeb
          </button>
          <button className={`tab ${tab === "categories" ? "active" : ""}`} onClick={() => setTab("categories")}>
            📁 Kategorie
          </button>
          <button className={`tab ${tab === "currencies" ? "active" : ""}`} onClick={() => setTab("currencies")}>
            💰 Měny
          </button>
          <button className={`tab ${tab === "system" ? "active" : ""}`} onClick={() => setTab("system")}>
            ⚙️ Systém
          </button>
          <button className={`tab ${tab === "development" ? "active" : ""}`} onClick={() => setTab("development")}>
            🛠️ Vývoj
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

                <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
                  <div 
                    className="user-avatar group" 
                    style={{ width: 100, height: 100, fontSize: "2.5rem", border: "4px solid var(--bg-hover)", cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {avatar ? (
                      <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user?.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20" style={{ color: 'white' }}>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  </div>
                  <input type="file" id="avatar-upload" hidden accept="image/*" onChange={onFileSelectForAvatar} />
                  <div className="flex-1">
                    <div className="form-group mb-0">
                      <label className="form-label">Profilová fotka</label>
                      <div className="flex gap-2">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => document.getElementById('avatar-upload')?.click()}>
                          📂 Nahrát z počítače
                        </button>
                        {avatar && (
                          <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => { setAvatar(''); updateProfile({ avatar: '' }); }}>
                            Odstranit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jméno</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">O mně</label>
                  <textarea className="form-textarea" placeholder="Pár slov o sobě..." value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={user?.email || ""} disabled style={{ opacity: 0.7 }} />
                </div>

                <div className="divider" style={{ margin: "16px 0" }} />
                
                <div className="form-group">
                  <label className="form-label">✉️ Emailová oznámení</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                      <div>
                        <div className="font-bold text-sm">Povolit emaily</div>
                        <div className="text-xs text-muted">Globální vypínač</div>
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={user?.emailNotifyGlobal ?? true} onChange={(e) => updateProfile({ emailNotifyGlobal: e.target.checked } as any)} />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer" style={{ justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Ukládám..." : "Uložit změny"}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === "security" && (
          <div className="card" style={{ maxWidth: 600 }}>
            <div className="card-header"><h3>Bezpečnost účtu</h3></div>
            <div className="card-body">
              {!showPasswordForm ? (
                <div className="flex justify-between items-center py-4">
                  <div>
                    <div className="font-bold">Heslo</div>
                    <div className="text-sm text-muted">Změňte si své přístupové heslo</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowPasswordForm(true)}>Změnit heslo</button>
                </div>
              ) : (
                <PasswordChangeForm onCancel={() => setShowPasswordForm(false)} />
              )}
            </div>
          </div>
        )}

        {tab === "services" && <ServicesTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "currencies" && <CurrenciesTab />}
        
        {tab === "system" && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            {!systemUnlocked ? (
              <div className="card">
                <div className="card-header"><h3>🔐 Chráněná sekce</h3></div>
                <div className="card-body">
                  <div className="form-group flex gap-2">
                    <input 
                      type="password" 
                      className="form-input flex-1" 
                      placeholder="Heslo..." 
                      value={adminPass} 
                      onChange={e => setAdminPass(e.target.value)} 
                      onKeyDown={e => e.key === "Enter" && adminPass === "Admin123" && setSystemUnlocked(true)}
                    />
                    <button className="btn btn-primary" onClick={() => adminPass === "Admin123" ? setSystemUnlocked(true) : alert("Špatné heslo!")}>Odemknout</button>
                  </div>
                </div>
              </div>
            ) : (
              <SystemTab user={user} />
            )}
            <div className="mt-8">
               <div className="card">
                 <div className="card-header"><h3>📱 Instalace aplikace</h3></div>
                 <div className="card-body">
                   <InstallPwaCard />
                 </div>
               </div>
            </div>
          </div>
        )}

        {tab === "development" && <DevelopmentTab user={user} />}
      </div>

      {editorTarget === 'profile' && (
        <AvatarEditor 
          initialImage={editorImage}
          onCancel={() => { setEditorTarget(null); setEditorImage(null); }}
          onSave={async (base64) => {
            setAvatar(base64);
            setEditorTarget(null);
            setEditorImage(null);
            await updateProfile({ avatar: base64 });
          }}
        />
      )}
    </>
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
    if (newP !== confirm) return setError("Hesla se neshodují");
    setSaving(true);
    const res = await fetch("/api/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: newP }),
    });
    if (res.ok) { setDone(true); setTimeout(onCancel, 2000); }
    else { const d = await res.json(); setError(d.error || "Chyba"); }
    setSaving(false);
  }

  if (done) return <div className="alert alert-success">✅ Heslo změněno!</div>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group"><label className="form-label">Současné heslo</label><input type="password" dsa-label="Současné heslo" className="form-input" value={current} onChange={e => setCurrent(e.target.value)} required /></div>
      <div className="form-group"><label className="form-label">Nové heslo</label><input type="password" dsa-label="Nové heslo" className="form-input" value={newP} onChange={e => setNewP(e.target.value)} required /></div>
      <div className="form-group"><label className="form-label">Potvrzení</label><input type="password" dsa-label="Potvrzení" className="form-input" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Zrušit</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>Uložit</button>
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

  const EMOJI_GALLERY = ["🎬", "🎵", "☁️", "🎨", "🚀", "📚", "🏠", "🎙️", "📰", "💳"];

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName, icon: catIcon }),
    });
    setCatName(""); setEditingId(null); load();
  };

  if (loading) return <div className="p-8">Načítám...</div>;

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-header"><h3>📁 Správa kategorií</h3></div>
      <div className="card-body">
        <form onSubmit={save} className="flex gap-2 mb-6">
          <input className="form-input" placeholder="Zadejte název..." value={catName} onChange={e => setCatName(e.target.value)} />
          <button className="btn btn-primary">Přidat</button>
        </form>
        <div className="grid grid-cols-2 gap-3">
          {categories.map(c => (
            <div key={c.id} className="p-3 border rounded-xl flex items-center gap-3">
              <span className="text-xl">{c.icon}</span>
              <span className="font-bold">{c.name}</span>
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
  const [syncing, setSyncing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const EMPTY_FORM = {
    name: "", category: "", defaultPrice: 0, currency: "CZK",
    billingCycle: "MONTHLY", pricingType: "PAID", isShareable: true,
    description: "", usageMode: "PRIVATE", requiresBookingApproval: false,
    url: "", iconUrl: "",
  };

  const [svcForm, setSvcForm] = useState(EMPTY_FORM);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cr, sr] = await Promise.all([fetch("/api/categories"), fetch("/api/service-registry")]);
      setCategories(await cr.json());
      setServices(await sr.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onSync = async () => {
    if (!confirm("Opravdu sjednotit číselník s vašimi službami?")) return;
    setSyncing(true);
    const res = await fetch("/api/admin/sync-services", { method: "POST" });
    if (res.ok) { alert("Synchronizováno!"); load(); }
    setSyncing(false);
  };

  const deleteDuplicates = async () => {
    if (!confirm("Sloučit duplicity?")) return;
    setSyncing(true);
    const res = await fetch("/api/admin/sync-services", { method: "DELETE" });
    if (res.ok) { alert("Duplicity odstraněny!"); load(); }
    setSyncing(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingServiceId ? "PATCH" : "POST";
    const url = editingServiceId ? `/api/service-registry/${editingServiceId}` : "/api/service-registry";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(svcForm),
    });
    if (res.ok) { setShowFormModal(false); load(); }
  };

  const startEdit = (s: any) => {
    setSvcForm({ ...s, defaultPrice: Number(s.defaultPrice) });
    setEditingServiceId(s.id);
    setShowFormModal(true);
  };

  if (loading) return <div className="p-8">Načítám číselník...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <div className="card-header flex justify-between items-center flex-wrap gap-2">
          <h3>📋 Číselník služeb</h3>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={onSync} disabled={syncing}>
              {syncing ? "..." : "🔗 Sjednotit"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={deleteDuplicates} disabled={syncing}>
              🧹 Čistit
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { setSvcForm(EMPTY_FORM); setEditingServiceId(null); setShowFormModal(true); }}>
              ➕ Přidat službu
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Název</th><th>Kategorie</th><th>Cena</th><th></th></tr></thead>
            <tbody>
              {services.length === 0 && <tr><td colSpan={4} className="text-center p-8 text-muted">Žádné služby.</td></tr>}
              {services.map(s => (
                <tr key={s.id}>
                  <td><div className="flex items-center gap-2">
                    {s.iconUrl ? <img src={s.iconUrl} className="w-8 h-8 object-contain" /> : <span>📦</span>}
                    <span className="font-bold">{s.name}</span>
                  </div></td>
                  <td>{s.category}</td>
                  <td>{Number(s.defaultPrice).toFixed(2)} {s.currency}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showFormModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowFormModal(false)}>
          <div className="modal animate-fade-in" style={{ maxWidth: 500 }}>
            <div className="modal-header"><h3>{editingServiceId ? "Upravit" : "Přidat"} službu</h3></div>
            <form onSubmit={save} className="modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Název</label>
                <input className="form-input" value={svcForm.name} onChange={e => setSvcForm({...svcForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Kategorie</label>
                <select className="form-select" value={svcForm.category} onChange={e => setSvcForm({...svcForm, category: e.target.value})}>
                  <option value="">-- Vyberte --</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Cena</label>
                  <input type="number" step="0.01" className="form-input" value={svcForm.defaultPrice} onChange={e => setSvcForm({...svcForm, defaultPrice: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Měna</label>
                  <select className="form-select" value={svcForm.currency} onChange={e => setSvcForm({...svcForm, currency: e.target.value})}>
                    <option value="CZK">CZK</option><option value="EUR">EUR</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer px-0 pb-0 mt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setShowFormModal(false)}>Zrušit</button>
                <button type="submit" className="btn btn-primary">Uložit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


function CurrenciesTab() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importYear, setImportYear] = useState(new Date().getFullYear().toString());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/currencies");
    setCurrencies(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/currencies/import-cnb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: parseInt(importYear) }),
      });
      const data = await res.json();
      setImportResult(data);
      if (res.ok) load();
    } catch {
      setImportResult({ error: "Chyba spojení" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-header"><h3>💰 Správa měn (ČNB)</h3></div>
      <div className="card-body">
        <div className="flex gap-2 mb-6">
          <input type="number" className="form-input w-24" value={importYear} onChange={e => setImportYear(e.target.value)} />
          <button className="btn btn-secondary" onClick={runImport} disabled={importing}>
            {importing ? "Importuji..." : "📥 Importovat kurzy"}
          </button>
        </div>

        {importResult && (
          <div className={`p-3 rounded-lg mb-4 text-xs ${importResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {importResult.error ? importResult.error : `Importováno ${importResult.imported} kurzů pro rok ${importResult.year}.`}
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>Kód</th><th>Název</th><th className="text-right">Kurz (CZK)</th></tr></thead>
            <tbody>
              {currencies.map(c => (
                <tr key={c.code}>
                  <td className="font-bold">{c.code}</td>
                  <td>{c.name}</td>
                  <td className="text-right">{c.rates && c.rates[0] ? Number(c.rates[0].rateToCzk).toFixed(4) : "---"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SystemTab({ user }: { user: any }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function testEmail() {
    setTesting(true);
    const res = await fetch("/api/test-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email }) });
    setResult(await res.json());
    setTesting(false);
  }

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-header"><h3>⚙️ Systémová nastavení</h3></div>
      <div className="card-body flex flex-col gap-6">
        <div>
          <h4 className="mb-2">📧 Test emailu</h4>
          <button className="btn btn-primary btn-sm" onClick={testEmail} disabled={testing}>{testing ? "Posílám..." : "Odeslat test"}</button>
          {result && <div className="mt-2 text-xs">{result.success ? "✅ OK" : "❌ Chyba"}</div>}
        </div>
      </div>
    </div>
  );
}

function DevelopmentTab({ user }: { user: any }) {
  if (user?.role !== "ADMIN") return <div className="p-8">Pouze pro administrátory.</div>;
  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-header"><h3>🛠️ Vývojářské nástroje</h3></div>
      <div className="card-body">
         <p className="text-sm">Vítejte v admin módu.</p>
      </div>
    </div>
  );
}

function InstallPwaCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">Můžete si nainstalovat aplikaci Palalate na plochu pro rychlý přístup.</p>
      <button className="btn btn-secondary btn-sm" disabled={!deferredPrompt} onClick={install}>
        {deferredPrompt ? "📲 Instalovat Palalate" : "📦 Již nainstalováno nebo nepodporováno"}
      </button>
    </div>
  );
}
