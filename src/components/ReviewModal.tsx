import React, { useState } from 'react';
import { Star, X, ShieldCheck, ThumbsUp, Gift } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  serviceTitle: string;
  sellerName: string;
  onSubmit: (review: { rating: number; comment: string; communication: number; asDescribed: number; recommend: number; tipAmount?: number }) => void;
}

export const ReviewModal: React.FC<Props> = ({ open, onClose, serviceTitle, sellerName, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [asDescribed, setAsDescribed] = useState(5);
  const [recommend, setRecommend] = useState(5);
  const [comment, setComment] = useState('');
  const [tipAmount, setTipAmount] = useState(0);

  if (!open) return null;

  const handleSubmit = () => {
    onSubmit({ rating, comment, communication, asDescribed, recommend, tipAmount });
    onClose();
  };

  const StarRating: React.FC<{ value: number; onChange: (v: number) => void; label: string }> = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} className="transition-transform hover:scale-110">
            <Star className={`w-5 h-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Leave a Review</h2>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{serviceTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Overall Rating */}
          <div className="text-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400 mb-3">How was your experience with <strong className="text-white">{sellerName}</strong>?</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-125">
                  <Star className={`w-10 h-10 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-amber-400">
              {['Terrible', 'Bad', 'Okay', 'Great', 'Excellent'][rating - 1]}
            </p>
          </div>

          {/* Detailed ratings */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Rate Specific Aspects</h3>
            <StarRating value={communication} onChange={setCommunication} label="💬 Communication" />
            <StarRating value={asDescribed} onChange={setAsDescribed} label="📋 Service as Described" />
            <StarRating value={recommend} onChange={setRecommend} label="👍 Would Recommend" />
          </div>

          {/* Written review */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Write Your Review</label>
            <textarea
              rows={4}
              placeholder="Share details of your experience with this creator..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">{comment.length} / 500 characters</p>
          </div>

          {/* Tipping */}
          <div className="p-4 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white">Send a Tip (Optional)</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Reward exceptional work with a tip — 100% goes to the creator.</p>
            <div className="grid grid-cols-5 gap-2">
              {[0, 5, 10, 25, 50].map(amt => (
                <button key={amt} onClick={() => setTipAmount(amt)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                    tipAmount === amt
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500/50'
                  }`}>
                  {amt === 0 ? 'No' : `$${amt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reviews are public, permanent, and cannot be edited after 48 hours.</span>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!comment.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-extrabold rounded-xl disabled:opacity-40 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
            <ThumbsUp className="w-4 h-4" />
            <span>Submit Review {tipAmount > 0 && `+ $${tipAmount} Tip`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
