"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Friendship {
  id: string;
  status: string;
  requesterId: string;
  addresseeId: string;
  message: string | null;
  createdAt: string;
  acceptedAt: string | null;
  requester: { id: string; name: string; email: string };
  addressee: { id: string; name: string; email: string };
}

interface Invitation {
  id: string;
  email: string;
  message: string | null;
  createdAt: string;
  status: string;
}

interface CurrentUser {
  id: string;
}

export default function ContactsPage() {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  async function load() {
    const [fsRes, meRes] = await Promise.all([
      fetch("/api/contacts"),
      fetch("/api/me"),
    ]);
    const data = await fsRes.json();
    const me = await meRes.json();
    setFriendships(Array.isArray(data.friendships) ? data.friendships : []);
    setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
    setCurrentUserId(me?.id || "");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function sendRequest() {
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, message: inviteMsg }),
    });
    const data = await res.json();
    if (!res.ok) {
      setInviteError(data.error || "Chyba");
    } else {
      setInviteSuccess(`Žádost odeslána ${inviteEmail} ✓`);
      setInviteEmail("");
      setInviteMsg("");
      load();
    }
    setInviteLoading(false);
  }

  async function handleAction(id: string, action: string) {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Opravdu chceš odebrat tento kontakt?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    load();
  }

  async function cancelInvitation(id: string, type: 'FRIEND' | 'INVITE') {
    if (!confirm("Opravdu chceš tuto žádost/pozvánku zrušit?")) return;
    const url = type === 'FRIEND' ? `/api/contacts/${id}` : `/api/invitations/${id}`;
    await fetch(url, { method: "DELETE" });
    load();
  }

  const accepted = friendships.filter((f) => f.status === "ACCEPTED");
  const pending = friendships.filter((f) => f.status === "PENDING");
  const pendingIncoming = pending.filter((f) => f.addresseeId === currentUserId);
  const pendingOutgoing = pending.filter((f) => f.requesterId === currentUserId);

  const getOther = (f: Friendship) =>
    f.requesterId === currentUserId ? f.addressee : f.requester;

  const Initials = ({ name }: { name: string }) => (
    <div className="user-avatar" style={{ width: 40, height: 40, fontSize: "0.9rem", flexShrink: 0 }}>
      {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
    </div>
  );

  return (
    <div className="page-content animate-fade-in">
      <div className="flex justify-end mb-6">
        <button
          id="add-contact-btn"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          Přidat kontakt
        </button>
      </div>

      {/* Pending incoming */}
      {pendingIncoming.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3>📬 Příchozí žádosti</h3>
            <span className="badge badge-yellow">{pendingIncoming.length}</span>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingIncoming.map((f) => {
              const other = getOther(f);
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <Initials name={other.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{other.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{other.email}</div>
                    {f.message && <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>„{f.message}"</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      id={`accept-${f.id}`}
                      className="btn btn-success btn-sm"
                      onClick={() => handleAction(f.id, "accept")}
                    >
                      ✓ Přijmout
                    </button>
                    <button
                      id={`reject-${f.id}`}
                      className="btn btn-danger btn-sm"
                      onClick={() => handleAction(f.id, "reject")}
                    >
                      Odmítnout
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted contacts */}
      <div className="card mb-6">
        <div className="card-header"><h3>👥 Mé kontakty</h3></div>
        <div className="card-body">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
            </div>
          ) : accepted.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="empty-title">Žádné kontakty</div>
              <p className="empty-desc">Přidej přátele a začněte spolu sdílet předplatná!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {accepted.map((f) => {
                const other = getOther(f);
                return (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: "var(--radius-md)", transition: "background var(--transition-fast)" }}>
                    <Initials name={other.name} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{other.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{other.email}</div>
                    </div>
                    <span className="badge badge-green" style={{ flexShrink: 0 }}>Propojeni</span>
                    <Link
                      href={`/dashboard/chat/${other.id}`}
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: "var(--brand-400)" }}
                      data-tooltip="Napsat zprávu"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </Link>
                    <button
                      id={`remove-${f.id}`}
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => remove(f.id)}
                      data-tooltip="Odebrat kontakt"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pending outgoing */}
      {(pendingOutgoing.length > 0 || invitations.length > 0) && (
        <div className="card">
          <div className="card-header"><h3>📤 Odeslané žádosti a pozvánky</h3></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingOutgoing.map((f) => {
              const other = getOther(f);
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                  <Initials name={other.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{other.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{other.email}</div>
                  </div>
                  <span className="badge badge-yellow">⏳ Čeká na přijetí</span>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => cancelInvitation(f.id, 'FRIEND')}
                    data-tooltip="Zrušit žádost"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {invitations.map((inv) => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: "1px solid var(--border-subtle)" }}>
                <div className="user-avatar" style={{ width: 40, height: 40, background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                  ✉️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{inv.email}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pozvání do aplikace</div>
                </div>
                <span className="badge badge-purple">📩 Pozvánka odeslána</span>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => cancelInvitation(inv.id, 'INVITE')}
                  data-tooltip="Zrušit pozvánku"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add contact modal */}
      {showModal && (
        <div 
          className="modal-overlay" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Přidat kontakt</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {inviteError && <div className="alert alert-error">{inviteError}</div>}
              {inviteSuccess && <div className="alert alert-success">{inviteSuccess}</div>}
              <div className="form-group">
                <label className="form-label">Email uživatele *</label>
                <input
                  id="invite-email"
                  type="email"
                  className="form-input"
                  placeholder="kamarad@email.cz"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  autoFocus
                />
                <span className="form-hint">Pokud uživatel není v Palalate, odešleme mu pozvánku emailem.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Zpráva (nepovinná)</label>
                <textarea
                  id="invite-message"
                  className="form-textarea"
                  placeholder="Hele, pojď sdílet Netflix... 😁"
                  value={inviteMsg}
                  onChange={(e) => setInviteMsg(e.target.value)}
                  style={{ minHeight: 70 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Zrušit</button>
              <button
                id="send-invite-btn"
                className="btn btn-primary"
                onClick={sendRequest}
                disabled={inviteLoading || !inviteEmail}
              >
                {inviteLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : null}
                Odeslat žádost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
