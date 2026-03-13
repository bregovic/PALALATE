"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";

interface Request {
  id: string;
  status: string;
  message: string | null;
  requestedFrom: string | null;
  requestedTo: string | null;
  createdAt: string;
  requester: { id: string; name: string; email: string };
  service: { id: string; serviceName: string; providerName: string };
}

export default function RequestsPage() {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [showDecisionModal, setShowDecisionModal] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

  async function loadRequests() {
    setLoading(true);
    const res = await fetch(`/api/requests?type=${tab}`);
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadRequests(); }, [tab]);

  async function handleDecision(id: string, action: "approve" | "reject") {
    setActionId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, decisionNote }),
      });
      if (res.ok) {
        setShowDecisionModal(null);
        setDecisionNote("");
        await loadRequests();
      }
    } finally {
      setActionId(null);
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: "⏳ Čeká", cls: "badge-yellow" },
      APPROVED: { label: "✅ Schváleno", cls: "badge-green" },
      REJECTED: { label: "❌ Zamítnuto", cls: "badge-red" },
      CANCELLED: { label: "🚫 Zrušeno", cls: "badge-gray" },
      EXPIRED: { label: "⌛ Vypršelo", cls: "badge-gray" },
    };
    const m = map[status] || { label: status, cls: "badge-gray" };
    return <span className={`badge ${m.cls}`}>{m.label}</span>;
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("cs-CZ") : "–";

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Žádosti o přístup</h1>
          <p className="page-subtitle">
            Správce přání a snů ostatních lidí. Mocné postavení, velká odpovědnost. 🦸
          </p>
        </div>
      </div>

      <div className="tabs">
        <button
          id="tab-incoming"
          className={`tab ${tab === "incoming" ? "active" : ""}`}
          onClick={() => setTab("incoming")}
        >
          📥 Příchozí žádosti
        </button>
        <button
          id="tab-outgoing"
          className={`tab ${tab === "outgoing" ? "active" : ""}`}
          onClick={() => setTab("outgoing")}
        >
          📤 Mé žádosti
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </div>
            <div className="empty-title">
              {tab === "incoming" ? "Žádné příchozí žádosti" : "Zatím jsi o nic nežádal"}
            </div>
            <p className="empty-desc">
              {tab === "incoming"
                ? "Nikdo tě o přístup nežádá. Buď jsou tvé služby tajemstvím, nebo prostě nemáš přátele. 🤷"
                : "Přistup ke svým přátelům a požádej o přístup k jejich předplatným."}
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {tab === "incoming" ? (
                    <>
                      <th>Žadatel</th>
                      <th>Služba</th>
                      <th>Zpráva</th>
                      <th>Datum</th>
                      <th>Stav</th>
                      <th>Akce</th>
                    </>
                  ) : (
                    <>
                      <th>Služba</th>
                      <th>Vlastník</th>
                      <th>Zpráva</th>
                      <th>Datum</th>
                      <th>Stav</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    {tab === "incoming" ? (
                      <>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.requester.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.requester.email}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.service.serviceName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.service.providerName}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            {r.message || <span className="text-muted">–</span>}
                          </span>
                        </td>
                        <td>{formatDate(r.createdAt)}</td>
                        <td>{statusBadge(r.status)}</td>
                        <td>
                          {r.status === "PENDING" && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                id={`approve-${r.id}`}
                                className="btn btn-success btn-sm"
                                onClick={() => setShowDecisionModal({ id: r.id, action: "approve" })}
                                disabled={actionId === r.id}
                              >
                                ✓ Schválit
                              </button>
                              <button
                                id={`reject-${r.id}`}
                                className="btn btn-danger btn-sm"
                                onClick={() => setShowDecisionModal({ id: r.id, action: "reject" })}
                                disabled={actionId === r.id}
                              >
                                ✗ Zamítnout
                              </button>
                            </div>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.service.serviceName}</div>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>–</td>
                        <td>{r.message || <span className="text-muted">–</span>}</td>
                        <td>{formatDate(r.createdAt)}</td>
                        <td>{statusBadge(r.status)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision modal */}
      {showDecisionModal && (
        <div className="modal-overlay" onClick={() => setShowDecisionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {showDecisionModal.action === "approve" ? "✅ Schválit žádost" : "❌ Zamítnout žádost"}
              </h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowDecisionModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Zpráva (volitelná)</label>
                <textarea
                  className="form-textarea"
                  placeholder={
                    showDecisionModal.action === "approve"
                      ? "Vítej na palubě! Přístupy ti pošlu bokem... 🤝"
                      : "Omlouvám se, momentálně nemám volné místo..."
                  }
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDecisionModal(null)}>
                Zrušit
              </button>
              <button
                id={`confirm-${showDecisionModal.action}`}
                className={`btn ${showDecisionModal.action === "approve" ? "btn-success" : "btn-danger"}`}
                onClick={() => handleDecision(showDecisionModal.id, showDecisionModal.action)}
                disabled={actionId !== null}
              >
                {actionId ? <div className="spinner" style={{ width: 16, height: 16 }} /> : null}
                {showDecisionModal.action === "approve" ? "Potvrdit schválení" : "Potvrdit zamítnutí"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
