"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";


const POPULAR_SERVICES = [
  { name: "Netflix", provider: "Netflix Inc.", category: "streaming" },
  { name: "Spotify", provider: "Spotify AB", category: "music" },
  { name: "YouTube Premium", provider: "Google", category: "streaming" },
  { name: "Disney+", provider: "Disney", category: "streaming" },
  { name: "Apple Music", provider: "Apple Inc.", category: "music" },
  { name: "ChatGPT Plus", provider: "OpenAI", category: "ai" },
  { name: "Adobe CC", provider: "Adobe Inc.", category: "design" },
  { name: "Dropbox", provider: "Dropbox Inc.", category: "cloud" },
  { name: "Microsoft 365", provider: "Microsoft", category: "productivity" },
];

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  useState(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(setCategories)
      .catch(console.error);
  });

  const [form, setForm] = useState({
    serviceName: "",
    providerName: "",
    category: "other",
    description: "",
    periodicPrice: "",
    currency: "CZK",
    billingCycle: "MONTHLY",
    renewalDate: "",
    sharingStatus: "SHARING_DISABLED",
    sharingVisibility: "FRIENDS_ONLY",
    maxSharedSlots: "0",
    legalNote: "",
    websiteUrl: "",
    internalNote: "",
    sharingConditions: "",
  });

  function fill(data: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...data }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodařilo se přidat službu");
        return;
      }

      router.push(`/dashboard/services/${data.id}`);
    } catch {
      setError("Chyba připojení");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Přidat novou službu</h1>
          <p className="page-subtitle">
            Vyplň, co platíš. Bude to tady pěkně přehledné. Slib! 🤙
          </p>
        </div>
        <Link href="/dashboard/services" className="btn btn-secondary">
          ← Zpět
        </Link>
      </div>

      {/* Quick fill */}
      <div className="card mb-6">
        <div className="card-header">
          <h3>⚡ Rychlé vyplnění</h3>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POPULAR_SERVICES.map((svc) => (
              <button
                key={svc.name}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fill({ serviceName: svc.name, providerName: svc.provider, category: svc.category })}
              >
                {svc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>⚠️ {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Základní info */}
          <div className="card">
            <div className="card-header"><h3>📋 Základní informace</h3></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Název služby *</label>
                <input
                  id="service-name"
                  type="text"
                  className="form-input"
                  placeholder="Netflix"
                  value={form.serviceName}
                  onChange={(e) => fill({ serviceName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Poskytovatel *</label>
                <input
                  id="provider-name"
                  type="text"
                  className="form-input"
                  placeholder="Netflix Inc."
                  value={form.providerName}
                  onChange={(e) => fill({ providerName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kategorie</label>
                <select
                  id="category"
                  className="form-select"
                  value={form.category}
                  onChange={(e) => fill({ category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Web / URL</label>
                <input
                  id="website-url"
                  type="url"
                  className="form-input"
                  placeholder="https://netflix.com"
                  value={form.websiteUrl}
                  onChange={(e) => fill({ websiteUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Popis</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  placeholder="Krátký popis služby..."
                  value={form.description}
                  onChange={(e) => fill({ description: e.target.value })}
                  style={{ minHeight: 80 }}
                />
              </div>
            </div>
          </div>

          {/* Cena a billing */}
          <div className="card">
            <div className="card-header"><h3>💰 Cena a fakturace</h3></div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Cena *</label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="249"
                    value={form.periodicPrice}
                    onChange={(e) => fill({ periodicPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Měna</label>
                  <select
                    id="currency"
                    className="form-select"
                    value={form.currency}
                    onChange={(e) => fill({ currency: e.target.value })}
                  >
                    <option value="CZK">CZK</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fakturační perioda</label>
                <select
                  id="billing-cycle"
                  className="form-select"
                  value={form.billingCycle}
                  onChange={(e) => fill({ billingCycle: e.target.value })}
                >
                  <option value="WEEKLY">Týdně</option>
                  <option value="MONTHLY">Měsíčně</option>
                  <option value="QUARTERLY">Čtvrtletně</option>
                  <option value="YEARLY">Ročně</option>
                  <option value="CUSTOM">Vlastní</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Datum příští obnovy</label>
                <input
                  id="renewal-date"
                  type="date"
                  className="form-input"
                  value={form.renewalDate}
                  onChange={(e) => fill({ renewalDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Interní poznámka</label>
                <textarea
                  id="internal-note"
                  className="form-textarea"
                  placeholder="Jen pro tebe – co potřebuješ vědět..."
                  value={form.internalNote}
                  onChange={(e) => fill({ internalNote: e.target.value })}
                  style={{ minHeight: 80 }}
                />
              </div>
            </div>
          </div>

          {/* Nastavení sdílení */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header"><h3>🤝 Nastavení sdílení</h3></div>
            <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Stav sdílení</label>
                <select
                  id="sharing-status"
                  className="form-select"
                  value={form.sharingStatus}
                  onChange={(e) => fill({ sharingStatus: e.target.value })}
                >
                  <option value="SHARING_DISABLED">Nesdílím</option>
                  <option value="SHARING_ENABLED">Platím a chci sdílet</option>
                  <option value="SHARING_PAUSED">Sdílení pozastaveno</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Viditelnost</label>
                <select
                  id="sharing-visibility"
                  className="form-select"
                  value={form.sharingVisibility}
                  onChange={(e) => fill({ sharingVisibility: e.target.value })}
                  disabled={form.sharingStatus === "SHARING_DISABLED"}
                >
                  <option value="FRIENDS_ONLY">Jen přátelé</option>
                  <option value="INVITE_ONLY">Jen na pozvání</option>
                  <option value="PUBLIC">Veřejná</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Max. počet míst</label>
                <input
                  id="max-slots"
                  type="number"
                  min="0"
                  max="99"
                  className="form-input"
                  value={form.maxSharedSlots}
                  onChange={(e) => fill({ maxSharedSlots: e.target.value })}
                  disabled={form.sharingStatus === "SHARING_DISABLED"}
                />
                <span className="form-hint">0 = neomezeno</span>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Podmínky sdílení a právní poznámka</label>
                <textarea
                  id="legal-note"
                  className="form-textarea"
                  placeholder="Upozornění: Tato služba sdílení omezuje / povoluje. Uživatel zodpovídá za soulad s podmínkami..."
                  value={form.legalNote}
                  onChange={(e) => fill({ legalNote: e.target.value })}
                  style={{ minHeight: 70 }}
                />
                <span className="form-hint">
                  ℹ️ Zobrazt jen oprávněným uživatelům – připomenutí odpovědnosti
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24, paddingBottom: 40 }}>
          <Link href="/dashboard/services" className="btn btn-secondary">
            Zrušit
          </Link>
          <button
            id="save-service-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Ukládám...
              </>
            ) : (
              "Uložit službu ✓"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
