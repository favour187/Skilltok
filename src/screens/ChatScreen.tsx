import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MessageSquare, Send, CheckCheck, CheckCircle2, ShoppingBag, Package, Loader2, RefreshCw } from 'lucide-react';
import { CustomOfferModal } from '../components/CustomOfferModal';
import { BackendService } from '../utils/api';

interface BackendMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
  sender_username: string;
  is_read: boolean;
}

interface BackendConversation {
  other_user_id: string;
  other_user_name: string;
  other_user_username: string;
  other_user_avatar: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const ChatScreen: React.FC = () => {
  const { user, sendMessage } = useAppStore();
  const [conversations, setConversations] = useState<BackendConversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BackendMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCustomOffer, setShowCustomOffer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeConv = conversations.find(c => c.other_user_id === activeUserId);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await BackendService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
      if (!activeUserId && data.length > 0) {
        setActiveUserId(data[0].other_user_id);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  }, [activeUserId]);

  // Load messages for active thread
  const loadMessages = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoadingMsgs(true);
    try {
      const data = await BackendService.getThread(userId);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeUserId) return;
    loadMessages(activeUserId);

    // Poll for new messages every 4 seconds
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(activeUserId), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUserId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic message
    const tempMsg: BackendMessage = {
      id: 'temp-' + Date.now(),
      sender_id: user?.id || '',
      receiver_id: activeUserId,
      content: text,
      created_at: new Date().toISOString(),
      sender_name: user?.name || '',
      sender_avatar: user?.avatar || '',
      sender_username: user?.username || '',
      is_read: false,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const saved = await BackendService.sendMessage(activeUserId, text);
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...saved, sender_name: user?.name || '', sender_avatar: user?.avatar || '', sender_username: user?.username || '' } : m));
      // Refresh conversations to update last message
      loadConversations();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-20 lg:pb-0 pt-4 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col md:flex-row shadow-2xl">

        {/* Conversations Sidebar */}
        <div className="w-full md:w-80 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
              <h2 className="font-extrabold text-base text-white">Direct Messages</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadConversations} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="bg-slate-800 text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                Encrypted
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loadingConvs ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.other_user_id === activeUserId;
                return (
                  <div
                    key={conv.other_user_id}
                    onClick={() => setActiveUserId(conv.other_user_id)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 border-l-4 border-cyan-500 text-white'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.other_user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.other_user_name}`}
                        alt={conv.other_user_name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-800"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs truncate text-slate-100">{conv.other_user_name}</span>
                        <span className="text-[10px] text-slate-500">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate font-light">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-cyan-500 text-slate-950 rounded-full font-black text-[10px] flex items-center justify-center flex-shrink-0 animate-pulse">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Chat Thread */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-slate-950/50 min-w-0 h-full">
            {/* Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeConv.other_user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${activeConv.other_user_name}`}
                  alt={activeConv.other_user_name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white">{activeConv.other_user_name}</h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                  </div>
                  <span className="text-[10px] text-slate-400">@{activeConv.other_user_username}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-cyan-300 flex items-center gap-1.5 border border-slate-700">
                  <ShoppingBag className="w-3.5 h-3.5" /> Book Gig
                </button>
                {user?.role !== 'buyer' && (
                  <button
                    onClick={() => setShowCustomOffer(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/30 rounded-xl text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-all"
                  >
                    <Package className="w-3.5 h-3.5" /> Send Offer
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-center text-xs text-cyan-300 max-w-md mx-auto">
                🔒 Keep all communication and payments within SkillTok for your protection.
              </div>
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <img src={msg.sender_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender_name}`} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
                      )}
                      <div className={`max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-medium rounded-br-sm'
                          : 'bg-slate-800 text-white rounded-bl-sm border border-slate-700/80'
                      }`}>
                        <p>{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 text-[9px] ${isMe ? 'text-slate-900 justify-end' : 'text-slate-400'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Quick Replies */}
            <div className="px-3 pt-2 bg-slate-900/90 flex gap-2 overflow-x-auto border-t border-slate-800/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">🤖 AI:</span>
              {['Thanks for reaching out!', 'Yes, I can deliver in 3 days ⏰', 'Let me check and get back to you', 'Sounds great! 🎯', 'Please share the brief details 📋'].map(s => (
                <button key={s} type="button" onClick={() => setInputText(s)}
                  className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-bold whitespace-nowrap flex-shrink-0">
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 rounded-2xl font-bold disabled:opacity-40 active:scale-95 transition-all"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center space-y-2">
              <MessageSquare className="w-16 h-16 mx-auto opacity-20" />
              <p className="text-sm">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
      <CustomOfferModal open={showCustomOffer} onClose={() => setShowCustomOffer(false)} recipientId={activeUserId || ''} recipientName={activeConv?.other_user_name || 'Client'} />
    </div>
  );
};
