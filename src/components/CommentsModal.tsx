import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, MessageCircle, Send, Heart } from 'lucide-react';

export const CommentsModal: React.FC = () => {
  const { activeVideoForComments, setActiveVideoForComments, comments, addComment, user } = useAppStore();
  const [newCommentText, setNewCommentText] = useState('');

  if (!activeVideoForComments) return null;

  const videoComments = comments[activeVideoForComments.id] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(activeVideoForComments.id, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-white h-[80vh] sm:h-[650px] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base">Comments ({videoComments.length})</h3>
          </div>
          <button 
            onClick={() => setActiveVideoForComments(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-800/60">
          {videoComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <MessageCircle className="w-12 h-12 stroke-1 opacity-40" />
              <p className="text-sm font-medium">No comments yet. Be the first to start the conversation!</p>
            </div>
          ) : (
            videoComments.map((comment, index) => (
              <div key={comment.id || index} className={`pt-3 first:pt-0 flex gap-3 ${index === 0 ? 'animate-in fade-in slide-in-from-top-2 duration-300' : ''}`}>
                <img 
                  src={comment.userAvatar} 
                  alt={comment.userName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-cyan-500/30 flex-shrink-0 mt-0.5" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-xs text-slate-200">{comment.userName}</span>
                    <span className="text-[10px] text-slate-500">{comment.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 break-words leading-relaxed">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <button className="flex items-center gap-1 hover:text-rose-400 transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="hover:text-slate-200">Reply</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-800/90 border-t border-slate-800 flex items-center gap-2">
          <img 
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'} 
            className="w-8 h-8 rounded-full object-cover ring-1 ring-cyan-500/50 flex-shrink-0" 
            alt="" 
          />
          <input
            type="text"
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="p-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
