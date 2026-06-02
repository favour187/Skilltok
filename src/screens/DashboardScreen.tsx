import React, { useState } from 'react';
import { useTranslation } from '../utils/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/feeCalculator';
import { LayoutDashboard, TrendingUp, CheckCircle2, ArrowUpRight, ShieldCheck, PlusCircle, CreditCard, DollarSign, Wallet, ArrowRight, Loader2, Building2, AlertCircle, Clock, Upload, Check, AlertTriangle, Package, ToggleLeft, ToggleRight, BarChart3, Calendar } from 'lucide-react';

// Mini SVG bar chart component
const EarningsChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full bg-gradient-to-t from-cyan-600 to-teal-400 rounded-t opacity-80 group-hover:opacity-100 transition-all"
            style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            title={`${d.label}: ${formatCurrency(d.value)}`}
          />
          <span className="text-[9px] text-slate-500 font-bold">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const { transactions, services, user, setCreateServiceModalOpen } = useAppStore();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'paystack' | 'crypto'>('paystack');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('0');
  const [isAvailable, setIsAvailable] = useState(true);

  const { deliverOrder, approveOrder, disputeOrder } = useAppStore();
  const [activeFulfillmentModal, setActiveFulfillmentModal] = useState<string | null>(null);
  const [deliveryProofUrl, setDeliveryProofUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Withdrawal destination fields
  const [paystackEmail, setPaystackEmail] = useState(user?.email || '');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('058'); // GTBank default
  const [bankAccountName, setBankAccountName] = useState('');
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState<'polygon' | 'tron' | 'bsc'>('polygon');

  const nigerianBanks = [
    { code: '058', name: 'GTBank' },
    { code: '044', name: 'Access Bank' },
    { code: '033', name: 'United Bank for Africa (UBA)' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '057', name: 'Zenith Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '050', name: 'Ecobank' },
    { code: '221', name: 'Stanbic IBTC' },
    { code: '214', name: 'First City Monument Bank (FCMB)' },
    { code: '076', name: 'Polaris Bank' },
    { code: '032', name: 'Union Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '215', name: 'Unity Bank' },
    { code: '101', name: 'Providus Bank' },
    { code: '999992', name: 'Opay' },
    { code: '100004', name: 'PalmPay' },
    { code: '50211', name: 'Kuda Bank' },
    { code: '50515', name: 'Moniepoint MFB' },
    { code: '999991', name: 'Carbon (Paylater)' }
  ];

  const userTransactions = transactions.filter(t => t.sellerId === (user?.id || 'u-101') || t.buyerId === user?.id || user?.role === 'admin');
  const userServices = services.filter(s => s.creatorId === (user?.id || 'u-101') || user?.role === 'admin');

  const totalGross = userTransactions.reduce((acc, t) => acc + t.basePriceCents, 0);
  const totalSellerFees = userTransactions.reduce((acc, t) => acc + t.sellerFeeCents, 0);
  const netEarnings = totalGross - totalSellerFees;
  const completedOrders = userTransactions.filter(t => t.status === 'completed').length;

  // Dynamic last-8-months chart from real transactions
  const _now = new Date();
  const _chartMonths = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(_now.getFullYear(), _now.getMonth() - 7 + i, 1);
    return { label: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
  });
  const chartData = _chartMonths.map(m => ({
    label: m.label,
    value: userTransactions
      .filter(t => { const td = new Date(t.createdAt); return td.getFullYear() === m.year && td.getMonth() === m.month; })
      .reduce((acc, t) => acc + Math.max(0, t.basePriceCents - t.sellerFeeCents), 0),
  }));
  const _curMonth = chartData[7]?.value ?? 0;
  const _prevMonth = chartData[6]?.value ?? 0;
  const growthPct = _prevMonth > 0 ? Math.round(((_curMonth - _prevMonth) / _prevMonth) * 100) : null;
  const _chartYearLabel = (() => {
    const start = _chartMonths[0];
    const end = _chartMonths[7];
    return start.year === end.year ? String(start.year) : `${start.year}–${end.year}`;
  })();

  const handleWithdrawFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountDollars = parseFloat(payoutAmount);
    if (!amountDollars || amountDollars <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }
    if (amountDollars * 100 > netEarnings) {
      alert(`Insufficient funds. Your available balance is ${formatCurrency(netEarnings)}.`);
      return;
    }

    // Validate destination based on payout method
    if (payoutMethod === 'paystack' && !paystackEmail.trim()) {
      alert('Please enter your Paystack customer email.');
      return;
    }
    if (payoutMethod === 'bank') {
      if (bankAccountNumber.length !== 10) {
        alert('Please enter a valid 10-digit Nigerian account number.');
        return;
      }
      if (!bankAccountName.trim()) {
        alert('Please enter the account holder name.');
        return;
      }
    }
    if (payoutMethod === 'crypto' && cryptoWallet.length < 20) {
      alert('Please enter a valid USDT wallet address.');
      return;
    }

    setIsProcessingPayout(true);
    try {
      const { api } = await import('../utils/api');
      const destination = payoutMethod === 'paystack' 
        ? { email: paystackEmail }
        : payoutMethod === 'bank'
        ? { bankCode, accountNumber: bankAccountNumber, accountName: bankAccountName }
        : { wallet: cryptoWallet, network: cryptoNetwork };

      await api.post('/api/payments/paystack/transfer', {
        amountKobo: Math.round(amountDollars * 100),
        reason: `SkillTok withdrawal — ${user?.name}`,
        method: payoutMethod,
        destination
      });
      setIsProcessingPayout(false);
      setPayoutSuccess(true);
      setTimeout(() => {
        setPayoutSuccess(false);
        setShowPayoutModal(false);
      }, 3000);
    } catch (err: any) {
      setIsProcessingPayout(false);
      alert(`Withdrawal failed: ${err.response?.data?.error || err.message}\n\nPlease verify your destination details.`);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-24 lg:pb-12 px-4 lg:px-8 pt-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <LayoutDashboard className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white truncate">{t('dash.studio')}</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {user?.plan || 'Free'} Tier ({user?.plan === 'agency' ? '3%' : user?.plan === 'pro' ? '4%' : '5%'} Fee)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Manage your freelance gigs, track escrow fulfillment, and withdraw available earnings.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowPayoutModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
            >
              <Wallet className="w-4 h-4" />
              <span>Withdraw Payout</span>
            </button>

            <button
              onClick={() => (window as any).openOrderTracking?.()}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 transition-all border border-slate-700 active:scale-95 whitespace-nowrap"
            >
              <Package className="w-4 h-4 text-cyan-400" />
              <span>Track Orders</span>
            </button>
            <button
              onClick={() => (window as any).openWalletTransfer?.()}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 transition-all border border-slate-700 active:scale-95 whitespace-nowrap"
            >
              💸 <span>Send Money</span>
            </button>

            <button
              onClick={() => setCreateServiceModalOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Gig</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan-500/5 rounded-full group-hover:scale-150 transition-transform" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gross Sales Volume</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-white">{formatCurrency(totalGross)}</span>
              {totalGross > 0 && <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> Live</span>}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Total volume before SkillTok platform fees</p>
          </div>

          <div 
            onClick={() => setShowPayoutModal(true)}
            className="p-6 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 rounded-3xl border border-emerald-500/30 shadow-xl relative overflow-hidden group cursor-pointer hover:border-emerald-500/60 transition-all"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Net Available Earnings</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black uppercase">Withdraw ➔</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-emerald-400">{formatCurrency(netEarnings)}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{netEarnings > 0 ? 'Click to transfer to Paystack, Bank Account, or Crypto' : 'Complete your first order to start earning'}</p>
          </div>

          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active / Completed Orders</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-white">{completedOrders} Completed</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Escrow released & rated</p>
          </div>

          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Services</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-purple-400">{userServices.length} Active Gigs</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Showcasing in Marketplace feed</p>
          </div>

        </div>

        {/* Availability Banner + Earnings Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Availability Toggle */}
          <div className={`p-5 rounded-3xl border shadow-xl flex items-center justify-between gap-4 transition-all ${
            isAvailable ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="font-bold text-sm text-white">Availability Status</span>
              </div>
              <p className={`text-xs mt-1 font-semibold ${isAvailable ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isAvailable ? 'Visible to buyers — accepting orders' : 'Hidden from search — not accepting new orders'}
              </p>
            </div>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className={`flex-shrink-0 transition-all ${isAvailable ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {isAvailable
                ? <ToggleRight className="w-10 h-10" />
                : <ToggleLeft className="w-10 h-10" />
              }
            </button>
          </div>

          {/* Earnings Chart */}
          <div className="lg:col-span-2 p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">Earnings — Last 8 Months</span>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {_chartYearLabel}
              </span>
            </div>
            <EarningsChart data={chartData} />
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-gradient-to-r from-cyan-600 to-teal-400 rounded inline-block" /> Net Earnings</span>
              {growthPct !== null ? (
                <span className={`ml-auto font-bold flex items-center gap-1 ${growthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <ArrowUpRight className="w-3 h-3" />
                  {growthPct >= 0 ? '+' : ''}{growthPct}% vs last month
                </span>
              ) : (
                <span className="ml-auto text-slate-500 text-xs">No prior month data</span>
              )}
            </div>
          </div>
        </div>

        {/* Active Escrow Orders & Anti-Scam Protection Table */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" /> Escrow Fulfillment & Anti-Scam Vault
                </h3>
                <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-500/30">
                  Escrow Guarantee Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                🔒 Orders are protected by timestamped Proof of Delivery and automatic 3-day release timers.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:block">{t('dash.totalOrders')}: {userTransactions.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 uppercase font-extrabold text-[10px] text-slate-300 tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Order ID / Date</th>
                  <th className="p-4">Service Gig</th>
                  <th className="p-4">Buyer / Seller</th>
                  <th className="p-4">Base Amount</th>
                  <th className="p-4">Escrow Status</th>
                  <th className="p-4">Anti-Scam Timer / Proof</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {userTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No active escrow transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  userTransactions.map((tx) => {
                    const isBuyer = tx.buyerId === user?.id;
                    const isSeller = tx.sellerId === user?.id;
                    
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-cyan-300 block">{tx.id}</span>
                          <span className="text-[10px] text-slate-500">{tx.createdAt}</span>
                        </td>
                        <td className="p-4 font-bold text-white max-w-xs truncate">{tx.serviceTitle}</td>
                        <td className="p-4">
                          <span className="text-slate-200 block truncate">Buyer: {tx.buyerName}</span>
                          <span className="text-[10px] text-slate-400 block truncate">Seller: {tx.sellerName}</span>
                        </td>
                        <td className="p-4 font-black text-emerald-400">{formatCurrency(tx.basePriceCents)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            tx.status === 'delivered' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                            tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            tx.status === 'disputed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-400' : tx.status === 'delivered' ? 'bg-indigo-400' : 'bg-amber-400 animate-pulse'}`} />
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {tx.status === 'delivered' ? (
                            <div>
                              <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono block mb-1">
                                Proof: {tx.deliveryProofUrl?.substring(0, 20)}...
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" /> Auto-Release in 3 Days
                              </span>
                            </div>
                          ) : tx.status === 'completed' ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" /> Released to Seller
                            </span>
                          ) : tx.status === 'disputed' ? (
                            <span className="text-[10px] text-rose-400 flex items-center gap-1 font-bold">
                              <AlertTriangle className="w-3 h-3 text-rose-400" /> {tx.disputeReason}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Awaiting Delivery Proof</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Seller Action: Submit Delivery Proof */}
                            {(isSeller || user?.role === 'admin') && tx.status === 'pending' && (
                              <button
                                onClick={() => setActiveFulfillmentModal(tx.id)}
                                className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl flex items-center gap-1 hover:opacity-90 transition-all text-xs"
                              >
                                <Upload className="w-3.5 h-3.5" /> Submit Delivery
                              </button>
                            )}

                            {/* Buyer Action: Accept Delivery or Dispute */}
                            {(isBuyer || user?.role === 'admin') && tx.status === 'delivered' && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => approveOrder(tx.id)}
                                  className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center gap-1 hover:bg-emerald-400 transition-all text-xs"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-3" /> Approve Work
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("Enter specific dispute reason (e.g. Incomplete files, missing feature):");
                                    if (reason) disputeOrder(tx.id, reason);
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-500/20 text-rose-400 font-bold rounded-xl flex items-center gap-1 hover:bg-rose-500 hover:text-white transition-all text-xs border border-rose-500/30"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> Dispute
                                </button>
                              </div>
                            )}

                            {tx.status === 'completed' && (
                              <span className="text-xs font-bold text-slate-500">Escrow Closed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DELIVERY PROOF SUBMISSION MODAL */}
        {activeFulfillmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] text-white">
              <div className="p-6 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">Timestamped Delivery Proof</h2>
                    <p className="text-xs text-slate-400">Lock in your work delivery & initiate 3-day release timer</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveFulfillmentModal(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                deliverOrder(activeFulfillmentModal, deliveryProofUrl, deliveryNotes);
                setActiveFulfillmentModal(null);
              }} className="p-6 space-y-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed space-y-2 font-light">
                  <p>🛡️ <strong>Watermarked Delivery & Automated Code Drop:</strong> When you submit your work URL here, SkillTok compiles the code or design into an interactive, read-only preview sandbox. All source code, Figma export files, and downloadable zip folders remain completely encrypted and hidden from the buyer.</p>
                  <p className="text-emerald-400 font-bold">● Automatic Release Trigger: Once the buyer inspects the preview and clicks "Approve Work" (or after the 3-day inspection timer expires), the encrypted vault automatically unseals and drops the full source code directly into the buyer's account!</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Deliverable URL / Source Link</label>
                  <input 
                    type="url"
                    required
                    placeholder="https://github.com/favour187/Skilltok/pull/1 or Figma/Google Drive link"
                    value={deliveryProofUrl}
                    onChange={(e) => setDeliveryProofUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Delivery Summary & Notes</label>
                  <textarea 
                    rows={4}
                    required
                    placeholder="Summarize the completed deliverables for the buyer..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveFulfillmentModal(null)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Submit Timestamped Delivery 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* My Listed Gigs */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" /> My Active Freelance Gigs ({userServices.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userServices.map(service => (
              <div key={service.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-4 shadow-md">
                <img src={service.image} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{service.category}</span>
                  <h4 className="font-bold text-xs text-white truncate mt-0.5">{service.title}</h4>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-300 font-bold">
                    <span className="text-cyan-400">{formatCurrency(service.priceCents)}</span>
                    <span>•</span>
                    <span>⚡ {service.deliveryDays} Days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WITHDRAW FUNDS PAYOUT MODAL */}
        {showPayoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] text-white">
              <div className="p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">Withdraw Net Available Earnings</h2>
                    <p className="text-xs text-slate-400">Transfer your escrow payout to your connected accounts</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPayoutModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                  disabled={isProcessingPayout || payoutSuccess}
                >
                  ✕
                </button>
              </div>

              {payoutSuccess ? (
                <div className="p-12 text-center space-y-4 animate-in zoom-in duration-200">
                  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border-2 border-emerald-500/40">
                    <CheckCircle2 className="w-12 h-12 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Payout Initiated! 🎉</h3>
                  <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                    Successfully transferred <strong>${parseFloat(payoutAmount).toFixed(2)}</strong> via <strong>{payoutMethod === 'paystack' ? 'Paystack Instant Payout' : payoutMethod === 'bank' ? 'Nigerian Bank Transfer' : 'Crypto USDT Payout'}</strong>.
                  </p>
                  <div className="p-3 bg-slate-800/80 rounded-xl max-w-xs mx-auto text-xs text-slate-400 font-mono">
                    Reference ID: ST_PAY_{Math.floor(Math.random() * 900000 + 100000)}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWithdrawFunds} className="p-6 space-y-5">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Available Balance</span>
                      <span className="text-2xl font-black text-emerald-400">{formatCurrency(netEarnings)}</span>
                    </div>
                    {netEarnings > 0 ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
                        Ready to Withdraw ✓
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
                        No Funds Yet
                      </span>
                    )}
                  </div>

                  {netEarnings === 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                      💡 You have no released escrow funds yet. Complete orders to earn money.
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Withdrawal Amount (USD $)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-bold text-slate-400">$</span>
                      <input 
                        type="number"
                        min="10"
                        max={(netEarnings / 100) || 1056}
                        step="0.01"
                        required
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-8 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Payout Destination</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPayoutMethod('paystack')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${
                          payoutMethod === 'paystack'
                            ? 'bg-cyan-500/20 border-cyan-500 text-white ring-2 ring-cyan-500/50'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <CreditCard className={`w-5 h-5 ${payoutMethod === 'paystack' ? 'text-cyan-400' : ''}`} />
                        <span>Paystack</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayoutMethod('bank')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${
                          payoutMethod === 'bank'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white ring-2 ring-emerald-500/50'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Building2 className={`w-5 h-5 ${payoutMethod === 'bank' ? 'text-emerald-400' : ''}`} />
                        <span>Nigerian Bank</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPayoutMethod('crypto')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${
                          payoutMethod === 'crypto'
                            ? 'bg-purple-500/20 border-purple-500 text-white ring-2 ring-purple-500/50'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <DollarSign className={`w-5 h-5 ${payoutMethod === 'crypto' ? 'text-purple-400' : ''}`} />
                        <span>Crypto USDT</span>
                      </button>
                    </div>
                  </div>

                  {/* DESTINATION ACCOUNT FIELDS — User specifies where to send the money */}
                  {payoutMethod === 'paystack' && (
                    <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/30 space-y-3">
                      <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider">💳 Paystack Customer Email</label>
                      <input type="email" required placeholder="your-paystack-email@gmail.com" value={paystackEmail}
                        onChange={(e) => setPaystackEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500" />
                      <p className="text-[10px] text-slate-400">💡 Must match the email registered on your Paystack account. Funds arrive in ≈10 minutes.</p>
                    </div>
                  )}

                  {payoutMethod === 'bank' && (
                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/30 space-y-3">
                      <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">🏛️ Nigerian Bank Account Details</label>
                      
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Select Your Bank</label>
                        <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-emerald-500">
                          {nigerianBanks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">10-Digit Account Number (NUBAN)</label>
                        <input type="text" required maxLength={10} placeholder="0123456789" value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-wider focus:outline-none focus:border-emerald-500" />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Account Holder Name (must match NUBAN)</label>
                        <input type="text" required placeholder="FAVOUR ADEYEMI" value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500" />
                      </div>

                      <p className="text-[10px] text-amber-300">⚠ Double-check details. Wrong account numbers may take 5-7 days to reverse.</p>
                    </div>
                  )}

                  {payoutMethod === 'crypto' && (
                    <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/30 space-y-3">
                      <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">🪙 USDT Crypto Wallet</label>
                      
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Network</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['polygon', 'tron', 'bsc'] as const).map(net => (
                            <button type="button" key={net} onClick={() => setCryptoNetwork(net)}
                              className={`p-2 rounded-xl text-[11px] font-bold uppercase ${cryptoNetwork === net ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                              {net === 'polygon' ? 'Polygon' : net === 'tron' ? 'TRC-20' : 'BEP-20'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">Wallet Address</label>
                        <input type="text" required placeholder={cryptoNetwork === 'tron' ? 'TX...' : '0x...'} value={cryptoWallet}
                          onChange={(e) => setCryptoWallet(e.target.value.trim())}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-purple-500" />
                      </div>

                      <p className="text-[10px] text-amber-300">⚠ Crypto transfers are irreversible. Verify the address is on the {cryptoNetwork.toUpperCase()} network.</p>
                    </div>
                  )}

                  <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-700/60 text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span>Payout Speed:</span>
                      <span className="font-bold text-emerald-400">{payoutMethod === 'paystack' ? '≈ 10 minutes' : payoutMethod === 'bank' ? '1-2 business hours' : 'Under 5 minutes'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transfer Fee:</span>
                      <span className="font-bold text-white">{payoutMethod === 'paystack' ? '₦10' : payoutMethod === 'bank' ? '₦25' : 'Network gas only'}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessingPayout || parseFloat(payoutAmount) <= 0}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all active:scale-98 disabled:opacity-50"
                    >
                      {isProcessingPayout ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Connecting to Payment Gateway & Authorizing...</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5" />
                          <span>Confirm Withdrawal of ${parseFloat(payoutAmount || '0').toFixed(2)}</span>
                          <ArrowRight className="w-5 h-5 ml-1" />
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-cyan-400" /> Payouts are fully secured under the SkillTok Creator Terms.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
