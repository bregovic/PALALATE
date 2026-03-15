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
      <div className="page-content animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 1000 }}>
          <div className="page-header" style={{ paddingLeft: 16 }}>
            <div>
              <h1 className="page-title">Nástěnka</h1>
              <p className="page-subtitle">Sdílej novinky a zajímavosti se svými přáteli 🥑</p>
            </div>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 700 }}>
          {/* Create Post Area */}
          <div className="card mb-8">
            <div className="card-body">
              <textarea
                className="form-textarea"
                placeholder="Co máš na srdci? Napiš něco hezkého..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                style={{ border: "none", padding: 0, minHeight: 80, fontSize: "1.05rem", background: "transparent", boxShadow: "none" }}
              />
              <div className="divider" />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleCreatePost()}
                  disabled={submitting || !newPostContent.trim()}
                >
                  {submitting ? "Zveřejňuji..." : "🚀 Zveřejnit"}
                </button>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />)
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📮</div>
                <div className="empty-title">Zatím tu nic není</div>
                <p className="empty-desc">Zkus napsat první příspěvek a oslovit své kontakty!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div className="user-avatar" style={{ width: 44, height: 44 }}>
                      {post.author.avatar ? <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : post.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{post.author.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(post.createdAt).toLocaleDateString("cs-CZ", {
                          day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "1rem", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
