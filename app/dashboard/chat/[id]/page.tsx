"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface Partner {
  id: string;
  name: string;
  avatar?: string | null;
}

export default function ChatConversationPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user, partnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchData() {
    try {
      // Get partner info from chat list or handle it locally
      const listRes = await fetch("/api/social/chat");
      const listData = await listRes.json();
      const p = listData.contacts?.find((c: any) => c.id === partnerId);
      if (p) setPartner(p);
      
      await fetchMessages();
    } catch (err) {
      console.error("Failed to fetch chat data", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/social/chat/${partnerId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch(`/api/social/chat/${partnerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
      } else {
        setNewMessage(content); // Revert on failure
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  }

  const handleEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const commonEmojis = ["😊", "😂", "👍", "❤️", "😮", "🙏", "🔥", "🎉", "🥑", "💡"];

  if (authLoading || loading) {
    return <div className="p-8 text-center text-gray-400">Načítám konverzaci...</div>;
  }

  return (
    <DashboardShell user={user} pendingRequests={0} unreadNotifs={0}>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden" style={{ background: "var(--bg-base)" }}>
        {/* Chat Header */}
        <div className="topbar" style={{ position: "static", background: "var(--bg-surface)", justifyContent: "flex-start", gap: 16 }}>
          <Link href="/dashboard/chat" className="btn btn-ghost btn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="user-avatar" style={{ width: 40, height: 40, fontSize: "1rem" }}>
            {partner?.avatar ? (
              <Image src={partner.avatar} alt={partner.name} width={40} height={40} />
            ) : (
              partner?.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>{partner?.name}</div>
            <div className="flex items-center gap-1.5" style={{ marginTop: 2 }}>
              <span className="notif-dot" style={{ width: 6, height: 6, background: "var(--success-500)", boxShadow: "0 0 4px var(--success-400)" }} />
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Online</span>
            </div>
          </div>
        </div>

        {/* Messages Chamber */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👋</div>
              <p className="empty-title">Pozdravte {partner?.name}!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderId === user?.id;
              const prevMsg = messages[idx - 1];
              const showDate = !prevMsg || 
                new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {showDate && (
                    <div style={{ textAlign: "center", margin: "24px 0" }}>
                      <span className="badge badge-gray" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontWeight: 500 }}>
                        {new Date(msg.createdAt).toLocaleDateString("cs-CZ", {
                          day: "numeric", month: "long"
                        })}
                      </span>
                    </div>
                  )}
                  <div className={`chat-bubble ${isMine ? "right" : "left"}`}>
                    {msg.content}
                    <div style={{ 
                      fontSize: "0.65rem", 
                      marginTop: 4, 
                      textAlign: isMine ? "right" : "left",
                      opacity: 0.7,
                      color: isMine ? "white" : "var(--text-muted)"
                    }}>
                      {new Date(msg.createdAt).toLocaleTimeString("cs-CZ", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-area">
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {commonEmojis.map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => handleEmoji(emoji)}
                  className="btn btn-ghost btn-sm"
                  style={{ minWidth: 40, height: 40, padding: 0, fontSize: "1.2rem", background: "var(--bg-elevated)" }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                className="form-input"
                placeholder="Napište zprávu..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                style={{ borderRadius: "var(--radius-full)", padding: "12px 20px" }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-icon"
                disabled={sending || !newMessage.trim()}
                style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
