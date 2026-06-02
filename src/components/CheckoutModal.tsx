import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateFees, formatCurrency } from '../utils/feeCalculator';
import { CreditCard, ShieldCheck, X, CheckCircle2, Lock, ArrowRight, Loader2, Building } from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const { selectedServiceForCheckout, setSelectedServiceForCheckout, creators, user, createTransaction, setTab } = useAppStore();
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup pending timeout on unmount to prevent memory leaks / setState-on-unmounted
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Card details (user enters real values)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  if (!selectedServiceForCheckout) return null;

  // Find seller's plan
  const seller = creators.find(c => c.id === selectedServiceForCheckout.creatorId);
  const sellerPlan = seller ? seller.plan : 'free';

  const feeResult = calculateFees(selectedServiceForCheckout.priceCents, sellerPlan, paymentMethod);

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      const { api } = await import('../utils/api');
      const totalAmount = feeResult.buyerPays + feeResult.processingFee;

      if (paymentMethod === 'paystack') {
        const response = await api.post('/api/payments/paystack/init', {
          serviceId: selectedServiceForCheckout.id,
          amountKobo: totalAmount,
          email: user?.email
        });

        const paymentUrl = response.data.authorization_url;
        if (!paymentUrl) throw new Error('Paystack did not return a checkout URL.');

        // Hosted Paystack checkout: PCI-DSS card/USSD/bank details are entered only
        // on Paystack, not inside SkillTok. This is Remita-style secure redirection.
        window.location.href = paymentUrl;
        return;
      }

      // Manual bank transfer should never be marked paid automatically.
      createTransaction({
        serviceId: selectedServiceForCheckout.id,
        serviceTitle: selectedServiceForCheckout.title,
        buyerId: user?.id || 'pending-buyer',
        buyerName: user?.name || 'Buyer',
        sellerId: selectedServiceForCheckout.creatorId,
        sellerName: selectedServiceForCheckout.creatorName,
        basePriceCents: feeResult.basePriceCents,
        buyerFeeCents: feeResult.buyerFee,
        sellerFeeCents: feeResult.sellerFee,
        processingFeeCents: feeResult.processingFee,
        platformNetCents: feeResult.platformNet,
        paymentMethod,
        status: 'pending'
      });
      setIsProcessing(false);
      setShowSuccess(true);
      timeoutRef.current = setTimeout(() => setTab('dashboard'), 1500);
    } catch (err: any) {
      setIsProcessing(false);
      alert(`Payment could not start: ${err.response?.data?.error || err.message}\n\nPlease try again or contact support.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-6 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Secure Checkout</h2>
              <p className="text-xs text-slate-400">Escrow protected by SkillTok Guarantee</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedServiceForCheckout(null)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            disabled={isProcessing || showSuccess}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showSuccess ? (
          <div className="p-12 text-center space-y-4 animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border-2 border-emerald-500/40">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">Payment Successful!</h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Your order for <strong>{selectedServiceForCheckout.title}</strong> has been secured in escrow. The creator has been notified.
            </p>
            <div className="p-4 bg-slate-800/80 rounded-2xl max-w-xs mx-auto text-xs text-slate-400">
              Redirecting to your order dashboard...
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Service Summary */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <img 
                src={selectedServiceForCheckout.image} 
                alt={selectedServiceForCheckout.title}
                className="w-20 h-20 rounded-xl object-cover ring-1 ring-white/10" 
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Freelance Gig</span>
                <h4 className="font-bold text-sm text-slate-100 line-clamp-2 mt-0.5">{selectedServiceForCheckout.title}</h4>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <img src={selectedServiceForCheckout.creatorAvatar} className="w-4 h-4 rounded-full" alt="" />
                  <span>{selectedServiceForCheckout.creatorName}</span>
                  <span>•</span>
                  <span>⚡ {selectedServiceForCheckout.deliveryDays} days delivery</span>
                </div>
              </div>
            </div>

            {/* ── Payment Method Selector (Remita-style) ── */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Choose Payment Method 🇳🇬
              </label>
              <div className="space-y-2">

                {/* Paystack */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paystack')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    paymentMethod === 'paystack'
                      ? 'bg-cyan-500/10 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/60 border-slate-700 hover:border-cyan-500/40 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${paymentMethod === 'paystack' ? 'bg-cyan-500/20' : 'bg-slate-700'}`}>
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'paystack' ? 'text-cyan-400' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${paymentMethod === 'paystack' ? 'text-white' : 'text-slate-300'}`}>Paystack</span>
                      {paymentMethod === 'paystack' && (
                        <span className="text-[10px] bg-cyan-500 text-slate-950 font-black px-2 py-0.5 rounded-full">SELECTED</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Card, Bank Transfer, USSD, OPay, PalmPay</p>
                  </div>
                </button>

                {/* Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-800/60 border-slate-700 hover:border-emerald-500/40 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${paymentMethod === 'bank_transfer' ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                    <Building className={`w-5 h-5 ${paymentMethod === 'bank_transfer' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${paymentMethod === 'bank_transfer' ? 'text-white' : 'text-slate-300'}`}>Bank Transfer</span>
                      {paymentMethod === 'bank_transfer' && (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">SELECTED</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Direct NGN transfer — GTB, Access, Zenith, UBA & more</p>
                  </div>
                </button>

              </div>
            </div>

            {/* Paystack / Flutterwave card inputs */}
            {paymentMethod === 'paystack' && (
              <div className="space-y-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Paystack Secure Checkout
                  </span>
                  <span className="text-[10px] text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded">PCI-DSS Hosted</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cards, USSD (*737#, *894#), Bank Transfer, Mobile Money, OPay & PalmPay all supported. You'll be redirected to the secure Paystack payment page after clicking pay.
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-300">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">Card</div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">USSD</div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-700">Bank Transfer</div>
                </div>
              </div>
            )}

            {/* Fee Breakdown Table */}
            <div className="space-y-2 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/60 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Service Price:</span>
                <span className="font-semibold text-white">{formatCurrency(feeResult.basePriceCents)}</span>
              </div>
              <div className="flex justify-between text-slate-300 font-bold">
                <span>SkillTok Buyer Fee (0% Special):</span>
                <span className="text-emerald-400">FREE ($0.00)</span>
              </div>
              {paymentMethod !== 'bank_transfer' && (
                <div className="flex justify-between text-slate-300">
                  <span>Payment Gateway Processing (Paystack 1.5% + ₦100):</span>
                  <span className="font-semibold text-slate-400">+{formatCurrency(feeResult.processingFee)}</span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-slate-700 flex justify-between text-sm font-bold text-white">
                <span>Total Due Today:</span>
                <span className="text-cyan-400 text-base font-extrabold">{formatCurrency(feeResult.buyerPays + feeResult.processingFee)}</span>
              </div>
              <div className="pt-2 text-[10px] text-slate-500 flex justify-between">
                <span>Creator Receives (Net of {sellerPlan} plan {feeResult.sellerFeeRate * 100}% fee):</span>
                <span className="font-bold text-white">{formatCurrency(feeResult.sellerNet)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Opening Secure Paystack Checkout...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Pay {formatCurrency(feeResult.buyerPays + feeResult.processingFee)} Now</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Payments are held in escrow until you approve the completed work.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
