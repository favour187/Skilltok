import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, reportedTarget, closeReportModal } = useAppStore();
  const [reason, setReason] = useState('Inappropriate Content');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isReportModalOpen || !reportedTarget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      closeReportModal();
    }, 1800);
  };

  const reasons = [
    'Inappropriate Content or Nudity',
    'Scam, Fraud or Misleading Service',
    'Hate Speech or Harassment',
    'Spam or Fake Engagement',
    'Copyright Infringement',
    'Other / Terms Violation'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm">Report Security Violation</h3>
              <p className="text-[10px] text-rose-300">Target: {reportedTarget.name} ({reportedTarget.type})</p>
            </div>
          </div>
          <button 
            onClick={closeReportModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border-2 border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-lg font-bold">Report Filed Securely</h4>
            <p className="text-xs text-slate-300">
              Thank you for keeping SkillTok safe. Our moderation team will investigate within 2 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Additional Evidence or Details</label>
              <textarea
                rows={3}
                placeholder="Please describe the exact violation..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl text-[11px] text-slate-400 flex items-start gap-2 border border-slate-700/60">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>False reports or abuse of the report tool may result in account termination under SkillTok terms.</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeReportModal}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-lg shadow-rose-500/20"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
