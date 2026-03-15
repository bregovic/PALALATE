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
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Chat</h1>
          <p className="text-gray-400">Napiš si se svými přáteli</p>
        </header>

        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-16 bg-gray-900 rounded-3xl border border-gray-800 border-dashed">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-gray-400 mb-6">Zatím tu nemáš žádné kontakty pro chat.</p>
              <Link href="/dashboard/contacts" className="btn btn-primary px-6 py-2 rounded-full font-bold">
                Najít přátele
              </Link>
            </div>
          ) : (
            contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/dashboard/chat/${contact.id}`}
                className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:bg-gray-800 hover:border-gray-700 transition-all group relative overflow-hidden"
              >
                {/* Status Indicator (Always online for now) */}
                <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xl overflow-hidden border-2 border-gray-700 relative">
                  {contact.avatar ? (
                    <Image src={contact.avatar} alt={contact.name} width={56} height={56} className="object-cover" />
                  ) : (
                    contact.name.charAt(0).toUpperCase()
                  )}
                  {contact.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white border-2 border-gray-900 animate-pulse">
                      {contact.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-white truncate">{contact.name}</h3>
                    {contact.lastMessage && (
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        {new Date(contact.lastMessage.createdAt).toLocaleTimeString("cs-CZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${contact.unreadCount > 0 ? "text-white font-semibold" : "text-gray-500"}`}>
                    {contact.lastMessage ? contact.lastMessage.content : "Zatím žádné zprávy"}
                  </p>
                </div>

                <div className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
