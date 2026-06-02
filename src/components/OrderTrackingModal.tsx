import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/feeCalculator';
import {
  X, CheckCircle2, Clock, Upload, AlertTriangle, Package, Star,
  MessageSquare, FileText, Shield, Zap, ArrowRight, Download, ExternalLink
} from 'lucide-react';

interface OrderTrackingModalProps {
  open: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ open, onClose }) => {
  const { transactions, services, user, deliverOrder, approveOrder, disputeOrder, setTab } = useAppStore();
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  if (!open) return null;

  const userTxs = transactions.filter(t => t.buyerId === user?.id || t.sellerId === user?.id);
  const activeTx = selectedTx ? transactions.find(t => t.id === selectedTx) : userTxs[0];

  const getMilestones = (status: string) => [
    { id: 'placed',    label: 'Order Placed',      icon: Package,    done: true, date: activeTx?.createdAt?.split(' ')[0] || 'Today' },
    { id: 'escrow',    label: 'Funds in Escrow',   icon: Shield,     done: true, date: activeTx?.createdAt?.split(' ')[0] || 'Today' },
    { id: 'progress',  label: 'In Progress',        icon: Zap,        done: ['delivered', 'completed', 'disputed'].includes(status), date: 'Ongoing' },
    { id: 'delivered', label: 'Delivered',          icon: Upload,     done: ['delivered', 'completed'].includes(status), date: activeTx?.deliveredAt?.split(' ')[0] || '—' },
    { id: 'approved',  label: 'Order Complete',     icon: CheckCircle2, done: status === 'completed', date: status === 'completed' ? 'Done' : '—' },
  ];

  const statusColors: Record<string, string> = {
    pending:   'text-amber-400 bg-amber-400/10 border-amber-400/30',
    delivered: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    disputed:  'text-rose-400 bg-rose-400/10 border-rose-400/30',
    refunded:  'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
  };

  const statusLabels: Record<string, string> = {
    pending: 'In Progress', delivered: 'Awaiting Approval', completed: 'Completed', disputed: 'In Dispute', refunded: 'Refunded'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" /> Order Tracking
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Monitor all your active and completed orders</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Orders list sidebar */}
          <div className="w-56 border-r border-slate-800 overflow-y-auto flex-shrink-0 bg-slate-900/50">
            {userTxs.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">No orders yet.</div>
            ) : userTxs.map(tx => {
              const isActive = (selectedTx || userTxs[0]?.id) === tx.id;
              return (
                <button
                  key={tx.id}
                  onClick={() => setSelectedTx(tx.id)}
                  className={`w-full p-4 text-left border-b border-slate-800/60 transition-all ${isActive ? 'bg-cyan-500/10 border-l-2 border-l-cyan-500' : 'hover:bg-slate-800/50'}`}
                >
                  <div className="text-xs font-bold text-slate-200 truncate leading-tight">{tx.serviceTitle}</div>
                  <div className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex ${statusColors[tx.status]}`}>
                    {statusLabels[tx.status]}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{formatCurrency(tx.basePriceCents)}</div>
                </button>
              );
            })}
          </div>

          {/* Order detail */}
          {activeTx ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Order header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h3 className="font-black text-base text-white leading-tight">{activeTx.serviceTitle}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>Order #{activeTx.id}</span>
                    <span>•</span>
                    <span>{activeTx.createdAt}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex-shrink-0 ${statusColors[activeTx.status]}`}>
                  {statusLabels[activeTx.status]}
                </span>
              </div>

              {/* Milestone timeline */}
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-5">Order Timeline</h4>
                <div className="space-y-0">
                  {getMilestones(activeTx.status).map((milestone, i, arr) => {
                    const Icon = milestone.icon;
                    return (
                      <div key={milestone.id} className="flex gap-4 relative">
                        {/* Vertical line */}
                        {i < arr.length - 1 && (
                          <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${milestone.done ? 'bg-cyan-500/50' : 'bg-slate-800'}`} style={{ height: '40px' }} />
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${milestone.done ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="pb-6 flex-1">
                          <div className={`font-bold text-sm ${milestone.done ? 'text-white' : 'text-slate-500'}`}>{milestone.label}</div>
                          <div className="text-xs text-slate-500">{milestone.date}</div>
                          {milestone.id === 'delivered' && activeTx.deliveryNotes && (
                            <div className="mt-2 p-3 bg-slate-800 rounded-xl text-xs text-slate-300 border border-slate-700">
                              <span className="font-bold text-slate-200">Seller note: </span>{activeTx.deliveryNotes}
                            </div>
                          )}
                          {milestone.id === 'delivered' && activeTx.deliveryProofUrl && (
                            <a href={activeTx.deliveryProofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" /> View Delivery Proof
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial summary */}
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Payment Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Service Price</span><span className="font-bold text-white">{formatCurrency(activeTx.basePriceCents)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Buyer Protection Fee (5%)</span><span>{formatCurrency(activeTx.buyerFeeCents)}</span>
                  </div>
                  <div className="flex justify-between font-black text-white border-t border-slate-800 pt-2 mt-2">
                    <span>Total Paid</span><span>{formatCurrency(activeTx.basePriceCents + activeTx.buyerFeeCents)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  Funds are held in escrow until you approve the delivery.
                </div>
              </div>

              {/* Buyer actions */}
              {activeTx.status === 'delivered' && activeTx.buyerId === user?.id && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Your Action Required</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => approveOrder(activeTx.id)}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Release Payment
                    </button>
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      className="flex-1 py-3 bg-slate-800 border border-rose-500/30 text-rose-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all"
                    >
                      <AlertTriangle className="w-4 h-4" /> Raise a Dispute
                    </button>
                  </div>
                  {showDisputeForm && (
                    <div className="space-y-3 bg-slate-950/60 border border-rose-500/20 rounded-2xl p-4">
                      <h5 className="text-sm font-bold text-rose-400">Resolution Center</h5>
                      <textarea
                        value={disputeReason}
                        onChange={e => setDisputeReason(e.target.value)}
                        placeholder="Describe your issue in detail (e.g. deliverable doesn't match requirements, missing features...)"
                        rows={3}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { disputeOrder(activeTx.id, disputeReason); setShowDisputeForm(false); }}
                          disabled={!disputeReason.trim()}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl disabled:opacity-40 transition-all"
                        >
                          Submit Dispute
                        </button>
                        <button onClick={() => setShowDisputeForm(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-700 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Review CTA if completed */}
              {activeTx.status === 'completed' && activeTx.buyerId === user?.id && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-amber-300">Leave a Review</div>
                    <div className="text-xs text-slate-400 mt-0.5">Your feedback helps other buyers make informed decisions.</div>
                  </div>
                  <button className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-sm rounded-xl hover:bg-amber-500/20 flex items-center gap-2 transition-all flex-shrink-0">
                    <Star className="w-4 h-4" /> Rate & Review
                  </button>
                </div>
              )}

              {/* Chat shortcut */}
              <button
                onClick={() => { onClose(); setTab('chat'); }}
                className="w-full py-3 border border-slate-700 hover:border-indigo-500/40 rounded-xl text-sm font-bold text-slate-300 hover:text-indigo-300 flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4" /> Message Seller About This Order
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select an order to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
