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
  const [tab, setTab] = useState<"profile" | "security" | "privacy">("profile");

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
            <div className="alert alert-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <span>Změna hesla a 2FA bude dostupná v příští verzi. Pracujeme na tom! 🔨</span>
            </div>

            <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Heslo</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Naposled změněno: neznámo</div>
                </div>
                <button className="btn btn-secondary btn-sm" disabled>Změnit heslo</button>
              </div>
            </div>

            <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Dvoufaktorové ověření (2FA)</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Zvýší bezpečnost tvého účtu</div>
                </div>
                <span className="badge badge-yellow">Brzy</span>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Aktivní relace</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Spravuj kde jsi přihlášen</div>
                </div>
                <button className="btn btn-secondary btn-sm" disabled>Zobrazit</button>
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
    </div>
  );
}
