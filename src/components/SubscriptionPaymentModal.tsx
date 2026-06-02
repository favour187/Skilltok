import React, { useState } from 'react';
import { PlanType } from '../types';
import { X, CreditCard, Lock, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  open: boolean;
  plan: PlanType;
  onClose: () => void;
  onSuccess: (plan: PlanType, paymentRef: string) => void;
}

const PLAN_DETAILS: Record<PlanType, { name: string; priceUsd: number; priceNgn: number; color: string; sellerFee: string; perks: string[] }> = {
  free: { name: 'Free', priceUsd: 0, priceNgn: 0, color: 'slate', sellerFee: '5%', perks: ['Standard listings'] },
  pro: { name: 'Pro', priceUsd: 29, priceNgn: 47850, color: 'cyan', sellerFee: '4%', perks: ['Boosted algorithm', 'Priority escrow', '4% seller fee'] },
  agency: { name: 'Agency', priceUsd: 99, priceNgn: 163350, color: 'purple', sellerFee: '3%', perks: ['Lowest 3% seller fee', 'Account manager', 'Unlimited gigs', 'Priority support'] }
};

export const SubscriptionPaymentModal: React.FC<Props> = ({ open, plan, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave' | 'card'>('paystack');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'method' | 'card' | 'otp' | 'pin'>('method');

  if (!open) return null;
  if (plan === 'free') {
    onClose();
    return null;
  }

  const details = PLAN_DETAILS[plan];

  const formatCardNumber = (val: string) => {
    return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handlePayWithCard = () => {
    setError('');

    if (!cardName.trim()) {
      setError('Please enter the cardholder name exactly as it appears on your card.');
      return;
    }
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length !== 16 || !/^\d{16}$/.test(rawCard)) {
      setError('Please enter a valid 16-digit card number.');
      return;
    }
    if (expiry.length !== 5 || !/^\d{2}\/\d{2}$/.test(expiry)) {
      setError('Please enter the expiry date in MM/YY format (e.g. 08/27).');
      return;
    }
    const [mm, yy] = expiry.split('/').map(Number);
    const now = new Date();
    const currentYear  = now.getFullYear() % 100; // last 2 digits
    const currentMonth = now.getMonth() + 1;
    if (mm < 1 || mm > 12) {
      setError('Expiry month must be between 01 and 12.');
      return;
    }
    if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
      setError('Your card has expired. Please use a valid card.');
      return;
    }
    if (cvv.length !== 3 || !/^\d{3}$/.test(cvv)) {
      setError('CVV must be exactly 3 digits (found on the back of your card).');
      return;
    }

    // Move to PIN step (Nigerian card flow)
    setStep('pin');
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('Please enter your 4-digit ATM card PIN.');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      // Call real backend to charge card via Paystack
      const res = await fetch(`${(window as any).SKILLTOK_BACKEND_URL || ''}/api/payments/charge-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('skilltok_access_token') || ''}`
        },
        body: JSON.stringify({
          plan,
          amountCents: details.priceUsd * 100,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardExpiry: expiry,
          cardCvv: cvv,
          cardName,
          pin,
          type: 'subscription'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Payment failed. Please check your card details and try again.');
        setIsProcessing(false);
        return;
      }

      // Only mark success if backend confirmed the charge
      if (data.status === 'success' && data.reference) {
        setIsProcessing(false);
        setSuccess(true);
        setTimeout(() => {
          onSuccess(plan, data.reference);
          setSuccess(false);
          setStep('method');
          setCardNumber(''); setExpiry(''); setCvv(''); setCardName(''); setPin('');
        }, 2500);
      } else {
        setError(data.message || 'Payment was not confirmed. Please try again.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        
        <div className={`p-6 bg-gradient-to-r from-${details.color}-950/40 via-slate-900 to-${details.color}-950/40 border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${details.color}-500/20 text-${details.color}-400 rounded-xl`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Upgrade to {details.name}</h2>
              <p className="text-[11px] text-slate-400">Subscription billing — pay with card to activate</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="text-slate-400 hover:text-white disabled:opacity-30">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-white">Subscription Active! 🎉</h3>
            <p className="text-xs text-slate-300">You are now on the {details.name} plan. Your seller fee is reduced to {details.sellerFee}.</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            
            {/* Plan summary */}
            <div className={`p-4 rounded-2xl border bg-slate-950 border-${details.color}-500/30`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold text-${details.color}-400 uppercase tracking-wider`}>{details.name} Plan</span>
                <div className="text-right">
                  <span className={`text-2xl font-black text-${details.color}-400`}>${details.priceUsd}</span>
                  <span className="text-xs text-slate-400">/mo</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">≈ ₦{(details.priceNgn ?? 0).toLocaleString()} per month</p>
              <ul className="space-y-1 mt-3">
                {details.perks.map((p, i) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {p}
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            {step === 'method' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setPaymentMethod('paystack'); setStep('card'); }}
                      className="p-4 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/15 text-left transition-all">
                      <CreditCard className="w-5 h-5 text-cyan-400 mb-2" />
                      <p className="font-bold text-white text-sm">Paystack</p>
                      <p className="text-[10px] text-slate-400">Card • Bank • USSD</p>
                    </button>
                    <button onClick={() => { setPaymentMethod('flutterwave'); setStep('card'); }}
                      className="p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 text-left transition-all">
                      <CreditCard className="w-5 h-5 text-amber-400 mb-2" />
                      <p className="font-bold text-white text-sm">Flutterwave</p>
                      <p className="text-[10px] text-slate-400">Card • Mobile Money</p>
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'card' && (
              <>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pay via {paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'} 🇳🇬</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Cardholder Name</label>
                  <input type="text" placeholder="FAVOUR ADEYEMI" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white uppercase font-mono focus:outline-none focus:border-cyan-500" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono tracking-wider focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">Expiry</label>
                    <input type="text" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">CVV</label>
                    <input type="password" placeholder="•••" value={cvv} maxLength={3}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>

                <button onClick={handlePayWithCard}
                  className={`w-full py-4 bg-gradient-to-r from-${details.color}-500 to-${details.color === 'cyan' ? 'teal' : 'indigo'}-500 text-slate-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl`}>
                  <Lock className="w-4 h-4" />
                  <span>Pay ${details.priceUsd} (₦{(details.priceNgn ?? 0).toLocaleString()})</span>
                </button>

                <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Card details encrypted by {paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'} PCI-DSS Level 1
                </p>
              </>
            )}

            {step === 'pin' && (
              <>
                <div className="text-center space-y-2 py-4">
                  <Lock className="w-10 h-10 text-cyan-400 mx-auto" />
                  <h3 className="font-bold text-white">Enter Your Card PIN</h3>
                  <p className="text-xs text-slate-400">Authorize this transaction with your 4-digit ATM card PIN</p>
                </div>

                <input type="password" placeholder="••••" value={pin} maxLength={4}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-2xl px-4 py-5 text-3xl text-center text-white font-mono tracking-[1em] focus:outline-none focus:border-cyan-400" autoFocus />

                <button onClick={handlePinSubmit} disabled={isProcessing || pin.length !== 4}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize Payment</span>
                    </>
                  )}
                </button>

                <button onClick={() => { setStep('card'); setPin(''); setError(''); }}
                  className="w-full text-xs text-slate-400 hover:text-white">
                  ← Back to card details
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
