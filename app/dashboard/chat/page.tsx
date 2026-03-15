"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";

interface Contact {
  id: string;
  name: string;
  avatar?: string | null;
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchContacts();
    }
  }, [authLoading, user]);

  async function fetchContacts() {
    try {
      const res = await fetch("/api/social/chat");
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return <div className="p-8 text-center text-gray-400">Načítám chaty...</div>;
  }

  return (
    <DashboardShell user={user} pendingRequests={0} unreadNotifs={0}>
      <div className="page-content animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 700 }}>
          <div className="page-header" style={{ marginBottom: 32 }}>
            <div>
              <h1 className="page-title">Chat</h1>
              <p className="page-subtitle">Napiš si soukromě se svými přáteli 💬</p>
            </div>
          </div>
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="skeleton mt-4" style={{ height: 80, borderRadius: "var(--radius-lg)" }} />)
          ) : contacts.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon">👋</div>
              <div className="empty-title">Zatím tu nikoho nemáš</div>
              <p className="empty-desc">
                Přidej si přátele v sekci Kontakty a začněte si psát!
              </p>
              <Link href="/dashboard/contacts" className="btn btn-primary mt-4">
                Přejít na kontakty
              </Link>
            </div>
          ) : (
            <div className="flex-col gap-2">
              {contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/dashboard/chat/${contact.id}`}
                  className="chat-list-item card-interactive mb-2"
                >
                  <div className="user-avatar" style={{ width: 52, height: 52, fontSize: "1.2rem" }}>
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      contact.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{contact.name}</div>
                      {contact.lastMessage && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(contact.lastMessage.createdAt).toLocaleTimeString("cs-CZ", {
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p style={{ 
                        fontSize: "0.85rem", 
                        color: contact.unreadCount > 0 ? "var(--text-primary)" : "var(--text-muted)",
                        fontWeight: contact.unreadCount > 0 ? 600 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "200px"
                      }}>
                        {contact.lastMessage ? contact.lastMessage.content : "Zatím žádné zprávy"}
                      </p>
                      {contact.unreadCount > 0 && (
                        <span className="badge badge-red" style={{ height: 20, minWidth: 20, justifyContent: "center", padding: "0 6px" }}>
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
