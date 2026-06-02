import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, MessageCircle, Send, Heart, Loader2 } from 'lucide-react';
import { BackendService } from '../utils/api';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
}

export const CommentsModal: React.FC = () => {
  const { activeVideoForComments, setActiveVideoForComments, user } = useAppStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load comments from backend when modal opens
  useEffect(() => {
    if (!activeVideoForComments) { setComments([]); return; }
    setLoading(true);
    BackendService.getComments(activeVideoForComments.id)
      .then((data: any[]) => {
        setComments(data.map(c => ({
          id: c.id,
          userId: c.user_id || c.userId || '',
          userName: c.user_name || c.userName || 'User',
          userUsername: c.user_username || c.userUsername || '',
          userAvatar: c.user_avatar || c.userAvatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${c.user_name || 'user'}&backgroundColor=06b6d4`,
          content: c.content || '',
          createdAt: c.created_at
            ? new Date(c.created_at).toLocaleString()
            : 'Just now',
          likes: Number(c.likes) || 0,
        })));
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [activeVideoForComments?.id]);

  // Auto-scroll to bottom when new comment added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  if (!activeVideoForComments) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || submitting || !user) return;
    setText('');
    setSubmitting(true);

    // Optimistic comment
    const tempId = 'temp-' + Date.now();
    const temp: Comment = {
      id: tempId,
      userId: user.id,
      userName: user.name,
      userUsername: user.username,
      userAvatar: user.avatar,
      content,
      createdAt: 'Just now',
      likes: 0,
    };
    setComments(prev => [temp, ...prev]);

    try {
      const saved = await BackendService.addComment(activeVideoForComments.id, content);
      // Replace temp with real saved comment
      setComments(prev => prev.map(c =>
        c.id === tempId
          ? {
              id: saved.id,
              userId: saved.user_id || user.id,
              userName: saved.user_name || user.name,
              userUsername: saved.user_username || user.username,
              userAvatar: saved.user_avatar || user.avatar,
              content: saved.content || content,
              createdAt: 'Just now',
              likes: 0,
            }
          : c
      ));
    } catch {
      // Remove temp comment on failure and restore text
      setComments(prev => prev.filter(c => c.id !== tempId));
      setText(content);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[80vh] sm:h-[650px]">

        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base">Comments ({comments.length})</h3>
          </div>
          <button
            onClick={() => setActiveVideoForComments(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <MessageCircle className="w-12 h-12 opacity-30" />
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3 pt-3 first:pt-0 border-t first:border-t-0 border-slate-800/60">
                <img
                  src={c.userAvatar}
                  alt={c.userName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-cyan-500/30 flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-xs text-slate-200 truncate">{c.userName}</span>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">{c.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 break-words leading-relaxed">{c.content}</p>
                  <button className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400 hover:text-rose-400 transition-colors">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{c.likes}</span>
                  </button>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-800 flex items-center gap-2 flex-shrink-0 bg-slate-800/50"
        >
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=user&backgroundColor=06b6d4`}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-cyan-500/50 flex-shrink-0"
            alt=""
          />
          <input
            type="text"
            placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={!user}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting || !user}
            className="p-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-40 active:scale-95"
          >
            {submitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </form>
      </div>
    </div>
  );
};
