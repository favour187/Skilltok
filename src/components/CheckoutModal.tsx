import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateFees, formatCurrency } from '../utils/feeCalculator';
import { CreditCard, ShieldCheck, X, CheckCircle2, Lock, ArrowRight, Loader2, DollarSign, Building } from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const { selectedServiceForCheckout, setSelectedServiceForCheckout, creators, user, createTransaction, setTab } = useAppStore();
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave' | 'bank_transfer'>('paystack');
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
    // Validate card details
    if (paymentMethod !== 'bank_transfer') {
      const rawCard = cardNumber.replace(/\s|•/g, '');
      if (rawCard.length !== 16 || !/^\d{16}$/.test(rawCard)) {
        alert('Please enter a valid 16-digit card number.');
        return;
      }
      if (!expiry || expiry.length < 5 || !/^\d{2}\/\d{2}$/.test(expiry)) {
        alert('Please enter the card expiry in MM/YY format (e.g. 08/27).');
        return;
      }
      const [mm, yy] = expiry.split('/').map(Number);
      const now = new Date();
      const currentYear  = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (mm < 1 || mm > 12) {
        alert('Expiry month must be between 01 and 12.');
        return;
      }
      if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
        alert('Your card has expired. Please use a valid card.');
        return;
      }
      if (!cvc || cvc.length < 3 || !/^\d{3}$/.test(cvc)) {
        alert('Please enter a valid 3-digit CVV (found on the back of your card).');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Real backend call to Paystack/Flutterwave
      const { api } = await import('../utils/api');
      const totalAmount = feeResult.buyerPays + feeResult.processingFee;
      const endpoint = paymentMethod === 'paystack' ? '/api/payments/paystack/init' 
                     : paymentMethod === 'flutterwave' ? '/api/payments/flutterwave/init' 
                     : null;

      if (endpoint) {
        const response = await api.post(endpoint, {
          serviceId: selectedServiceForCheckout.id,
          amountKobo: totalAmount, // Paystack uses kobo (cents equivalent)
          amount: totalAmount / 100, // Flutterwave uses Naira
          email: user?.email
        });
        // Redirect to Paystack/Flutterwave hosted page
        const paymentUrl = response.data.authorization_url || response.data.payment_link;
        if (paymentUrl) {
          window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        }
      }

      setIsProcessing(false);
      setShowSuccess(true);
      timeoutRef.current = setTimeout(() => {
        createTransaction({
          serviceId: selectedServiceForCheckout.id,
          serviceTitle: selectedServiceForCheckout.title,
          buyerId: user?.id || 'u-100',
          buyerName: user?.name || 'Buyer',
          sellerId: selectedServiceForCheckout.creatorId,
          sellerName: selectedServiceForCheckout.creatorName,
          basePriceCents: feeResult.basePriceCents,
          buyerFeeCents: feeResult.buyerFee,
          sellerFeeCents: feeResult.sellerFee,
          processingFeeCents: feeResult.processingFee,
          platformNetCents: feeResult.platformNet,
          paymentMethod,
          status: 'pending' // Will become 'completed' after webhook confirms
        });
        // createTransaction sets selectedServiceForCheckout → null which closes this modal.
        // Navigate to dashboard so buyer can see the new order immediately.
        setTab('dashboard');
      }, 2000);
    } catch (err: any) {
      setIsProcessing(false);
      alert(`Payment failed: ${err.response?.data?.error || err.message}\n\nPlease verify your card details and try again, or use Bank Transfer.`);
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

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Select Payment Method (Nigeria 🇳🇬)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paystack')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    paymentMethod === 'paystack'
                      ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${paymentMethod === 'paystack' ? 'text-cyan-400' : ''}`} />
                  <span>Paystack</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('flutterwave')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    paymentMethod === 'flutterwave'
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <DollarSign className={`w-5 h-5 ${paymentMethod === 'flutterwave' ? 'text-amber-400' : ''}`} />
                  <span>Flutterwave</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Building className={`w-5 h-5 ${paymentMethod === 'bank_transfer' ? 'text-emerald-400' : ''}`} />
                  <span>Bank Transfer</span>
                </button>
              </div>
            </div>

            {/* Paystack / Flutterwave card inputs */}
            {(paymentMethod === 'paystack' || paymentMethod === 'flutterwave') && (
              <div className="space-y-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    {paymentMethod === 'paystack' ? 'Paystack Checkout' : 'Flutterwave Checkout'}
                  </span>
                  <span className="text-[10px] text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded">Test Mode</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cards, USSD (*737#, *894#), Bank Transfer, Mobile Money, OPay & PalmPay all supported. You'll be redirected to the secure {paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'} payment page after clicking pay.
                </p>
                <div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• 4242"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono tracking-wider focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none"
                  />
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="CVV"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none"
                  />
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
                  <span>Payment Gateway Processing ({paymentMethod === 'paystack' ? '1.5% + ₦100' : '1.4% + ₦50'}):</span>
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
                    <span>Encrypting & Securing Escrow...</span>
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
