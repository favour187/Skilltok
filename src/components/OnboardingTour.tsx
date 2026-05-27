import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Video, ShoppingBag, MessageSquare, Wallet, Sparkles, ShieldCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Video,
    color: 'cyan',
    title: 'Welcome to SkillTok! 🎉',
    body: 'The TikTok-style video feed where you discover freelancers by watching their skills in action.',
  },
  {
    icon: ShoppingBag,
    color: 'teal',
    title: 'Hire Instantly',
    body: 'Every video can link to a freelance gig. Watch → fall in love with the work → tap to order in seconds.',
  },
  {
    icon: ShieldCheck,
    color: 'emerald',
    title: 'Escrow Protection',
    body: 'Your money is held safely until you approve the delivered work. No more freelancer scams.',
  },
  {
    icon: Wallet,
    color: 'purple',
    title: 'Local Payment Methods',
    body: 'Pay with Nigerian cards, bank transfer, USSD, OPay, PalmPay, or crypto USDT. Withdrawals to any Nigerian bank.',
  },
  {
    icon: MessageSquare,
    color: 'indigo',
    title: 'Chat with Creators',
    body: 'Message any creator directly, share files, get AI-suggested replies, and negotiate deals.',
  },
  {
    icon: Sparkles,
    color: 'amber',
    title: 'Refer & Earn ₦500',
    body: 'Invite friends with your unique referral code. Earn ₦500 each time a friend completes their first order.',
  }
];

export const OnboardingTour: React.FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Skip button */}
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1">
            Skip Tour <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated icon */}
        <div className="px-8 pb-2 text-center">
          <div className={`w-20 h-20 mx-auto rounded-3xl bg-${current.color}-500/15 border-2 border-${current.color}-500/30 flex items-center justify-center mb-4 animate-bounce`}>
            <Icon className={`w-10 h-10 text-${current.color}-400`} />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center space-y-3">
          <h2 className="text-xl font-black text-white">{current.title}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{current.body}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 0 ? 'Back' : 'Skip'}
          </button>
          <span className="text-xs text-slate-500">{step + 1} / {STEPS.length}</span>
          {isLast ? (
            <button onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/20">
              Get Started 🚀
            </button>
          ) : (
            <button onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
