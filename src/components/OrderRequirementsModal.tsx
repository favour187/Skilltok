import React, { useState } from 'react';
import { Service } from '../types';
import { X, FileText, Upload, ArrowRight } from 'lucide-react';

interface Props {
  open: boolean;
  service: Service | null;
  onClose: () => void;
  onContinue: (requirements: Record<string, string>, attachments: string[]) => void;
}

export const OrderRequirementsModal: React.FC<Props> = ({ open, service, onClose, onContinue }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<string[]>([]);

  if (!open || !service) return null;

  // Default requirements every gig must collect
  const defaultRequirements = [
    'Describe what you want in detail (goals, style, audience):',
    'Please provide any reference links, examples, or brand guidelines:',
    'What is your project deadline? Any urgent constraints?',
    'Any additional notes for the creator?'
  ];

  const requirements = service.requirementsForm && service.requirementsForm.length > 0
    ? service.requirementsForm
    : defaultRequirements;

  const handleSubmit = () => {
    onContinue(answers, attachments);
  };

  const allAnswered = requirements.every((_, i) => answers[`q${i}`]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Order Requirements</h2>
              <p className="text-[11px] text-slate-400">Help the creator deliver exactly what you need</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {requirements.map((q, i) => (
            <div key={i}>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                {i + 1}. {q}
                <span className="text-rose-400 ml-1">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Type your answer here..."
                value={answers[`q${i}`] || ''}
                onChange={(e) => setAnswers({ ...answers, [`q${i}`]: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}

          {/* File attachments */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Upload Reference Files (optional)</label>
            <div className="p-4 border-2 border-dashed border-slate-700 bg-slate-950 rounded-2xl text-center hover:border-cyan-500/50 cursor-pointer relative">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setAttachments([...attachments, ...files.map(f => (f as File).name)]);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-white">Click to attach files</p>
              <p className="text-[10px] text-slate-400">Images, PDFs, ZIPs — up to 25MB each</p>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((name, i) => (
                  <div key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-400 truncate">{name}</span>
                    <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-rose-400">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 sticky bottom-0 bg-slate-900 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!allAnswered}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-extrabold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            Continue to Payment
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
