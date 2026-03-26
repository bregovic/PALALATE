"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/lib/hooks/useAuth";
import { PostComposer } from "@/components/social/PostComposer";
import { Trash2, Heart, MessageSquare, Send, MoreHorizontal, Loader2 } from "lucide-react";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  likedByMe?: boolean;
  _count: {
    likes: number;
    comments: number;
  };
}

export default function WallPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (authLoading || loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>Načítám nástěnku...</div>;
  }

  return (
    <DashboardShell user={user} pendingRequests={0} unreadNotifs={0}>
      <div className="page-content animate-fade-in social-layout">
        <div className="feed-container">
          
          <div className="feed-main">
            <div className="page-header wall-header" style={{ marginBottom: 16 }}>
              <div>
                <h1 className="page-title">Nástěnka</h1>
                <p className="page-subtitle">Sdílej novinky a zajímavosti se svými přáteli 🥑</p>
              </div>
            </div>

            {/* Redesigned Composer */}
            <PostComposer 
              user={user} 
              onPostCreated={(newPost) => setPosts([newPost, ...posts])} 
            />

            {/* Posts Feed */}
            <div className="flex flex-col gap-3">
              {posts.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-icon text-5xl mb-4">📮</div>
                  <div className="empty-title text-xl font-bold">Zatím tu nic není</div>
                  <p className="empty-desc text-muted mt-2">Zkus napsat první příspěvek a oslovit své kontakty!</p>
                </div>
              ) : (
                posts.map((post: any) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={user} 
                    onDelete={() => setPosts(prev => prev.filter(p => p.id !== post.id))}
                  />
                ))
              )}
            </div>
          </div>

          <div className="feed-side hidden lg:block">
             {/* Spacers removed but kept side for grid layout stability */}
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}

function PostCard({ post: initialPost, currentUser, onDelete }: { post: any, currentUser: any, onDelete: () => void }) {
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleLike() {
    setIsLiking(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}/like`, { method: "POST" });
      if (res.ok) {
        const { liked } = await res.json();
        setPost((prev: any) => ({
          ...prev,
          likedByMe: liked,
          _count: {
            ...prev._count,
            likes: liked ? prev._count.likes + 1 : prev._count.likes - 1
          }
        }));
      }
    } finally {
      setIsLiking(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const comment = await res.json();
        setPost((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), comment],
          _count: { ...prev._count, comments: (prev._count.comments || 0) + 1 }
        }));
        setNewComment("");
      }
    } finally {
      setIsCommenting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Opravdu smazat příspěvek?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) onDelete();
    } finally {
      setIsDeleting(false);
    }
  }

  // Simple renderer to handle Markdown-like GIF tags: ![GIF](url)
  const renderContent = (text: string) => {
    const parts = text.split(/(!\[GIF\]\(.*?\))/);
    return parts.map((part, i) => {
      const gifMatch = part.match(/!\[GIF\]\((.*?)\)/);
      if (gifMatch) {
         return (
           <div key={i} className="my-3 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm transition-transform hover:scale-[1.01] duration-300">
             <img src={gifMatch[1]} alt="Post GIF" className="w-full h-auto max-h-[400px] object-contain" loading="lazy" />
           </div>
         );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="card transition-all hover:bg-slate-50/10 group mb-0" style={{ borderRadius: 'var(--radius-lg)', opacity: isDeleting ? 0.5 : 1 }}>
      <div className="card-body p-4 sm:p-6">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div className="user-avatar" style={{ width: 44, height: 44, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {post.author.avatar ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : post.author.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-800" style={{ fontSize: '0.95rem' }}>{post.author.name}</div>
            <div className="text-xs text-muted flex items-center gap-1">
              {new Date(post.createdAt).toLocaleDateString("cs-CZ", {
                day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
              })}
            </div>
          </div>
          {(post.authorId === currentUser?.id || currentUser?.role === 'ADMIN') && (
            <button className="btn btn-ghost btn-icon btn-sm text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
        
        <div className="text-slate-700 sm:text-lg leading-relaxed whitespace-pre-wrap break-words px-1">
          {renderContent(post.content)}
        </div>

        <div className="divider opacity-50 my-4" />
        
        <div className="flex gap-4">
          <button 
            className={`btn btn-ghost btn-sm px-4 rounded-full flex items-center gap-2 transition-all ${post.likedByMe ? 'bg-red-50 text-red-500 shadow-sm hover:bg-red-100' : 'text-slate-500 hover:bg-slate-100'}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart size={18} fill={post.likedByMe ? "currentColor" : "none"} strokeWidth={post.likedByMe ? 0 : 2} />
            <span className="font-bold">{post._count?.likes || 0}</span>
          </button>
          
          <button 
            className={`btn btn-ghost btn-sm px-4 rounded-full flex items-center gap-2 transition-all ${showComments ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-100'}`}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare size={18} strokeWidth={2} />
            <span className="font-bold">{post._count?.comments || 0}</span>
          </button>
        </div>

        {showComments && (
          <div className="mt-5 animate-slide-up bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-col gap-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              {post.comments?.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 italic">Zatím žádné komentáře. Budeš první? 👋</div>
              ) : (
                post.comments?.map((c: any) => (
                  <div key={c.id} className="flex gap-3 animate-slide-in">
                    <div className="user-avatar" style={{ width: 32, height: 32, flexShrink: 0, fontSize: '0.8rem' }}>
                      {c.user.avatar ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : c.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-100" style={{ borderRadius: '0 16px 16px 16px' }}>
                      <div className="font-bold text-xs text-slate-800 mb-1">{c.user.name}</div>
                      <div className="text-sm text-slate-700">{c.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleComment} className="flex gap-2 relative mt-2">
              <input 
                className="form-input flex-1 pr-10 border-slate-200 focus:border-brand-300" 
                placeholder="Přidat komentář..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ borderRadius: 'var(--radius-full)', background: 'white', padding: '10px 16px' }}
              />
              <button 
                className="btn btn-primary btn-sm btn-icon rounded-full absolute right-1 top-1 w-9 h-9" 
                disabled={!newComment.trim() || isCommenting}
              >
                {isCommenting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
