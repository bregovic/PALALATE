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
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
        <WishGridPicker activeWishNames={activeWishNames} onWishAdded={loadWishes} />
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
        <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {wishes.map((wish) => (
            <div key={wish.id} className="card p-6 flex flex-col gap-4 group hover:shadow-lg transition-all relative overflow-hidden">
              {viewScope === "me" && (
                <button 
                  className="absolute top-4 right-4 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full"
                  onClick={() => handleDeleteWish(wish.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="user-avatar" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-50)', color: 'var(--brand-600)', fontSize: '1.2rem' }}>
                  {wish.serviceName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{wish.serviceName}</h3>
                  <div className="flex items-center gap-2">
                    {wish.priority === 3 && <span className="badge badge-red text-[9px]">🔥 Priorita</span>}
                    {wish.priority === 2 && <span className="badge badge-yellow text-[9px]">⭐ Důležité</span>}
                    <span className="text-[10px] text-muted uppercase tracking-tighter">Přidáno: {new Date(wish.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {wish.description && (
                <div className="p-3 bg-slate-50 rounded-xl text-sm text-secondary border border-slate-100 italic">
                  "{wish.description}"
                </div>
              )}

              {wish.link && (
                <a href={wish.link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm text-brand-600 self-start px-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Více o službě
                </a>
              )}

              {(viewScope === "friends" || viewScope !== "me") && wish.user && (
                <div className="mt-2 pt-4 border-t border-subtle flex items-center gap-2">
                  <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>
                    {wish.user.name[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-muted">
                    Přeje si: <span className="text-primary">{wish.user.name}</span>
                  </span>
                </div>
              )}
              
              {viewScope !== "me" && (
                <button 
                  className="btn btn-primary btn-sm mt-2" 
                  onClick={() => alert("Tahle funkce bude v další verzi! Můžeš pak uživateli rovnou poslat nabídku sdílení. 😉")}
                >
                  🤝 Nabídnout sdílení
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
