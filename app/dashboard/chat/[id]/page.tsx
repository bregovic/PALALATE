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
      <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-4 bg-gray-900 border-b border-gray-800">
          <Link href="/dashboard/chat" className="btn btn-ghost btn-icon mr-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
            {partner?.avatar ? (
              <Image src={partner.avatar} alt={partner.name} width={40} height={40} />
            ) : (
              partner?.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="font-bold text-white mb-0.5">{partner?.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Online</span>
            </div>
          </div>
        </div>

        {/* Messages Chamber */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <div className="text-4xl mb-4">👋</div>
              <p>Pozdravte {partner?.name}!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderId === user.id;
              const prevMsg = messages[idx - 1];
              const showDate = !prevMsg || 
                new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center my-6">
                      <span className="bg-gray-800 text-gray-400 text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter">
                        {new Date(msg.createdAt).toLocaleDateString("cs-CZ", {
                          day: "numeric", month: "long"
                        })}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                        isMine 
                          ? "bg-purple-600 text-white rounded-tr-none" 
                          : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"
                      }`}
                    >
                      {msg.content}
                      <div className={`text-[9px] mt-1 ${isMine ? "text-purple-200" : "text-gray-500"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("cs-CZ", {
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {commonEmojis.map(emoji => (
              <button 
                key={emoji}
                onClick={() => handleEmoji(emoji)}
                className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-lg text-lg transition-colors border border-gray-700/50"
              >
                {emoji}
              </button>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              className="flex-1 bg-black border border-gray-700 rounded-full px-5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-600"
              placeholder="Napište zprávu..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="w-12 h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              disabled={sending || !newMessage.trim()}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
