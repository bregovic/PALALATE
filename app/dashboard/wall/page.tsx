"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export default function WallPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPosts();
    }
  }, [authLoading, user]);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/social/posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newPostContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPostContent }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts([newPost, ...posts]);
        setNewPostContent("");
      }
    } catch (err) {
      console.error("Failed to create post", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>Načítám nástěnku...</div>;
  }

  return (
    <DashboardShell user={user} pendingRequests={0} unreadNotifs={0}>
      <div className="page-content animate-fade-in social-layout">
        <div className="feed-container">
          
          <div className="feed-main">
            <div className="page-header" style={{ marginBottom: 24 }}>
              <div>
                <h1 className="page-title">Nástěnka</h1>
                <p className="page-subtitle">Sdílej novinky a zajímavosti se svými přáteli 🥑</p>
              </div>
            </div>

            {/* Create Post Area */}
            <div className="card mb-4" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div className="card-body">
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="user-avatar" style={{ width: 44, height: 44, flexShrink: 0 }}>
                    {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      className="form-textarea"
                      placeholder="Co máš na srdci? Napiš něco hezkého..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      style={{ border: "none", padding: "8px 0", minHeight: 60, fontSize: "1.05rem", background: "transparent", boxShadow: "none", width: "100%" }}
                    />
                    <div className="divider" style={{ margin: "8px 0" }} />
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                      <span className="text-xs text-muted">{newPostContent.length} / 500</span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleCreatePost()}
                        disabled={submitting || !newPostContent.trim()}
                        style={{ borderRadius: 'var(--radius-full)', padding: '8px 20px' }}
                      >
                        {submitting ? "..." : "Zveřejnit"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />)
              ) : posts.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-icon">📮</div>
                  <div className="empty-title">Zatím tu nic není</div>
                  <p className="empty-desc">Zkus napsat první příspěvek a oslovit své kontakty!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="post-card">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div className="user-avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
                        {post.author.avatar ? <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : post.author.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: '0.95rem' }}>{post.author.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(post.createdAt).toLocaleDateString("cs-CZ", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm btn-icon">•••</button>
                    </div>
                    <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {post.content}
                    </p>
                    <div className="divider" style={{ margin: "16px 0 12px" }} />
                    <div style={{ display: "flex", gap: 24 }}>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}>❤️ Líbí se</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}>💬 Komentovat</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="feed-side">
            {/* Boční sekce odstraněny na žádost uživatele */}
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
