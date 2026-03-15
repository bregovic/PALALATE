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

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
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
    return <div className="p-8 text-center text-gray-400">Načítám nástěnku...</div>;
  }

  return (
    <DashboardShell user={user} pendingRequests={0} unreadNotifs={0}>
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nástěnka</h1>
          <p className="text-gray-400">Sdílej novinky se svými přáteli</p>
        </header>

        {/* Create Post */}
        <div className="card mb-8 p-4 bg-gray-900 border border-gray-800 shadow-xl">
          <form onSubmit={handleCreatePost}>
            <textarea
              className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              placeholder="Co máš na srdci?"
              rows={3}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="btn btn-primary px-8 py-2 rounded-full font-bold transition-transform active:scale-95 disabled:opacity-50"
                disabled={submitting || !newPostContent.trim()}
              >
                {submitting ? "Zveřejňuji..." : "Zveřejnit"}
              </button>
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-900 rounded-3xl border border-dashed border-gray-800">
              <div className="text-4xl mb-4">📭</div>
              <p>Zatím tu nejsou žádné příspěvky. Buď první!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="card p-6 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-purple-500/30">
                    {post.author.avatar ? (
                      <Image src={post.author.avatar} alt={post.author.name} width={48} height={48} className="object-cover" />
                    ) : (
                      post.author.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{post.author.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString("cs-CZ", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
