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
  const [viewScope, setViewScope] = useState<string>("all"); // "all", "me", "friends"
  const [searchTerm, setSearchTerm] = useState("");
  
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
      
      const acceptedFriends = (fsData.friendships || [])
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
      } else if (viewScope !== "me" && viewScope !== "all") {
        url += `?userId=${viewScope}`;
      } else if (viewScope === "all") {
        url += "?scope=all";
      }
      
      const res = await fetch(url);
      if (res.ok) {
        let data = await res.json();
        setWishes(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWish(id: string) {
    if (!confirm("Opravdu chcete toto přání smazat?")) return;
    const res = await fetch(`/api/wishes/${id}`, { method: "DELETE" });
    if (res.ok) loadWishes();
  }

  const filteredWishes = useMemo(() => {
    return (wishes || []).filter(w => {
      const matchesSearch = w.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [wishes, searchTerm]);

  return (
    <div className="page-content animate-fade-in">
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, width: "100%" }}>
          <button 
            onClick={() => setViewScope("all")} 
            className={`btn btn-sm px-4 rounded-full border-none whitespace-nowrap ${viewScope === "all" ? "btn-primary" : "bg-muted text-muted"}`}
          >
            🌟 Všechna přání
          </button>
          <button 
            onClick={() => setViewScope("me")} 
            className={`btn btn-sm px-4 rounded-full border-none whitespace-nowrap ${viewScope === "me" ? "btn-primary" : "bg-muted text-muted"}`}
          >
            👤 Moje
          </button>
          <button 
            onClick={() => setViewScope("friends")} 
            className={`btn btn-sm px-4 rounded-full border-none whitespace-nowrap ${viewScope === "friends" ? "btn-primary" : "bg-muted text-muted"}`}
          >
            🌐 Přátelé
          </button>
          <div style={{ width: 1, height: 24, background: "var(--border-subtle)", margin: "0 8px", flexShrink: 0 }} />
          {friends.map(f => (
            <button 
              key={f.id}
              onClick={() => setViewScope(f.id)} 
              className={`btn btn-sm px-4 rounded-full border-none whitespace-nowrap flex items-center gap-2 ${viewScope === f.id ? "btn-primary" : "bg-muted text-muted"}`}
            >
              <div className="user-avatar" style={{ width: 18, height: 18, fontSize: '0.5rem' }}>
                {f.avatar ? <img src={f.avatar} alt="" /> : f.name[0]}
              </div>
              {f.name}
            </button>
          ))}
        </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div className="input-with-icon flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            placeholder="Hledat v přání..." 
            className="form-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setViewScope("me");
            setTimeout(() => {
               const picker = document.getElementById('wish-picker-container');
               if (picker) picker.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        >
          ＋ Přidat
        </button>
      </div>

      {viewScope === "me" && (
        <div id="wish-picker-container" className="mb-6">
          <WishGridPicker activeWishNames={wishes.filter(w => w.user.id === currentUser?.id).map(w => w.serviceName)} onWishAdded={loadWishes} />
        </div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-xl)" }} />
      ) : filteredWishes.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">✨</div>
          <h3 className="empty-title">Žádná přání nenalezena</h3>
          <p className="empty-desc">Zkus změnit filtr nebo přidat vlastní přání.</p>
        </div>
      ) : (
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ textAlign: "left", padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>Služba</th>
                  <th className="mobile-hide" style={{ textAlign: "left", padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", width: "100px" }}>Priorita</th>
                  <th className="mobile-hide" style={{ textAlign: "left", padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>Poznámka</th>
                  <th style={{ textAlign: "left", padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", width: "140px" }}>Kdo si přeje</th>
                  <th style={{ width: "80px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredWishes.map((wish) => {
                  const isMine = wish.user.id === currentUser?.id;
                  return (
                    <tr key={wish.id} style={{ borderBottom: "1px solid var(--border-subtle)" }} className="hover:bg-muted/30 transition-colors">
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="user-avatar" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                            {wish.serviceName[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{wish.serviceName}</div>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{new Date(wish.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="mobile-hide" style={{ padding: "14px 16px" }}>
                        {wish.priority === 3 ? <span className="badge badge-red text-[10px]">🔥 Vysoká</span> :
                         wish.priority === 2 ? <span className="badge badge-yellow text-[10px]">⭐ Střední</span> :
                         <span className="badge badge-gray text-[10px]">Nízká</span>}
                      </td>
                      <td className="mobile-hide" style={{ padding: "14px 16px" }}>
                        <div className="text-xs text-secondary truncate max-w-[200px]" title={wish.description || ""}>
                          {wish.description || "—"}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="user-avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', flexShrink: 0 }}>
                            {wish.user.avatar ? <img src={wish.user.avatar} alt="" /> : wish.user.name[0]}
                          </div>
                          <span className={`text-[11px] font-bold ${isMine ? 'text-brand-600' : 'text-primary'}`}>
                            {isMine ? 'Já' : wish.user.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        {isMine ? (
                          <button 
                            className="btn btn-ghost btn-sm btn-icon text-muted hover:text-danger"
                            onClick={() => handleDeleteWish(wish.id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        ) : (
                          <button 
                            className="btn btn-ghost btn-sm text-brand-600 font-bold p-0 px-2"
                            onClick={() => alert("Nabídka sdílení bude v další verzi!")}
                          >
                            🤝
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
