"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  serviceName: string;
  providerName: string;
  category: string | null;
  description: string | null;
  periodicPrice: number;
  currency: string;
  billingCycle: string;
  sharingStatus: string;
  maxSharedSlots: number;
  status: string;
  ownerId: string;
  owner: { name: string; email: string };
  credentials: any[];
  accessGrants: any[];
  accessRequests: any[];
  isOwner: boolean;
  pricingType: "PAID" | "AFFILIATE" | "INCLUDED" | "FREE";
  pricingDetails: string | null;
  renewalDate: string | null;
  startDate: string | null;
  _count: { accessGrants: number };
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Credentials handling
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<Record<string, boolean>>({});
  
  // Settlement modal
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    periodFrom: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    periodTo: new Date().toISOString().split("T")[0],
    calculationModel: "EQUAL_SPLIT",
  });

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    serviceName: "",
    providerName: "",
    periodicPrice: 0,
    currency: "CZK",
    billingCycle: "MONTHLY",
    description: "",
    category: "",
    maxSharedSlots: 0,
    renewalDate: "",
    pricingType: "PAID" as "PAID" | "AFFILIATE" | "INCLUDED" | "FREE",
    pricingDetails: "",
    startDate: "",
  });
  const [priceInput, setPriceInput] = useState("");
  const [slotsInput, setSlotsInput] = useState("");

  const [savingEdit, setSavingEdit] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/services/${id}`);
      if (!res.ok) {
        setError("Služba nenalezena nebo nemáte přístup.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setService(data);
      // Fill edit form
      setEditForm({
        serviceName: data.serviceName,
        providerName: data.providerName,
        periodicPrice: data.periodicPrice,
        currency: data.currency,
        billingCycle: data.billingCycle,
        description: data.description || "",
        category: data.category || "",
        maxSharedSlots: data.maxSharedSlots,
        renewalDate: data.renewalDate ? data.renewalDate.split("T")[0] : "",
        pricingType: data.pricingType,
        pricingDetails: data.pricingDetails || "",
        startDate: data.startDate ? data.startDate.split("T")[0] : "",
      });
      setPriceInput(data.periodicPrice.toString());
      setSlotsInput(data.maxSharedSlots.toString());
    } catch {
      setError("Chyba při načítání.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  }

  async function handleUpdateService() {
    setSavingEdit(true);
    try {
      const price = parseFloat(priceInput.replace(",", "."));
      const slots = parseInt(slotsInput);

      const cleanForm = {
        ...editForm,
        periodicPrice: isNaN(price) ? 0 : price,
        maxSharedSlots: isNaN(slots) ? 0 : slots,
        renewalDate: editForm.renewalDate || null,
      };

      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanForm),
      });
      if (res.ok) {
        setShowEditModal(false);
        await load();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Update failed:", errData);
        alert(`Chyba při ukládání: ${errData.error || "Neznámá chyba"}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Nepodařilo se spojit se serverem.");
    } finally {
      setSavingEdit(false);
    }
  }

  useEffect(() => { 
    load(); 
    loadCategories();
  }, [id]);

  async function reveal(cid: string) {
    setRevealing(prev => ({ ...prev, [cid]: true }));
    try {
      const res = await fetch(`/api/services/${id}/credentials/decrypt?cid=${cid}`);
      const data = await res.json();
      if (data.value) {
        setRevealed(prev => ({ ...prev, [cid]: data.value }));
      }
    } finally {
      setRevealing(prev => ({ ...prev, [cid]: false }));
    }
  }

  async function handleCreateSettlement() {
    const res = await fetch("/api/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settlementForm, serviceId: id }),
    });
    if (res.ok) {
      setShowSettlementModal(false);
      router.push("/dashboard/settlements");
    }
  }

  if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 400 }} /></div>;
  if (error) return <div className="page-content"><div className="alert alert-error">{error}</div></div>;
  if (!service) return null;

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="user-avatar" style={{ width: 56, height: 56, fontSize: "1.5rem", borderRadius: "var(--radius-lg)" }}>
            {service.serviceName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="page-title">{service.serviceName}</h1>
            <p className="page-subtitle">{service.providerName} • {service.category || "Bez kategorie"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {service.isOwner && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowEditModal(true)}
            >
              ⚙️ Editovat službu
            </button>
          )}
          <Link href="/dashboard/services" className="btn btn-ghost btn-sm">← Zpět</Link>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Main Info Card */}
          <div className="card">
            <div className="card-header"><h3>ℹ️ Informace o službě</h3></div>
            <div className="card-body">
              <div className="grid-2" style={{ gap: 20 }}>
                <div>
                  <label className="text-muted text-xs block mb-1">CENA / DEAL</label>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                    {service.pricingType === "PAID" ? (
                      <>
                        {Number(service.periodicPrice).toFixed(2)} {service.currency}
                        <span style={{ fontSize: "0.9rem", fontWeight: 400, marginLeft: 6 }}>/ {service.billingCycle}</span>
                      </>
                    ) : (
                      <span className="text-brand-600">
                        {service.pricingType === "AFFILIATE" ? "💎 Affiliate / Deal" : 
                         service.pricingType === "INCLUDED" ? "🎁 V balíčku" : "✨ Zdarma"}
                      </span>
                    )}
                  </div>
                  {service.pricingDetails && (
                    <div className="text-xs text-muted mt-1">{service.pricingDetails}</div>
                  )}
                </div>
                <div>
                  <label className="text-muted text-xs block mb-1">STAV SDÍLENÍ</label>
                  <div>
                    {service.sharingStatus === "SHARING_ENABLED" ? (
                      <span className="badge badge-green">Veřejně sdíleno</span>
                    ) : (
                      <span className="badge badge-gray">Soukromé</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-muted text-xs block mb-1">AKTIVNÍ OD</label>
                  <div className="font-medium">
                    {service.startDate ? new Date(service.startDate).toLocaleDateString() : <span className="text-muted italic">neuvedeno</span>}
                  </div>
                </div>
                <div>
                  <label className="text-muted text-xs block mb-1">DALŠÍ OBNOVA</label>
                  <div className="font-medium">
                    {service.renewalDate ? new Date(service.renewalDate).toLocaleDateString() : <span className="text-muted italic">neuvedeno</span>}
                  </div>
                </div>
              </div>
              {service.description && (
                <div className="mt-6 p-4 bg-elevated rounded-md border border-subtle">
                  <p className="text-sm">{service.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Credentials Card */}
          <div className="card">
            <div className="card-header">
              <h3>🔐 Přihlašovací údaje</h3>
              {service.isOwner && (
                <button className="btn btn-ghost btn-sm">＋ Přidat</button>
              )}
            </div>
            <div className="card-body">
              {service.credentials.length === 0 ? (
                <p className="text-muted text-sm italic">Žádné uložené údaje.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {service.credentials.map((c: any) => (
                    <div key={c.id} className="p-4 rounded-lg border border-subtle bg-elevated flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted uppercase tracking-wider font-bold mb-1">{c.label || c.secretType}</div>
                        <div className="font-mono text-sm">
                          {revealed[c.id] ? (
                            <span className="text-primary">{revealed[c.id]}</span>
                          ) : (
                            <span className="text-muted">••••••••••••••</span>
                          )}
                        </div>
                      </div>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => revealed[c.id] ? setRevealed(prev => { const n = {...prev}; delete n[c.id]; return n; }) : reveal(c.id)}
                        disabled={revealing[c.id]}
                      >
                        {revealing[c.id] ? "Načítám..." : revealed[c.id] ? "Skrýt" : "Zobrazit"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Access Grants */}
          <div className="card">
            <div className="card-header">
              <h3>👥 Kdo má přístup</h3>
              <span className="badge badge-purple">{service._count.accessGrants} / {service.maxSharedSlots || "∞"}</span>
            </div>
            <div className="card-body">
              {service.accessGrants.length === 0 ? (
                <p className="text-muted text-sm">Zatím nikdo. Sdílej radost!</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Uživatel</th>
                        <th>Od</th>
                        <th>Model platby</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {service.accessGrants.map((g: any) => (
                        <tr key={g.id}>
                          <td>
                            <div className="font-bold">{g.grantee.name}</div>
                            <div className="text-xs text-muted">{g.grantee.email}</div>
                          </td>
                          <td className="text-sm">{new Date(g.startsAt).toLocaleDateString()}</td>
                          <td><span className="badge badge-gray">{g.pricingModel}</span></td>
                          <td>
                            {service.isOwner && <button className="btn btn-ghost btn-sm text-danger">Odebrat</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Owner Box */}
          <div className="card">
            <div className="card-header"><h3>👤 Vlastník</h3></div>
            <div className="card-body flex items-center gap-4">
              <div className="user-avatar">{service.owner.name[0]}</div>
              <div>
                <div className="font-bold">{service.owner.name}</div>
                <div className="text-xs text-muted">{service.owner.email}</div>
              </div>
            </div>
          </div>

          {/* Actions Box */}
          {service.isOwner && (
            <div className="card">
              <div className="card-header"><h3>⚡ Akce</h3></div>
              <div className="card-body flex flex-col gap-3">
                <button 
                  className="btn btn-primary w-full"
                  onClick={() => setShowSettlementModal(true)}
                >
                  💰 Vygenerovat vyúčtování
                </button>
                <button className="btn btn-secondary w-full">🔄 Synchronizovat platbu</button>
                <hr className="border-subtle my-2" />
                <button className="btn btn-danger w-full outline">⚠️ Archivovat službu</button>
              </div>
            </div>
          )}

          {/* Access Requests */}
          {service.isOwner && service.accessRequests.length > 0 && (
            <div className="card border-warning">
              <div className="card-header bg-warning-low">
                <h3 className="text-warning-800">📩 Žádosti o přístup</h3>
              </div>
              <div className="card-body flex flex-col gap-4">
                {service.accessRequests.map((r: any) => (
                  <div key={r.id} className="p-3 border border-warning rounded-md bg-warning-50">
                    <div className="font-bold text-sm">{r.requester.name}</div>
                    <div className="text-xs mb-2">{r.message}</div>
                    <Link href="/dashboard/requests" className="btn btn-warning btn-sm w-full">Vyřídit</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settlement Modal (stays as is) */}
      {showSettlementModal && (
        <div className="modal-overlay" onClick={() => setShowSettlementModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Nové vyúčtování</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowSettlementModal(false)}>✕</button>
            </div>
            <div className="modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Od</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={settlementForm.periodFrom}
                  onChange={e => setSettlementForm({...settlementForm, periodFrom: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Do</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={settlementForm.periodTo}
                  onChange={e => setSettlementForm({...settlementForm, periodTo: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Model výpočtu</label>
                <select 
                  className="form-select"
                  value={settlementForm.calculationModel}
                  onChange={e => setSettlementForm({...settlementForm, calculationModel: e.target.value})}
                >
                  <option value="EQUAL_SPLIT">Rovným dílem</option>
                  <option value="BY_DAYS">Dle počtu dní</option>
                  <option value="FIXED">Fixní částka</option>
                </select>
              </div>
              <p className="text-xs text-muted">
                Toto vytvoří platební předpisy pro všechny uživatele, kteří měli v tomto období k službě přístup.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSettlementModal(false)}>Zrušit</button>
              <button className="btn btn-primary" onClick={handleCreateSettlement}>Vytvořit vyúčtování</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
        >
          <div className="modal" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>⚙️ Editovat informace o službě</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Název služby</label>
                  <input 
                    className="form-input"
                    value={editForm.serviceName}
                    onChange={e => setEditForm({...editForm, serviceName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Poskytovatel</label>
                  <input 
                    className="form-input"
                    value={editForm.providerName}
                    onChange={e => setEditForm({...editForm, providerName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cena</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={priceInput}
                    onChange={e => {
                      let val = e.target.value;
                      // Remove leading zero if typing more numbers
                      if (val.length > 1 && val.startsWith("0") && val[1] !== "." && val[1] !== ",") {
                        val = val.substring(1);
                      }
                      setPriceInput(val);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Měna</label>
                  <select 
                    className="form-select"
                    value={editForm.currency}
                    onChange={e => setEditForm({...editForm, currency: e.target.value})}
                  >
                    <option value="CZK">CZK</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Frekvence platby</label>
                  <select 
                    className="form-select"
                    value={editForm.billingCycle}
                    onChange={e => setEditForm({...editForm, billingCycle: e.target.value})}
                  >
                    <option value="MONTHLY">Měsíčně</option>
                    <option value="YEARLY">Ročně</option>
                    <option value="QUARTERLY">Čtvrtletně</option>
                    <option value="WEEKLY">Týdně</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Datum obnovy</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={editForm.renewalDate}
                    onChange={e => setEditForm({...editForm, renewalDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Datum začátku</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={editForm.startDate}
                    onChange={e => setEditForm({...editForm, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sdílené sloty (počet)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={slotsInput}
                    onChange={e => setSlotsInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategorie</label>
                  <select 
                    className="form-select"
                    value={editForm.category}
                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                  >
                    <option value="">-- Vyber --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Type toggle in Edit */}
              <div className="form-group mt-4">
                <label className="form-label">Typ platby</label>
                <div className="flex gap-2">
                  {[
                    { id: "PAID", label: "Placené" },
                    { id: "AFFILIATE", label: "Affiliate" },
                    { id: "INCLUDED", label: "V balíčku" },
                    { id: "FREE", label: "Zdarma" }
                  ].map(t => (
                    <button 
                      key={t.id}
                      type="button"
                      onClick={() => setEditForm({...editForm, pricingType: t.id as any})}
                      className={`btn btn-sm ${editForm.pricingType === t.id ? 'btn-secondary' : 'btn-ghost'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {editForm.pricingType !== "PAID" && (
                <div className="form-group mt-4">
                  <label className="form-label">Detaily k dealu</label>
                  <input 
                    className="form-input"
                    placeholder="Např. V ceně Revolut Ultra"
                    value={editForm.pricingDetails}
                    onChange={e => setEditForm({...editForm, pricingDetails: e.target.value})}
                  />
                </div>
              )}
              <div className="form-group mt-4">
                <label className="form-label">Popis / poznámka k platbě</label>
                <textarea 
                  className="form-input"
                  style={{ minHeight: 80 }}
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Např. jak se dělí platba, nebo co je v ceně..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Zrušit</button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpdateService}
                disabled={savingEdit}
              >
                {savingEdit ? "Ukládám..." : "Uložit změny"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
