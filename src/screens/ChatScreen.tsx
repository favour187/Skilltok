import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MessageSquare, Send, CheckCheck, CheckCircle2, ShoppingBag, Paperclip, Smile, Image as ImageIcon, Package } from 'lucide-react';
import { CustomOfferModal } from '../components/CustomOfferModal';

export const ChatScreen: React.FC = () => {
  const { conversations, messages, sendMessage, activeChatConversationId, setActiveChatConversationId, user } = useAppStore();
  const [inputText, setInputText] = useState('');
  const [showCustomOffer, setShowCustomOffer] = useState(false);

  // Default to first conversation if none selected
  useEffect(() => {
    if (!activeChatConversationId && conversations.length > 0) {
      setActiveChatConversationId(conversations[0].id);
    }
  }, [conversations, activeChatConversationId, setActiveChatConversationId]);

  const activeConv = conversations.find(c => c.id === activeChatConversationId);
  const activeMessages = activeConv ? (messages[activeConv.id] || []) : [];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;
    sendMessage(activeConv.id, inputText.trim(), activeConv.participant.id);
    setInputText('');
  };

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-20 lg:pb-0 pt-4 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Conversations List Sidebar */}
        <div className="w-full md:w-80 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
              <h2 className="font-extrabold text-base text-white">Direct Messages</h2>
            </div>
            <span className="bg-slate-800 text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
              Encrypted
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.map((conv) => {
              const isActive = conv.id === activeChatConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveChatConversationId(conv.id)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-cyan-500/10 border-l-4 border-cyan-500 text-white' 
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={conv.participant.avatar} 
                      alt={conv.participant.name} 
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-800"
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                      conv.participant.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs truncate text-slate-100">{conv.participant.name}</span>
                      <span className="text-[10px] text-slate-500">{conv.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate font-light">{conv.lastMessage}</p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-cyan-500 text-slate-950 rounded-full font-black text-[10px] flex items-center justify-center flex-shrink-0 animate-pulse">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Chat Thread */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-slate-950/50 min-w-0 h-full">
            
            {/* Active Thread Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={activeConv.participant.avatar} 
                  alt={activeConv.participant.name}
                  className="w-10 h-10 rounded-xl object-cover" 
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white">{activeConv.participant.name}</h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                    Online & Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-cyan-300 flex items-center gap-1.5 border border-slate-700">
                  <ShoppingBag className="w-3.5 h-3.5" /> Book Freelance Gig
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

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-center text-xs text-cyan-300 max-w-md mx-auto">
                🔒 Escrow notice: For your protection, keep all communication and payments within SkillTok. Never wire funds outside.
              </div>

              {activeMessages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <img src={msg.senderAvatar} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
                    )}
                    <div className={`max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-md ${
                      isMe 
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-medium rounded-br-sm' 
                        : 'bg-slate-800 text-white rounded-bl-sm border border-slate-700/80'
                    }`}>
                      <p>{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 text-[9px] ${isMe ? 'text-slate-900 justify-end' : 'text-slate-400'}`}>
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-slate-950" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Quick-Reply Suggestions */}
            <div className="px-3 pt-2 bg-slate-900/90 flex gap-2 overflow-x-auto border-t border-slate-800/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">🤖 AI:</span>
              {[
                'Thanks for reaching out!',
                'Yes, I can deliver in 3 days ⏰',
                'Let me check and get back to you',
                'Sounds great! When do you need it? 🎯',
                'Please share the brief details 📋'
              ].map(suggestion => (
                <button key={suggestion} type="button"
                  onClick={() => setInputText(suggestion)}
                  className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-bold whitespace-nowrap flex-shrink-0">
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Chat Input form with file attachments & emoji */}
            <form onSubmit={handleSend} className="p-3 bg-slate-900/90 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {/* File upload */}
                <label className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors" title="Attach file">
                  <input type="file" multiple accept="image/*,video/*,.pdf,.zip,.doc,.docx" className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0 && activeConv) {
                        sendMessage(activeConv.id, `📎 Sent ${files.length} file(s): ${files.map(f => (f as File).name).join(', ')}`, activeConv.participant.id);
                      }
                    }} />
                  <Paperclip className="w-4 h-4" />
                </label>

                {/* Image upload */}
                <label className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors" title="Send image">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && activeConv) {
                        sendMessage(activeConv.id, `🖼️ Image: ${file.name}`, activeConv.participant.id);
                      }
                    }} />
                  <ImageIcon className="w-4 h-4" />
                </label>

                <input
                  type="text"
                  placeholder={`Message ${activeConv.participant.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />

                {/* Quick emoji */}
                <button type="button" onClick={() => setInputText(inputText + '😊')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-amber-400 transition-colors" title="Emoji">
                  <Smile className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-40 hover:opacity-90 active:scale-95 shadow-lg shadow-cyan-500/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Real-time typing indicator simulation */}
              <div className="mt-1 px-2 text-[10px] text-slate-500 h-3">
                {inputText && <span>You are typing...</span>}
              </div>
            </form>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-2">
            <MessageSquare className="w-12 h-12 stroke-1 opacity-30" />
            <p className="text-sm">Select a conversation from the left to start chatting</p>
          </div>
        )}

      </div>
      <CustomOfferModal
        open={showCustomOffer}
        onClose={() => setShowCustomOffer(false)}
        recipientName={activeConv?.participant.name}
      />
    </div>
  );
};
