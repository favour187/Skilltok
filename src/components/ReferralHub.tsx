import React, { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, Sparkles, Share2, MessageCircle, Mail } from 'lucide-react';
import { Referral, ReferralData } from '../utils/referral';
import { useAppStore } from '../store/useAppStore';

export const ReferralHub: React.FC = () => {
  const { user } = useAppStore();
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  useEffect(() => {
    if (user) setData(Referral.getMyData(user.id, user.name));
  }, [user]);

  if (!user || !data) return null;

  const shareLink = Referral.getShareLink(data.myCode);
  const shareMsg = Referral.getShareMessage(data.myCode);

  const copyCode = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvite = () => {
    if (!inviteEmail.trim()) {
      setInviteMsg('Please enter a friend\'s email');
      return;
    }
    const result = Referral.inviteFriend(user.id, user.name, inviteEmail);
    setInviteMsg(result.message);
    if (result.success) {
      setInviteEmail('');
      setData(Referral.getMyData(user.id, user.name));
      setTimeout(() => setInviteMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="p-6 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-cyan-900/40 rounded-3xl border-2 border-emerald-500/30 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl">
            <Gift className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Earn ₦500 Per Friend 🎁</h2>
            <p className="text-xs text-slate-300">Invite friends — they get ₦500 welcome bonus, you get ₦500 when they complete their first order</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <Users className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-2xl font-black text-white block">{data.totalReferred}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Friends Referred</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-emerald-500/30">
            <Gift className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-2xl font-black text-emerald-400 block">₦{(data.totalEarnedNgn ?? 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Earned</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-2xl font-black text-amber-400 block">{data.loyaltyPoints}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Loyalty Points</span>
          </div>
        </div>
      </div>

      {/* Your Referral Code */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">Your Referral Link</label>
        <div className="flex gap-2">
          <code className="flex-1 px-4 py-3 bg-slate-950 border border-cyan-500/30 rounded-xl text-cyan-300 font-mono text-xs break-all">
            {shareLink}
          </code>
          <button onClick={copyCode}
            className="px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5">
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>
        <div className="mt-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Your Unique Code</span>
          <p className="text-lg font-extrabold text-white font-mono">{data.myCode}</p>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Share Anywhere
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank')}
            className="p-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold">
            <MessageCircle className="w-5 h-5" /> WhatsApp
          </button>
          <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMsg)}`, '_blank')}
            className="p-3 bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold">
            <span className="text-base">𝕏</span> Twitter
          </button>
          <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')}
            className="p-3 bg-[#1877F2] hover:bg-[#1565D8] text-white rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold">
            <span className="text-base">f</span> Facebook
          </button>
          <button onClick={() => window.open(`mailto:?subject=Join SkillTok&body=${encodeURIComponent(shareMsg)}`, '_blank')}
            className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold">
            <Mail className="w-5 h-5" /> Email
          </button>
        </div>
      </div>

      {/* Email invite */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Send Direct Invitation</label>
        <div className="flex gap-2">
          <input type="email" placeholder="friend@gmail.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500" />
          <button onClick={sendInvite}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl">
            Invite
          </button>
        </div>
        {inviteMsg && (
          <p className={`text-xs mt-2 font-bold ${inviteMsg.includes('sent') ? 'text-emerald-400' : 'text-rose-400'}`}>
            {inviteMsg}
          </p>
        )}
      </div>

      {/* Invited friends list */}
      {data.invitedFriends.length > 0 && (
        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Invited Friends ({data.invitedFriends.length})</h3>
          <div className="space-y-2">
            {data.invitedFriends.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl text-xs">
                <span className="font-mono text-slate-300 truncate">{f.email}</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  f.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  f.status === 'signed_up' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-700 text-slate-400'
                }`}>{f.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
