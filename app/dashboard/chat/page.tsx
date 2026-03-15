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
      <div className="page-content animate-fade-in social-layout">
        <div className="feed-container">
          
          <div className="feed-main">
            <div className="page-header" style={{ marginBottom: 24 }}>
              <div>
                <h1 className="page-title">Chat</h1>
                <p className="page-subtitle">Napiš si soukromě se svými přáteli 💬</p>
              </div>
            </div>

            {contacts.length === 0 ? (
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
              <div className="flex-col gap-3">
                {contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/dashboard/chat/${contact.id}`}
                    className="chat-list-item"
                  >
                    <div className="user-avatar" style={{ width: 56, height: 56, fontSize: "1.2rem", flexShrink: 0 }}>
                      {contact.avatar ? (
                        <img src={contact.avatar} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        contact.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: '1rem' }}>{contact.name}</div>
                        {contact.lastMessage && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
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
                        }}>
                          {contact.lastMessage ? contact.lastMessage.content : "Zatím žádné zprávy"}
                        </p>
                        {contact.unreadCount > 0 && (
                          <span className="badge badge-red" style={{ height: 20, minWidth: 20, justifyContent: "center", padding: "0 6px", borderRadius: '50%' }}>
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

          <div className="feed-side">
            <div className="card">
              <div className="card-header"><h4>Aktivní teď</h4></div>
              <div className="card-body">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="user-avatar" style={{ width: 10, height: 10, background: 'var(--success-500)', border: 'none' }} />
                    <span className="text-sm font-medium">Tonička</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="user-avatar" style={{ width: 10, height: 10, background: 'var(--success-500)', border: 'none' }} />
                    <span className="text-sm font-medium">Venca</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body text-center p-6">
                <div className="mb-4" style={{ fontSize: '2rem' }}>📞</div>
                <h4 className="mb-2">Hromadné hovory</h4>
                <p className="text-xs text-muted mb-4">Chceš si zavolat s více přáteli najednou? Brzy spustíme testovací verzi!</p>
                <button className="btn btn-secondary btn-sm w-full">Chci vyzkoušet</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
