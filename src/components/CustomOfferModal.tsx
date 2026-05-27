import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/feeCalculator';
import { X, Send, Package, Clock, RefreshCw, DollarSign, FileText, CheckCircle2, Zap } from 'lucide-react';

interface CustomOfferModalProps {
  open: boolean;
  onClose: () => void;
  recipientName?: string;
}

export const CustomOfferModal: React.FC<CustomOfferModalProps> = ({ open, onClose, recipientName = 'Client' }) => {
  const { user, activeChatConversationId, sendMessage } = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [revisions, setRevisions] = useState('2');
  const [milestones, setMilestones] = useState([{ title: '', percentage: 50 }]);
  const [step, setStep] = useState<'details' | 'milestones' | 'preview'>('details');
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const priceCents = Math.round(parseFloat(priceDollars || '0') * 100);
  const buyerFee = Math.round(priceCents * 0.05);
  const buyerTotal = priceCents + buyerFee;

  const isDetailsValid = title.trim() && description.trim() && priceDollars && deliveryDays;

  const handleSend = () => {
    if (!isDetailsValid || !activeChatConversationId) return;
    const offerMsg = `📦 **Custom Offer**\n\n**${title}**\n${description}\n\n💰 Price: ${formatCurrency(priceCents)}\n⏱ Delivery: ${deliveryDays} day(s)\n🔄 Revisions: ${revisions}\n\n_Buyer pays ${formatCurrency(buyerTotal)} (inc. 5% fee). This offer expires in 48 hours._`;
    sendMessage(activeChatConversationId, offerMsg, 'u-100');
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); setTitle(''); setDescription(''); setPriceDollars(''); setDeliveryDays(''); setStep('details'); }, 2000);
  };

  const addMilestone = () => setMilestones(prev => [...prev, { title: '', percentage: 0 }]);
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, field: 'title' | 'percentage', value: string | number) =>
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" /> Send Custom Offer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Create a tailored proposal for {recipientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex border-b border-slate-800">
          {['details', 'milestones', 'preview'].map((s, i) => (
            <button
              key={s}
              onClick={() => isDetailsValid && setStep(s as any)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${step === s ? 'text-cyan-400 bg-cyan-500/5 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
          {sent ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-black text-lg text-white">Offer Sent!</h3>
              <p className="text-sm text-slate-400">Your custom proposal has been delivered to {recipientName}.</p>
            </div>
          ) : step === 'details' ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Offer Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Custom Landing Page with Animation"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Scope Description *</label>
                <textarea
                  placeholder="Describe exactly what you will deliver, including specific requirements..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Price (USD) *
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="5"
                    value={priceDollars}
                    onChange={e => setPriceDollars(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Delivery Days *
                  </label>
                  <input
                    type="number"
                    placeholder="7"
                    min="1"
                    value={deliveryDays}
                    onChange={e => setDeliveryDays(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Revisions
                  </label>
                  <select
                    value={revisions}
                    onChange={e => setRevisions(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    {['1','2','3','5','Unlimited'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {priceCents > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Your earnings (after 5% platform fee)</span>
                    <span className="font-bold text-white">{formatCurrency(priceCents - Math.round(priceCents * 0.05))}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Client pays (inc. 5% buyer protection)</span>
                    <span>{formatCurrency(buyerTotal)}</span>
                  </div>
                </div>
              )}
            </>
          ) : step === 'milestones' ? (
            <>
              <p className="text-sm text-slate-400">Break the project into payment milestones. Each milestone releases funds from escrow upon approval.</p>
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-3 items-start bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder={`Milestone ${i + 1} description (e.g. Design mockups)`}
                        value={m.title}
                        onChange={e => updateMilestone(i, 'title', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="range" min={10} max={100} step={5}
                          value={m.percentage}
                          onChange={e => updateMilestone(i, 'percentage', parseInt(e.target.value))}
                          className="flex-1 accent-cyan-500"
                        />
                        <span className="text-xs font-black text-cyan-400 w-12 text-right">{m.percentage}% = {formatCurrency(Math.round(priceCents * m.percentage / 100))}</span>
                      </div>
                    </div>
                    {milestones.length > 1 && (
                      <button onClick={() => removeMilestone(i)} className="text-slate-500 hover:text-rose-400 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addMilestone}
                className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-sm font-bold text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                + Add Milestone
              </button>
            </>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  <span className="font-black text-white">{title}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
                <div className="flex flex-wrap gap-4 text-sm font-bold text-white">
                  <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-700">
                    <DollarSign className="w-4 h-4 text-emerald-400" />{formatCurrency(priceCents)}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-700">
                    <Clock className="w-4 h-4 text-cyan-400" />{deliveryDays} days
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-700">
                    <RefreshCw className="w-4 h-4 text-indigo-400" />{revisions} revisions
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs text-slate-400">
                ⏰ This offer expires in <span className="font-bold text-white">48 hours</span>. Client will be notified by email.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="flex items-center justify-between p-6 border-t border-slate-800">
            <button
              onClick={() => step === 'details' ? onClose() : setStep(step === 'milestones' ? 'details' : 'milestones')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-300 transition-all"
            >
              {step === 'details' ? 'Cancel' : '← Back'}
            </button>

            {step !== 'preview' ? (
              <button
                onClick={() => setStep(step === 'details' ? 'milestones' : 'preview')}
                disabled={!isDetailsValid}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-sm disabled:opacity-40 transition-all flex items-center gap-2"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSend}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Send className="w-4 h-4" /> Send Offer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
