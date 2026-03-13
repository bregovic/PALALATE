"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";


// Removed hardcoded popular services, fetching from Registry instead

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [registry, setRegistry] = useState<any[]>([]);
  const [userServices, setUserServices] = useState<any[]>([]);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const [showDuplicatePrompt, setShowDuplicatePrompt] = useState(false);
  const [matchedRegistryItem, setMatchedRegistryItem] = useState<any>(null);
  const [nextSuggestedName, setNextSuggestedName] = useState("");
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  useState(() => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()),
      fetch("/api/service-registry").then(r => r.json()),
      fetch("/api/services").then(r => r.json())
    ]).then(([cats, reg, svcs]) => {
      setCategories(cats);
      setRegistry(reg);
      setUserServices(Array.isArray(svcs) ? svcs : []);
    }).catch(console.error);
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
    startDate: "",
    allowConcurrentUse: true,
    requiresBookingApproval: false,
  });

  function fill(data: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...data }));
  }

  function fillFromRegistry(svc: any) {
    setForm((prev) => ({
      ...prev,
      serviceName: svc.name,
      providerName: svc.name, // Usually the same for quick fill
      category: svc.category || "other",
      periodicPrice: svc.defaultPrice ? svc.defaultPrice.toString() : "",
      currency: svc.currency || "CZK",
      billingCycle: svc.billingCycle || "MONTHLY",
      description: svc.description || "",
      allowConcurrentUse: svc.allowConcurrentUse ?? true,
      requiresBookingApproval: svc.requiresBookingApproval ?? false,
    }));
  }

  function getNextServiceName(name: string, services: any[]) {
    let finalName = name;
    let counter = 2;
    // Simple check: if "Name" exists, try "Name 2", "Name 3"...
    while (services.some(s => s.serviceName.toLowerCase() === finalName.toLowerCase())) {
      finalName = `${name} ${counter}`;
      counter++;
    }
    return finalName;
  }

  async function handleDuplicateConfirm() {
    setConfirmedDuplicate(true);
    const finalName = nextSuggestedName;
    setForm(prev => ({ ...prev, serviceName: finalName }));
    setShowDuplicatePrompt(false);
    
    // Auto-submit with the new name
    await performSubmit({ ...form, serviceName: finalName });
  }

  async function handleSyncWithRegistry() {
    if (!matchedRegistryItem) return;
    try {
       await fetch(`/api/service-registry`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           ...matchedRegistryItem,
           defaultPrice: parseFloat(form.periodicPrice),
           billingCycle: form.billingCycle,
           currency: form.currency
         })
       });
       setShowSyncPrompt(false);
       alert("Služba v číselníku byla aktualizována. Díky! ⚡");
    } catch (e) {
       console.error(e);
    }
  }

  async function performSubmit(formData: any) {
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodařilo se přidat službu");
        setLoading(false);
        return;
      }

      // Check for sync potential
      const matchingRegistry = registry.find(r => r.name.toLowerCase() === formData.serviceName.toLowerCase());
      if (matchingRegistry && (
          parseFloat(matchingRegistry.defaultPrice) !== parseFloat(formData.periodicPrice) || 
          matchingRegistry.billingCycle !== formData.billingCycle
      )) {
          setMatchedRegistryItem(matchingRegistry);
          setShowSyncPrompt(true);
          setTimeout(() => {
            if (!showSyncPrompt) router.push(`/dashboard/services/${data.id}`);
          }, 3000);
      } else {
          router.push(`/dashboard/services/${data.id}`);
      }
    } catch {
      setError("Chyba připojení");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Check for duplicate name
    const existing = userServices.find(s => s.serviceName.toLowerCase() === form.serviceName.toLowerCase());
    if (existing && !confirmedDuplicate) {
        const next = getNextServiceName(form.serviceName, userServices);
        setNextSuggestedName(next);
        setShowDuplicatePrompt(true);
        return;
    }

    await performSubmit(form);
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
        <div className="card-header flex justify-between items-center">
          <h3>⚡ Rychlé vyplnění</h3>
          <input 
            className="form-input w-48 btn-sm" 
            placeholder="Hledat v číselníku..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="card-body">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {registry
              .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .slice(0, 15)
              .map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fillFromRegistry(svc)}
                >
                  {svc.name}
                </button>
              ))}
            {registry.length === 0 && <span className="text-muted text-xs">Načítám číselník...</span>}
            {registry.length > 0 && registry.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <span className="text-muted text-xs italic">Žádná shoda v systému.</span>
            )}
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
                  <option value="SEMI_ANNUALLY">Půlročně</option>
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
                <label className="form-label">Datum začátku předplatného</label>
                <input
                  id="start-date"
                  type="date"
                  className="form-input"
                  value={form.startDate}
                  onChange={(e) => fill({ startDate: e.target.value })}
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

          {/* Nastavení sdílení a kapacity */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header"><h3>🤝 Nastavení sdílení a kapacity</h3></div>
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
                <div className="flex gap-8 p-4 bg-muted rounded-lg border border-subtle">
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" className="form-checkbox" checked={form.allowConcurrentUse} onChange={e => fill({ allowConcurrentUse: e.target.checked })} />
                     <div>
                       <span className="font-bold block">Povolit souběžné používání</span>
                       <span className="text-xs text-muted">Lze používat službu více lidmi najednou? (Např. Netflix ano, herní účet ne)</span>
                     </div>
                   </label>
                   {!form.allowConcurrentUse && (
                      <label className="flex items-center gap-3 cursor-pointer p-2 bg-white rounded border border-primary animate-fade-in">
                        <input type="checkbox" className="form-checkbox" checked={form.requiresBookingApproval} onChange={e => fill({ requiresBookingApproval: e.target.checked })} />
                        <div>
                          <span className="font-bold block text-sm text-primary">Vyžadovat schválení termínu</span>
                          <span className="text-xs text-muted">Uživatelé si musí rezervovat čas v kalendáři a vy ho schválíte.</span>
                        </div>
                      </label>
                   )}
                </div>
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

      {/* Registry Sync Prompt */}
      {showSyncPrompt && matchedRegistryItem && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>💡 Aktualizovat číselník?</h3>
            </div>
            <div className="modal-body">
              <p className="text-sm mb-4">
                Zadal jsi jinou cenu nebo frekvenci u služby <strong>{form.serviceName}</strong>, než máme v našem globálním číselníku. 
              </p>
              <div className="p-4 bg-muted rounded-lg border border-subtle mb-4">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>Původní (číselník):</span>
                  <span>{Number(matchedRegistryItem.defaultPrice).toFixed(2)} {matchedRegistryItem.currency} / {matchedRegistryItem.billingCycle}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-primary">
                  <span>Tvoje hodnota:</span>
                  <span>{form.periodicPrice} {form.currency} / {form.billingCycle}</span>
                </div>
              </div>
              <p className="text-xs text-muted">
                Pomůžeš ostatním uživatelům tím, že budeme mít v systému aktuální data?
              </p>
            </div>
            <div className="modal-footer flex gap-3">
              <button className="btn btn-secondary w-full" onClick={() => router.push(`/dashboard/services`)}>Ne, díky</button>
              <button className="btn btn-primary w-full" onClick={handleSyncWithRegistry}>Ano, aktualizovat ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Name Prompt */}
      {showDuplicatePrompt && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>⚠️ Služba již existuje</h3>
            </div>
            <div className="modal-body text-sm">
              Službu <strong>{form.serviceName}</strong> už ve svém seznamu máš. 
              Chceš ji přidat znovu jako další konto pod názvem <strong>{nextSuggestedName}</strong>?
            </div>
            <div className="modal-footer flex gap-3">
              <button className="btn btn-ghost w-full" onClick={() => setShowDuplicatePrompt(false)}>Zrušit</button>
              <button className="btn btn-primary w-full" onClick={handleDuplicateConfirm}>Ano, přidat jako {nextSuggestedName}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
