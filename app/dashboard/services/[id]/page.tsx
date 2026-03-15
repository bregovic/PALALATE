"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AvatarEditor from "@/components/common/AvatarEditor";

interface PriceInterval {
  id?: string;
  startDate: string;
  endDate: string | null;
  price: number;
}

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
  usageMode: "PRIVATE" | "SHARED_ROTATION" | "SHARED" | "LICENSE";
  requiresBookingApproval: boolean;
  isTerminated: boolean;
  url: string | null;
  iconUrl: string | null;
  priceIntervals: PriceInterval[];
  manualSlots: any[];
  _count: { accessGrants: number; manualSlots: number };
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [revealed, setRevealed] = useState<Record<string, any>>({});
  const [revealing, setRevealing] = useState<Record<string, boolean>>({});
  const [showAddCredentialModal, setShowAddCredentialModal] = useState(false);
  const [credForm, setCredForm] = useState({
    type: "EMAIL_PASSWORD",
    label: "",
    login: "",
    password: "",
    visibility: "OWNER_ONLY" as "OWNER_ONLY" | "GRANTED_USERS",
  });
  const [savingCred, setSavingCred] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Settlement modal
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    periodFrom: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    periodTo: new Date().toISOString().split("T")[0],
    calculationModel: "EQUAL_SPLIT",
  });

  // Bookings handling
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    note: "",
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
    usageMode: "PRIVATE" as "PRIVATE" | "SHARED_ROTATION" | "SHARED" | "LICENSE",
    requiresBookingApproval: false,
    isTerminated: false,
    url: "",
    iconUrl: "",
    priceIntervals: [] as PriceInterval[],
  });
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [slotsInput, setSlotsInput] = useState("");

  const [savingEdit, setSavingEdit] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Manual slots
  const [showAddManualSlotModal, setShowAddManualSlotModal] = useState(false);
  const [slotType, setSlotType] = useState<"MANUAL" | "SYSTEM">("MANUAL");
  const [manualSlotForm, setManualSlotForm] = useState({ name: "", note: "", userId: "" });
  const [savingManualSlot, setSavingManualSlot] = useState(false);
  const [friendships, setFriendships] = useState<any[]>([]);

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
        usageMode: data.usageMode ?? "PRIVATE",
        requiresBookingApproval: data.requiresBookingApproval ?? false,
        isTerminated: data.isTerminated ?? false,
        url: data.url || "",
        iconUrl: data.iconUrl || "",
        priceIntervals: (data.priceIntervals || []).map((pi: any) => ({
          ...pi,
          startDate: pi.startDate ? pi.startDate.split("T")[0] : "",
          endDate: pi.endDate ? pi.endDate.split("T")[0] : null,
        })),
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

  async function handleAddCredential() {
    setSavingCred(true);
    try {
      const res = await fetch(`/api/services/${id}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretType: credForm.type,
          label: credForm.label,
          visibilityRule: credForm.visibility,
          payload: { 
            login: credForm.login, 
            password: credForm.password,
            value: credForm.password // fallback for existing reveal logic
          }
        }),
      });
      if (res.ok) {
        setShowAddCredentialModal(false);
        setCredForm({ type: "EMAIL_PASSWORD", label: "", login: "", password: "", visibility: "OWNER_ONLY" });
        setShowPassword(false);
        load();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Chyba: ${errData.error || "Server vrátil 500"}`);
      }
    } finally {
      setSavingCred(false);
    }
  }

  const addPriceInterval = () => {
    setEditForm(prev => ({
      ...prev,
      priceIntervals: [
        ...prev.priceIntervals,
        { startDate: new Date().toISOString().split('T')[0], endDate: null, price: 0 }
      ]
    }));
  };

  const removePriceInterval = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      priceIntervals: prev.priceIntervals.filter((_, i) => i !== index)
    }));
  };

  const updatePriceInterval = (index: number, data: Partial<PriceInterval>) => {
    setEditForm(prev => ({
      ...prev,
      priceIntervals: prev.priceIntervals.map((pi, i) => i === index ? { ...pi, ...data } : pi)
    }));
  };

  async function handleUpdateService() {
    setSavingEdit(true);
    try {
      const price = parseFloat(priceInput.replace(",", "."));
      const slots = parseInt(slotsInput);

      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          periodicPrice: isNaN(price) ? 0 : price,
          maxSharedSlots: isNaN(slots) ? 0 : slots,
          renewalDate: editForm.renewalDate || null,
          priceIntervals: editForm.priceIntervals.map(pi => ({
            ...pi,
            endDate: pi.endDate || null,
            price: Number(pi.price)
          }))
        }),
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

  const getCurrentPrice = () => {
    if (!service?.priceIntervals?.length) return service?.periodicPrice || 0;
    const now = new Date();
    const sorted = [...service.priceIntervals].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const current = sorted.find(pi => new Date(pi.startDate) <= now);
    return current ? current.price : (sorted[sorted.length-1].price);
  };

  const fetchBookings = async () => {
    setBookingLoading(true);
    try {
      const res = await fetch(`/api/services/${id}/bookings`);
      if (res.ok) setBookings(await res.json());
    } finally {
      setBookingLoading(false);
    }
  };

  const loadFriendships = async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setFriendships(data.filter((f: any) => f.status === "ACCEPTED"));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    load(); 
    loadCategories();
    loadFriendships();
  }, [id]);

  useEffect(() => {
    if (service && service.usageMode === "SHARED_ROTATION") {
      fetchBookings();
    }
  }, [service?.usageMode]);

  async function reveal(cid: string) {
    setRevealing(prev => ({ ...prev, [cid]: true }));
    try {
      const res = await fetch(`/api/services/${id}/credentials/decrypt?cid=${cid}`);
      const data = await res.json();
      if (data.value || data.login || data.password) {
        setRevealed(prev => ({ ...prev, [cid]: data }));
      } else if (data.value === undefined && typeof data === 'object') {
          // If the API returned the object directly or in a way we expected
          setRevealed(prev => ({ ...prev, [cid]: data }));
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

  async function handleUpdateBookingStatus(bookingId: string, status: string) {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchBookings();
  }

  async function handleCreateBooking() {
    const res = await fetch(`/api/services/${id}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingForm),
    });
    if (res.ok) {
      setShowBookingModal(false);
      fetchBookings();
    } else {
      const err = await res.json();
      alert(err.error || "Chyba při rezervaci");
    }
  }

  async function handleSaveManualSlot() {
    setSavingManualSlot(true);
    try {
      if (slotType === "SYSTEM") {
        const res = await fetch(`/api/services/${id}/access-grants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            granteeId: manualSlotForm.userId,
            startsAt: new Date().toISOString(),
          }),
        });
        if (res.ok) {
          setShowAddManualSlotModal(false);
          setManualSlotForm({ name: "", note: "", userId: "" });
          load();
        } else {
           const err = await res.json();
           alert(err.error || "Chyba při propojování uživatele");
        }
      } else {
        const res = await fetch(`/api/services/${id}/manual-slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(manualSlotForm),
        });
        if (res.ok) {
          setShowAddManualSlotModal(false);
          setManualSlotForm({ name: "", note: "", userId: "" });
          load();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingManualSlot(false);
    }
  }

  async function handleDeleteManualSlot(slotId: string) {
    if (!confirm("Opravdu chcete odstranit toto obsazené místo?")) return;
    try {
      const res = await fetch(`/api/services/${id}/manual-slots?slotId=${slotId}`, {
        method: "DELETE",
      });
      if (res.ok) load();
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 400 }} /></div>;
  if (error) return <div className="page-content"><div className="alert alert-error">{error}</div></div>;
  if (!service) return null;

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div 
            className="user-avatar group relative cursor-pointer" 
            style={{ width: 64, height: 64, fontSize: "1.8rem", borderRadius: "var(--radius-lg)", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => service.isOwner && setShowIconEditor(true)}
          >
            {service.iconUrl ? (
              <img src={service.iconUrl} alt={service.serviceName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              service.serviceName.slice(0, 2).toUpperCase()
            )}
            {service.isOwner && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span style={{ fontSize: '0.8rem', color: 'white' }}>✏️</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{service.serviceName}</h1>
              {service.isTerminated && (
                <span className="badge badge-error animate-pulse">UKONČENO</span>
              )}
            </div>
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
          
          {/* Reservations / Calendar Component Area */}
          {service.usageMode === "SHARED_ROTATION" && (
            <div className="card border-amber-200 shadow-sm animate-fade-in">
              <div className="card-header bg-amber-50 flex justify-between items-center">
                <h3 className="text-amber-800">📅 Rezervace a termíny</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowBookingModal(true)}>
                  ＋ Rezervovat čas
                </button>
              </div>
              <div className="card-body">
                {bookingLoading ? (
                  <p className="p-4 text-center">Načítám rezervace...</p>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted italic bg-muted rounded-xl border border-dashed">
                    Žádné aktivní rezervace. Služba je momentálně volná.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {bookings.map((b: any) => (
                      <div key={b.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all hover:shadow-sm ${b.status === 'PENDING' ? 'bg-amber-50 border-amber-200' : 'bg-elevated border-subtle'}`}>
                        <div className="flex items-center gap-4">
                           <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-subtle w-12 h-12 shadow-sm">
                              <span className="text-[10px] font-bold uppercase text-muted">{new Date(b.startDate).toLocaleString('cs', { month: 'short' })}</span>
                              <span className="text-lg font-bold leading-none">{new Date(b.startDate).getDate()}</span>
                           </div>
                           <div>
                              <div className="font-bold flex items-center gap-2">
                                {b.user.name}
                                {b.status === 'PENDING' && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold uppercase">Čeká</span>}
                              </div>
                              <div className="text-xs text-muted">
                                {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                              </div>
                              {b.note && <div className="text-xs italic mt-1 text-muted border-l-2 pl-2 border-subtle">"{b.note}"</div>}
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {service.isOwner && b.status === 'PENDING' && (
                             <div className="flex gap-2">
                               <button className="btn btn-ghost btn-sm text-green-600 font-bold hover:bg-green-50" onClick={() => handleUpdateBookingStatus(b.id, 'APPROVED')}>✓ Schválit</button>
                               <button className="btn btn-ghost btn-sm text-danger hover:bg-red-50" onClick={() => handleUpdateBookingStatus(b.id, 'REJECTED')}>✕ Zamítnout</button>
                             </div>
                           )}
                           {b.status === 'APPROVED' && <span className="text-green-600 font-bold text-sm">✓ Schváleno</span>}
                           {b.status === 'REJECTED' && <span className="text-danger font-bold text-sm text-muted line-through">Zamítnuto</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
                        {Number(getCurrentPrice()).toFixed(2)} {service.currency}
                        <span style={{ fontSize: "0.9rem", fontWeight: 400, marginLeft: 6 }}>/ {service.billingCycle}</span>
                      </>
                    ) : (
                      <span className="text-brand-600">
                        {service.pricingType === "AFFILIATE" ? "💎 Affiliate / Deal" : 
                         service.pricingType === "INCLUDED" ? "🎁 V balíčku" : "✨ Zdarma"}
                      </span>
                    )}
                  </div>
                  {service.priceIntervals && service.priceIntervals.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                       <span className="text-[10px] text-muted font-bold uppercase">Historie cen:</span>
                       {service.priceIntervals.map((pi, idx) => (
                         <div key={idx} className="text-[11px] text-muted flex justify-between border-b border-dashed border-subtle pb-0.5">
                            <span>{new Date(pi.startDate).toLocaleDateString()} {pi.endDate ? `- ${new Date(pi.endDate).toLocaleDateString()}` : '...'}</span>
                            <span className="font-bold">{Number(pi.price).toFixed(2)} {service.currency}</span>
                         </div>
                       ))}
                    </div>
                  )}
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
                  <label className="text-muted text-xs block mb-1">DALŠÍ OBNOVA</label>
                  <div className="font-medium text-primary">
                    {service.renewalDate ? new Date(service.renewalDate).toLocaleDateString() : <span className="text-muted italic">neuvedeno</span>}
                  </div>
                </div>
                <div>
                  <label className="text-muted text-xs block mb-1">AKTIVNÍ OD</label>
                  <div className="font-medium">
                    {service.startDate ? new Date(service.startDate).toLocaleDateString() : <span className="text-muted italic">neuvedeno</span>}
                  </div>
                </div>
                <div>
                  <label className="text-muted text-xs block mb-1">REŽIM POUŽÍVÁNÍ</label>
                  <div className="font-medium">
                    {service.usageMode === "PRIVATE" && <span className="text-muted">🔒 Soukromé</span>}
                    {service.usageMode === "SHARED" && <span className="text-green-600">👥 Sdílené</span>}
                    {service.usageMode === "SHARED_ROTATION" && <span className="text-amber-600">🕒 Sdílené (Střídání)</span>}
                    {service.usageMode === "LICENSE" && <span className="text-blue-600">🔑 Licence</span>}
                  </div>
                </div>
                {service.url && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="text-muted text-xs block mb-1">PŘÍSTUP / URL</label>
                    <a 
                      href={service.url.startsWith('http') ? service.url : `https://${service.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-600 font-bold hover:underline break-all"
                    >
                      🔗 {service.url}
                    </a>
                  </div>
                )}
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
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCredentialModal(true)}>＋ Přidat</button>
              )}
            </div>
            <div className="card-body">
              {(service.credentials || []).length === 0 ? (
                <p className="text-muted text-sm italic">Žádné uložené údaje.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(service.credentials || []).map((c: any) => (
                    <div key={c.id} className="p-4 rounded-lg border border-subtle bg-elevated flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted uppercase tracking-wider font-bold mb-1">{c.label || c.secretType}</div>
                        <div className="font-mono text-sm">
                          {revealed[c.id] ? (
                            <div className="flex flex-col gap-1">
                               {revealed[c.id].login && <div><span className="text-muted text-[10px] uppercase">Login:</span> {revealed[c.id].login}</div>}
                               {revealed[c.id].password && <div><span className="text-muted text-[10px] uppercase">Pass:</span> {revealed[c.id].password}</div>}
                               {!revealed[c.id].login && !revealed[c.id].password && <span>{revealed[c.id].value}</span>}
                            </div>
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
              {service.isOwner && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddManualSlotModal(true)}>＋ Ručně obsadit</button>
              )}
            </div>
            <div className="card-body">
              <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
                 <div className="flex flex-col items-center p-3 bg-muted rounded-xl border border-subtle min-w-[80px]">
                    <span className="text-[10px] font-bold uppercase text-muted">Celkem</span>
                    <span className="text-lg font-bold">{service.maxSharedSlots || '∞'}</span>
                 </div>
                 <div className="flex flex-col items-center p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 min-w-[80px]">
                    <span className="text-[10px] font-bold uppercase">Obsazeno</span>
                    <span className="text-lg font-bold">{service._count.accessGrants + (service.manualSlots?.length || 0)}</span>
                 </div>
                 <div className="flex flex-col items-center p-3 bg-green-50 text-green-700 rounded-xl border border-green-100 min-w-[80px]">
                    <span className="text-[10px] font-bold uppercase">Volno</span>
                    <span className="text-lg font-bold">
                      {service.maxSharedSlots ? (service.maxSharedSlots - (service._count.accessGrants + (service.manualSlots?.length || 0))) : '∞'}
                    </span>
                 </div>
              </div>

              {(service.accessGrants.length === 0 && (!service.manualSlots || service.manualSlots.length === 0)) ? (
                <p className="text-muted text-sm italic">Zatím nikdo. Sdílej radost!</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Uživatel / Příjemce</th>
                        <th>Typ / Od</th>
                        <th>Model / Poznámka</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* System users */}
                      {service.accessGrants.map((g: any) => (
                        <tr key={g.id}>
                          <td>
                            <div className="font-bold flex items-center gap-2">
                              {g.grantee.name}
                              <span className="text-[9px] bg-blue-100 text-blue-600 px-1 rounded uppercase font-bold">Systém</span>
                            </div>
                            <div className="text-xs text-muted">{g.grantee.email}</div>
                          </td>
                          <td className="text-sm">{new Date(g.startsAt).toLocaleDateString()}</td>
                          <td><span className="badge badge-gray">{g.pricingModel}</span></td>
                          <td>
                            {service.isOwner && <button className="btn btn-ghost btn-sm text-danger opacity-50 cursor-not-allowed" title="Zatím nelze odebrat systémové uživatele odsud">Odebrat</button>}
                          </td>
                        </tr>
                      ))}
                      {/* Manual slots */}
                      {service.manualSlots?.map((slot: any) => (
                        <tr key={slot.id}>
                          <td>
                            <div className="font-bold flex items-center gap-2">
                              {slot.name}
                              <span className="text-[9px] bg-amber-100 text-amber-600 px-1 rounded uppercase font-bold">Manuální</span>
                            </div>
                          </td>
                          <td className="text-sm italic text-muted">Vnější slot</td>
                          <td className="text-xs text-muted">{slot.note || "—"}</td>
                          <td>
                            {service.isOwner && (
                              <button 
                                className="btn btn-ghost btn-sm text-danger" 
                                onClick={() => handleDeleteManualSlot(slot.id)}
                              >
                                Odebrat
                              </button>
                            )}
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
          
          {service.usageMode === "SHARED_ROTATION" && (
             <div className="card shadow-md border-amber-200 bg-amber-50 animate-fade-in">
               <div className="card-header border-amber-200" style={{ background: "rgba(251, 191, 36, 0.1)" }}>
                 <h3 className="text-amber-800">🕒 Sdílené (Střídání)</h3>
               </div>
               <div className="card-body text-sm text-amber-700">
                  Tato služba vyžaduje plánování přístupu (rezervace).
                  {service.requiresBookingApproval ? " Všechny rezervace musí schválit vlastník." : " Rezervace jsou automaticky potvrzeny."}
                  <button className="btn btn-primary w-full mt-4" onClick={() => alert("Kalendář bude brzy implementován! Prozatím se domluvte v chatu.")}>
                    📅 Otevřít kalendář
                  </button>
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
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowSettlementModal(false);
          }}
        >
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
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
                    <option value="QUARTERLY">Čtvrtletně</option>
                    <option value="SEMI_ANNUALLY">Půlročně</option>
                    <option value="YEARLY">Ročně</option>
                    <option value="WEEKLY">Týdně</option>
                    <option value="ONEOFF">Jednorázově</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <div className="flex flex-col gap-3 p-3 bg-muted rounded-lg border border-subtle">
                     <label className="text-xs font-bold uppercase text-muted">Režim používání / Sdílení</label>
                     <div className="flex gap-4 items-center">
                       <select 
                         className="form-select text-sm flex-1"
                         value={editForm.usageMode}
                         onChange={e => setEditForm({...editForm, usageMode: e.target.value as any})}
                       >
                         <option value="PRIVATE">🔒 Soukromé</option>
                         <option value="SHARED">👥 Sdílené (Souběžné)</option>
                         <option value="SHARED_ROTATION">🕒 Sdílené (Střídání / Rezervace)</option>
                         <option value="LICENSE">🔑 Licence / Slot</option>
                       </select>
                       {editForm.usageMode === "SHARED_ROTATION" && (
                          <label className="flex items-center gap-2 cursor-pointer ml-auto border-l pl-4 border-subtle">
                            <input type="checkbox" checked={editForm.requiresBookingApproval} onChange={e => setEditForm({...editForm, requiresBookingApproval: e.target.checked})} />
                            <span className="text-sm">Schvalování termínů</span>
                          </label>
                       )}
                     </div>
                  </div>
                </div>
                <div className="form-group flex items-center gap-2" style={{ gridColumn: "1 / -1", padding: '8px 0' }}>
                   <label className="flex items-center gap-2 cursor-pointer bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-200">
                     <input 
                       type="checkbox" 
                       checked={editForm.isTerminated} 
                       onChange={e => setEditForm({...editForm, isTerminated: e.target.checked})} 
                     />
                     <span className="text-sm font-bold">Ukončené (aktivní jen do bodu obnovy)</span>
                   </label>
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
                   <label className="form-label">Datum obnovy</label>
                   <input 
                     type="date"
                     className="form-input"
                     value={editForm.renewalDate}
                     onChange={e => setEditForm({...editForm, renewalDate: e.target.value})}
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

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                   <label className="form-label font-bold">Webová adresa (URL)</label>
                   <input 
                     className="form-input"
                     placeholder="https://www.google.com"
                     value={editForm.url}
                     onChange={e => setEditForm({...editForm, url: e.target.value})}
                   />
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

              {/* Price Intervals History */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted">📊 Cenová historie / intervaly</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addPriceInterval}>
                    ＋ Přidat interval
                  </button>
                </div>
                
                {editForm.priceIntervals.length === 0 ? (
                  <p className="text-xs text-muted italic p-4 bg-muted rounded-lg text-center">
                    Žádné zadané intervaly. Služba používá fixní cenu {priceInput} {editForm.currency}.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {editForm.priceIntervals.map((pi, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-xl border border-subtle relative group">
                        <button 
                          type="button" 
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          onClick={() => removePriceInterval(idx)}
                        >
                          ✕
                        </button>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="form-group mb-0">
                            <label className="text-[10px] font-bold text-muted uppercase">Od</label>
                            <input 
                              type="date" 
                              className="form-input text-sm px-2 py-1" 
                              value={pi.startDate} 
                              onChange={e => updatePriceInterval(idx, { startDate: e.target.value })}
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label className="text-[10px] font-bold text-muted uppercase">Do (volitelně)</label>
                            <input 
                              type="date" 
                              className="form-input text-sm px-2 py-1" 
                              value={pi.endDate || ""} 
                              onChange={e => updatePriceInterval(idx, { endDate: e.target.value || null })}
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label className="text-[10px] font-bold text-muted uppercase">Cena ({editForm.currency})</label>
                            <input 
                              type="number" 
                              step="0.01"
                              className="form-input text-sm px-2 py-1" 
                              value={pi.price} 
                              onChange={e => updatePriceInterval(idx, { price: parseFloat(e.target.value) })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted italic mt-2">
                      💡 Tip: Pro "neomezeně" nechte pole "Do" prázdné.
                    </p>
                  </div>
                )}
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

      {/* Booking Modal */}
      {showBookingModal && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowBookingModal(false);
          }}
        >
          <div className="modal" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>📅 Rezervovat službu</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBookingModal(false)}>✕</button>
            </div>
            <div className="modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label font-bold">Od</label>
                <input 
                  type="date"
                  className="form-input"
                  value={bookingForm.startDate}
                  onChange={e => setBookingForm({...bookingForm, startDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label font-bold">Do</label>
                <input 
                  type="date"
                  className="form-input"
                  value={bookingForm.endDate}
                  onChange={e => setBookingForm({...bookingForm, endDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label font-bold">Poznámka (pro vlastníka)</label>
                <input 
                  className="form-input"
                  placeholder="Např. Potřebuji na víkend..."
                  value={bookingForm.note}
                  onChange={e => setBookingForm({...bookingForm, note: e.target.value})}
                />
              </div>
              {service?.requiresBookingApproval && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                  ℹ️ Tato rezervace vyžaduje schválení vlastníkem.
                </div>
              )}
            </div>
            <div className="modal-footer flex gap-3">
              <button className="btn btn-ghost w-full" onClick={() => setShowBookingModal(false)}>Zrušit</button>
              <button className="btn btn-primary w-full" onClick={handleCreateBooking}>Potvrdit rezervaci</button>
            </div>
          </div>
        </div>
      )}
      {/* Add Credential Modal */}
      {showAddCredentialModal && (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && setShowAddCredentialModal(false)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>🔐 Přidat přihlašovací údaje</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddCredentialModal(false)}>✕</button>
            </div>
            <div className="modal-body flex flex-col gap-4">
               <div className="form-group">
                 <label className="form-label">Typ údajů</label>
                 <select 
                   className="form-select"
                   value={credForm.type}
                   onChange={e => setCredForm({...credForm, type: e.target.value})}
                 >
                   <option value="EMAIL_PASSWORD">Email + Heslo</option>
                   <option value="INVITE_LINK">Pozvánka / Link</option>
                   <option value="API_KEY">API Klíč</option>
                   <option value="NOTE">Poznámka / Jiné</option>
                 </select>
               </div>
               <div className="form-group">
                 <label className="form-label">Popisek (např. Profil 1)</label>
                 <input className="form-input" value={credForm.label} onChange={e => setCredForm({...credForm, label: e.target.value})} />
               </div>
               <div className="grid-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Login / Email</label>
                    <input className="form-input" value={credForm.login} onChange={e => setCredForm({...credForm, login: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Heslo / Klíč</label>
                    <div className="relative">
                      <input 
                        className="form-input pr-10" 
                        type={showPassword ? "text" : "password"} 
                        value={credForm.password} 
                        onChange={e => setCredForm({...credForm, password: e.target.value})} 
                      />
                      <button 
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-primary transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Logo služby</label>
                  <div className="flex items-center gap-4 p-4 border border-subtle rounded-xl bg-subtle/30">
                     <div 
                       className="w-16 h-16 rounded-lg bg-elevated border border-subtle flex items-center justify-center overflow-hidden cursor-pointer"
                       onClick={() => setShowIconEditor(true)}
                      >
                       {editForm.iconUrl ? (
                         <img src={editForm.iconUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                       ) : (
                         <span className="text-2xl">🖼️</span>
                       )}
                     </div>
                     <div className="flex-1">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowIconEditor(true)}>
                          📂 Nahrát nové logo
                        </button>
                        {editForm.iconUrl && (
                          <button type="button" className="btn btn-ghost btn-sm text-danger ml-2" onClick={() => setEditForm({...editForm, iconUrl: ''})}>Odstranit</button>
                        )}
                        <p className="text-[10px] text-muted mt-2">Doporučujeme čtvercové logo s průhledným pozadím.</p>
                     </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">URL služby</label>
                  <input 
                    className="form-input" 
                    value={editForm.url || ""} 
                    onChange={e => setEditForm({...editForm, url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

               <div className="form-group">
                  <label className="form-label font-bold">Kdo to uvidí?</label>
                  <select 
                    className="form-select"
                    value={credForm.visibility}
                    onChange={e => setCredForm({...credForm, visibility: e.target.value as any})}
                  >
                    <option value="OWNER_ONLY">Jen já (vlastník)</option>
                    <option value="GRANTED_USERS">Všichni se schváleným přístupem</option>
                  </select>
                  <p className="text-[10px] text-muted mt-1 italic">
                    {credForm.visibility === 'GRANTED_USERS' 
                      ? "⚠️ Všichni uživatelé, kterým schválíte přístup, uvidí tyto údaje."
                      : "Heslo uvidíte pouze vy."}
                  </p>
               </div>
            </div>
            <div className="modal-footer flex gap-3">
               <button className="btn btn-ghost w-full" onClick={() => setShowAddCredentialModal(false)}>Zrušit</button>
               <button className="btn btn-primary w-full" disabled={savingCred} onClick={handleAddCredential}>
                 {savingCred ? "Ukládám..." : "Uložit údaje"}
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Manual Slot Modal */}
      {showAddManualSlotModal && (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && setShowAddManualSlotModal(false)}>
          <div className="modal" onMouseDown={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>👥 Ručně obsadit místo</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddManualSlotModal(false)}>✕</button>
            </div>
            <div className="modal-body flex flex-col gap-4">
               <div className="form-group">
                 <label className="form-label font-bold">Typ obsazení</label>
                 <div className="flex gap-2">
                    <button 
                      className={`btn btn-sm flex-1 ${slotType === 'MANUAL' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSlotType('MANUAL')}
                    >
                      Vnější kontakt
                    </button>
                    <button 
                      className={`btn btn-sm flex-1 ${slotType === 'SYSTEM' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSlotType('SYSTEM')}
                    >
                      Uživatel systému
                    </button>
                 </div>
               </div>

               {slotType === 'MANUAL' ? (
                 <>
                   <div className="form-group">
                     <label className="form-label font-bold">Jméno / Text (povinné)</label>
                     <input 
                       className="form-input" 
                       placeholder="Např. Babička, nebo jméno kamaráda..."
                       value={manualSlotForm.name} 
                       onChange={e => setManualSlotForm({...manualSlotForm, name: e.target.value})} 
                     />
                   </div>
                   <div className="form-group">
                     <label className="form-label">Poznámka (volitelně)</label>
                     <input 
                       className="form-input" 
                       placeholder="Např. Neplatí, dárkový poukaz..."
                       value={manualSlotForm.note} 
                       onChange={e => setManualSlotForm({...manualSlotForm, note: e.target.value})} 
                     />
                   </div>
                 </>
               ) : (
                 <div className="form-group">
                   <label className="form-label font-bold">Vybrat z kontaktů</label>
                   {friendships.length === 0 ? (
                     <div className="p-4 bg-muted rounded-lg text-center text-xs text-muted">
                       Zatím nemáš žádné potvrzené přátele v kontaktech.
                     </div>
                   ) : (
                     <select 
                       className="form-select"
                       value={manualSlotForm.userId}
                       onChange={e => setManualSlotForm({...manualSlotForm, userId: e.target.value})}
                     >
                       <option value="">— Vyberte uživatele —</option>
                       {friendships.map((f: any) => {
                         const other = f.requester.id === service.ownerId ? f.addressee : f.requester;
                         return <option key={other.id} value={other.id}>{other.name} ({other.email})</option>
                       })}
                     </select>
                   )}
                 </div>
               )}
               
               <p className="text-[10px] text-muted italic">
                 {slotType === 'MANUAL' 
                   ? "💡 Tento slot se započítá do celkové kapacity, ale není přidělen konkrétnímu uživateli v systému."
                   : "💡 Tímto přímo udělíte přístup vybranému uživateli, aniž by musel posílat žádost."}
               </p>
            </div>
            <div className="modal-footer flex gap-3">
               <button className="btn btn-ghost w-full" onClick={() => setShowAddManualSlotModal(false)}>Zrušit</button>
               <button 
                className="btn btn-primary w-full" 
                disabled={savingManualSlot || (slotType === 'MANUAL' ? !manualSlotForm.name : !manualSlotForm.userId)} 
                onClick={handleSaveManualSlot}
               >
                 {savingManualSlot ? "Ukládám..." : "Obsadit místo"}
               </button>
            </div>
          </div>
        </div>
      )}

      {showIconEditor && (
        <AvatarEditor 
          onSave={async (img) => { 
            if (showEditModal) {
              setEditForm({...editForm, iconUrl: img}); 
            } else {
              // Direct update from detail header
              try {
                const res = await fetch(`/api/services/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ iconUrl: img })
                });
                if (res.ok) await load();
              } catch (e) {
                console.error(e);
              }
            }
            setShowIconEditor(false); 
          }}
          onCancel={() => setShowIconEditor(false)}
          aspect={1}
        />
      )}
    </div>
  );
}
