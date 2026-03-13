"use client";

import { useState, useEffect, useMemo } from "react";
import { WishGridPicker } from "@/components/wishes/WishGridPicker";

interface Wish {
  id: string;
  serviceName: string;
  description: string | null;
  link: string | null;
  priority: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export default function WishesPage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<string>("me"); // "me", "friends" (aggregated), or "userId"
  
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadWishes();
  }, [viewScope]);

  async function loadInitial() {
    try {
      const [fsRes, meRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/me")
      ]);
      const fsData = await fsRes.json();
      const meData = await meRes.json();
      setCurrentUser(meData);
      
      const acceptedFriends = fsData.friendships
        .filter((f: any) => f.status === "ACCEPTED")
        .map((f: any) => f.requesterId === meData.id ? f.addressee : f.requester);
      
      setFriends(acceptedFriends);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadWishes() {
    setLoading(true);
    try {
      let url = "/api/wishes";
      if (viewScope === "friends") {
        url += "?scope=friends";
      } else if (viewScope !== "me") {
        url += `?userId=${viewScope}`;
      }
      
      const res = await fetch(url);
      if (res.ok) setWishes(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWish(id: string) {
    if (!confirm("Opravdu chcete toto přání smazat?")) return;
    const res = await fetch(`/api/wishes/${id}`, { method: "DELETE" });
    if (res.ok) loadWishes();
  }

  const activeWishNames = useMemo(() => {
    // Only block adding if it's already in MY wishes
    if (viewScope !== "me") return [];
    return wishes.map(w => w.serviceName);
  }, [wishes, viewScope]);

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">✨ Přání</h1>
          <p className="page-subtitle">Služby, které si {viewScope === 'me' ? 'přeješ ty' : 'přejí ostatní'}. Společně to vyjde levněji!</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {viewScope === "me" && (
            <button 
              className="btn btn-primary"
              onClick={() => {
                // We'll toggle the picker which is now just below
                const picker = document.getElementById('wish-picker-container');
                if (picker) picker.scrollIntoView({ behavior: 'smooth' });
                // If it's a modal or similar, we'd trigger it here. 
                // For now, I'll just keep the picker below the header but hidden/visible.
              }}
            >
              ＋ Přidat přání
            </button>
          )}
          <select 
            className="form-select w-auto" 
            style={{ minWidth: 200 }}
            value={viewScope}
            onChange={(e) => setViewScope(e.target.value)}
          >
            <option value="me">👤 Moje přání</option>
            <option value="friends">🌐 Všechna přání přátel</option>
            {friends.length > 0 && <optgroup label="Konkrétní přátelé">
              {friends.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </optgroup>}
          </select>
        </div>
      </div>

      {viewScope === "me" && (
        <div id="wish-picker-container">
          <WishGridPicker activeWishNames={activeWishNames} onWishAdded={loadWishes} />
        </div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-xl)" }} />
      ) : wishes.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">✨</div>
          <h3 className="empty-title">
            {viewScope === "me" ? "Zatím nemáš žádná přání" : "Tento uživatel zatím nemá žádná přání"}
          </h3>
          <p className="empty-desc">
            {viewScope === "me" 
              ? "Klikni na plus výše a přidej si služby, které bys chtěl sdílet."
              : "Alespoň tě to nebude nic stát! 😁"}
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Služba</th>
                  <th className="hidden-mobile" style={{ textAlign: "left", padding: "12px 16px" }}>Priorita</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Poznámka / Odkaz</th>
                  {viewScope !== "me" && <th style={{ textAlign: "left", padding: "12px 16px" }}>Přeje si</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {wishes.map((wish) => (
                  <tr key={wish.id} style={{ borderBottom: "1px solid var(--border-subtle)", verticalAlign: "middle" }}>
                    <td style={{ padding: "16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-50)', color: 'var(--brand-600)', fontSize: '0.9rem', flexShrink: 0 }}>
                          {wish.serviceName[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm" style={{ lineHeight: 1.2 }}>{wish.serviceName}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Přidáno: {new Date(wish.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden-mobile" style={{ padding: "16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {wish.priority === 3 && <span className="badge badge-red" style={{ padding: "4px 10px", lineHeight: 1 }}>🔥 Vysoká</span>}
                        {wish.priority === 2 && <span className="badge badge-yellow" style={{ padding: "4px 10px", lineHeight: 1 }}>⭐ Střední</span>}
                        {wish.priority <= 1 && <span className="badge badge-gray" style={{ padding: "4px 10px", lineHeight: 1 }}>Nízká</span>}
                      </div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "middle" }}>
                      <div className="flex flex-col gap-1">
                        {wish.description && <div className="text-sm italic text-secondary">"{wish.description}"</div>}
                        {wish.link && (
                          <a href={wish.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Odkaz
                          </a>
                        )}
                      </div>
                    </td>
                    {viewScope !== "me" && (
                      <td style={{ padding: "16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', flexShrink: 0 }}>
                            {wish.user.name[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-primary">{wish.user.name}</span>
                        </div>
                      </td>
                    )}
                    <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "right" }}>
                      <div className="flex gap-2 justify-end">
                        {viewScope !== "me" && (
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => alert("Tahle funkce bude v další verzi! 😉")}
                          >
                            🤝 Nabídnout
                          </button>
                        )}
                        {viewScope === "me" && (
                          <button 
                            className="btn btn-ghost btn-icon btn-sm text-muted hover:text-danger"
                            onClick={() => handleDeleteWish(wish.id)}
                            title="Smazat přání"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
