"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/common/Modal";
import { Smile, Image as ImageIcon, Gift, X, Search, Loader2 } from "lucide-react";

interface PostComposerProps {
  user: any;
  onPostCreated: (post: any) => void;
}

const EMOJIS = ["😀", "😍", "😂", "🙌", "🔥", "✨", "🥑", "🚀", "💡", "🎮", "🎬", "🎵", "❤️", "👍", "🍕", "👔", "💼", "🛠️", "📈", "📅", "📍", "🎉", "🎁", "📱", "💻", "☁️", "🌍", "🔐", "🔒", "🔑"];

export function PostComposer({ user, onPostCreated }: PostComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchTerm, setGifSearchTerm] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showGifPicker && gifSearchTerm.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchGifs(gifSearchTerm);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else if (showGifPicker && gifSearchTerm.length === 0) {
      fetchTrendingGifs();
    }
  }, [gifSearchTerm, showGifPicker]);

  async function fetchTrendingGifs() {
    setLoadingGifs(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=12`);
      const data = await res.json();
      setGifs(data.data || []);
    } finally {
      setLoadingGifs(false);
    }
  }

  async function searchGifs(term: string) {
    setLoadingGifs(true);
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(term)}&limit=12`);
      const data = await res.json();
      setGifs(data.data || []);
    } finally {
      setLoadingGifs(false);
    }
  }

  async function handleSubmit() {
    if (!content.trim() && !selectedGif) return;
    setSubmitting(true);
    
    // Merge GIF into content if present for simplicity in this MVP
    // Better way would be a separate media field, but merging as markdown/URL is faster for now
    let finalContent = content;
    if (selectedGif) {
      finalContent += `\n\n![GIF](${selectedGif})`;
    }

    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: finalContent }),
      });

      if (res.ok) {
        const newPost = await res.json();
        onPostCreated(newPost);
        setContent("");
        setSelectedGif(null);
        setIsOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function addEmoji(emoji: string) {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  }

  return (
    <div className="mb-4">
      {/* Trigger Bar (Fake Input) */}
      <div 
        className="card cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(true)}
        style={{ borderRadius: 'var(--radius-lg)', padding: '12px 16px' }}
      >
        <div className="flex items-center gap-3">
          <div className="user-avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : user?.name.charAt(0).toUpperCase()}
          </div>
          <div 
            className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-slate-500 text-sm font-medium"
          >
            Napiš něco hezkého...
          </div>
        </div>
      </div>

      {/* Main Composer Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Vytvořit příspěvek"
        maxWidth={550}
        footer={
          <button 
            className="btn btn-primary w-full py-3 text-base shadow-lg"
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && !selectedGif)}
          >
            {submitting ? <Loader2 className="animate-spin inline-block mr-2" /> : "Zveřejnit"}
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="user-avatar" style={{ width: 44, height: 44, flexShrink: 0 }}>
              {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-800">{user?.name}</div>
              <div className="text-xs text-muted flex items-center gap-1">
                🌍 Veřejný příspěvek
              </div>
            </div>
          </div>

          <textarea 
            ref={textareaRef}
            className="w-full text-lg border-none focus:ring-0 p-0 min-h-[160px] resize-none placeholder:text-slate-300"
            placeholder="O čem dnes přemýšlíš?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />

          {selectedGif && (
            <div className="relative rounded-xl overflow-hidden animate-zoom-in">
              <img src={selectedGif} alt="Selected GIF" className="w-full h-auto max-h-[300px] object-contain bg-slate-100" />
              <button 
                onClick={() => setSelectedGif(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Action Tools */}
          <div className="p-3 border rounded-xl border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400 pl-2">Přidat k příspěvku</span>
            <div className="flex gap-1">
              <button 
                className={`p-2 rounded-lg hover:bg-slate-50 transition-colors text-yellow-500 ${showEmojiPicker ? 'bg-slate-100 scale-110' : ''}`}
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); setSelectedGif(null); }}
                title="Smajlíky"
              >
                <Smile size={22} />
              </button>
              <button 
                className={`p-2 rounded-lg hover:bg-slate-50 transition-colors text-teal-500 ${showGifPicker ? 'bg-slate-100 scale-110' : ''}`}
                onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); setSelectedGif(null); }}
                title="GIF"
              >
                <Gift size={22} />
              </button>
            </div>
          </div>

          {/* Emoji Picker Subgrid */}
          {showEmojiPicker && (
            <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-7 sm:grid-cols-10 gap-2 animate-slide-up">
              {EMOJIS.map(e => (
                <button 
                  key={e} 
                  className="text-2xl p-1.5 hover:bg-white rounded-lg transition-all hover:scale-125 hover:shadow-sm"
                  onClick={() => addEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* GIF Picker Subgrid */}
          {showGifPicker && (
            <div className="flex flex-col gap-3 animate-slide-up">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Hledat GIF..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-100 bg-slate-50 focus:bg-white text-sm"
                  value={gifSearchTerm}
                  onChange={(e) => setGifSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                {loadingGifs ? (
                  <div className="col-span-2 py-8 flex justify-center"><Loader2 className="animate-spin text-brand-500" /></div>
                ) : (
                  gifs.map(g => (
                    <button 
                      key={g.id} 
                      className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-slate-100 aspect-video"
                      onClick={() => { setSelectedGif(g.images.fixed_height.url); setShowGifPicker(false); }}
                    >
                      <img src={g.images.fixed_height_small.url} alt="GIF" className="w-full h-full object-cover" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes zoom-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in { animation: zoom-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}
