import React, { useState } from 'react';
import { Send, X, ArrowRight, Loader2, CheckCircle2, User } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const WalletTransfer: React.FC<Props> = ({ open, onClose }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSend = () => {
    if (!recipient.trim() || !amount || parseFloat(amount) <= 0) {
      alert('Please enter recipient email/@username and a valid amount');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setRecipient(''); setAmount(''); setNote('');
        onClose();
      }, 2500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Send Money (Wallet-to-Wallet)</h2>
              <p className="text-[11px] text-slate-400">Instant transfer to any SkillTok user — 0% fees</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-white">Transfer Sent! ✅</h3>
            <p className="text-xs text-slate-300">${amount} delivered to {recipient}</p>
            <p className="text-[10px] text-slate-500">Reference: ST-WALLET-{Date.now().toString().slice(-6)}</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Balance */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Your Wallet Balance</span>
              <p className="text-2xl font-black text-emerald-400">$0.00</p>
              <p className="text-[10px] text-slate-500">Top up via Paystack to send money</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Recipient</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="@username or friend@gmail.com" value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                <input type="number" min="1" placeholder="0.00" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500" />
              </div>
              {amount && parseFloat(amount) > 0 && (
                <p className="text-[10px] text-slate-400 mt-1">≈ ₦{(parseFloat(amount) * 1650).toLocaleString()}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Note (Optional)</label>
              <input type="text" placeholder="For your design work 💖" value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300">
              💡 Wallet transfers are instant and free. No escrow needed for trusted contacts.
            </div>

            <button onClick={handleSend} disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20">
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send Money <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
