import React from 'react';
import { ShieldCheck, Scale, FileText, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const TermsScreen: React.FC = () => {
  const { setTab } = useAppStore();
  
  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-24 lg:pb-12 px-4 lg:px-8 pt-6 select-text">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Banner */}
        <div className="p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center border border-indigo-500/40 flex-shrink-0">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Terms of Service & Legal Defensibility</h1>
                <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-black border border-emerald-500/40 uppercase">
                  Binding Contract
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed font-light">
                Comprehensive legal protections covering escrow liability, user-generated content (DMCA), independent contractor classification, tax indemnification, and binding arbitration.
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 hidden md:block">
            <span className="text-[10px] text-slate-400 block font-mono">DOCUMENT REF: ST_LEGAL_2026_V1</span>
            <span className="text-xs text-indigo-400 font-bold">Last Updated: February 2026</span>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-black text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Executive Legal Notice for Users and Regulators</span>
          </div>
          <p>
            By accessing, browsing, registering, or conducting transactions on the SkillTok video feed and freelance marketplace ("Platform"), all buyers, creators, freelancers, and agencies ("Users") expressly agree to be bound by these Terms of Service. SkillTok functions strictly as an intermediary technology platform connecting independent buyers with independent sellers and assumes zero employer liability, zero tax withholding obligations, and zero responsibility for user disputes.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          
          {/* Section 1 */}
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">1</span>
              <h3 className="font-extrabold text-base text-white">Independent Contractor Status & Non-Employer Disclaimer</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>1.1 Relationship of Parties:</strong> All sellers, creators, and freelancers operating on SkillTok are strictly classified as <strong>Independent Contractors</strong>. Nothing in these Terms or within the platform's operation creates an employment, partnership, joint venture, agency, or franchise relationship between SkillTok and any User.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>1.2 No Benefits or Insurance:</strong> Creators and freelancers acknowledge they are not entitled to workers' compensation, unemployment benefits, health insurance, or disability insurance from SkillTok. Sellers are solely responsible for setting their own working hours, determining their pricing, and supplying their own tools and equipment.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">2</span>
              <h3 className="font-extrabold text-base text-white">Escrow Payment Terms, Commission Structure & Watermark Protection</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>2.1 Escrow Security & Watermarked Previews:</strong> To guarantee marketplace trust and prevent code/asset theft, all digital work (software code, UI designs, videos, music) is delivered to the buyer initially in a secure <strong>Watermarked Preview or Encrypted Sandbox</strong> format. The buyer cannot access unencrypted, copyable source code or unwatermarked assets until escrow is officially released.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>2.2 Zero Buyer Fees & Tiered Creator Commissions:</strong> Buyers pay exactly 0% in marketplace fees on all service gigs. SkillTok collects its platform commission exclusively from the creator/seller starting at a maximum of 5% on the Free Plan. This seller commission rate decreases progressively for premium account holders (4% on the Pro Plan and 3% on the Agency Plan). Payment processing fees (Paystack/Flutterwave) are calculated directly per transaction.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>2.3 Malicious Dispute & Code Theft Forfeiture:</strong> If a buyer raises a dispute after receiving a watermarked delivery, the escrow funds are frozen and audited by SkillTok Administration. If technical logs confirm the deliverable meets gig specifications and the buyer raised a frivolous or fraudulent dispute to steal code, SkillTok reserves the absolute right to rule in favor of the seller, release full funds to the seller, and permanently ban the buyer's account.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-xs">3</span>
              <h3 className="font-extrabold text-base text-white">DMCA Copyright Policy & Intellectual Property Rights</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>3.1 User-Generated Content:</strong> Creators retain ownership of their uploaded videos but grant SkillTok a worldwide, perpetual, royalty-free, non-exclusive license to display, distribute, transcode, and promote the video content across its algorithmic feed and marketing channels.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>3.2 DMCA Safe Harbor:</strong> SkillTok complies with the Digital Millennium Copyright Act (DMCA). If any content on the platform infringes upon verified intellectual property rights, copyright holders may submit a formal takedown notice to <code className="bg-slate-950 px-2 py-0.5 rounded text-cyan-400 font-mono">legal@skilltok.com</code>. SkillTok enforces a strict "Repeat Infringer" termination policy.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>3.3 Deliverable Rights:</strong> Upon release of escrow funds, full intellectual property rights, source files, and commercial usage rights for custom freelance deliverables transfer entirely from the creator to the purchasing buyer, unless explicitly stated otherwise in the gig description.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">4</span>
              <h3 className="font-extrabold text-base text-white">Prohibited Conduct, Off-Platform Transactions & Account Forfeiture</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>4.1 Anti-Circumvention Rule:</strong> To protect escrow security and platform integrity, Users are strictly prohibited from soliciting, offering, or completing payments outside of the SkillTok checkout gateway (e.g., direct crypto transfers, external bank wires, or private cash apps).
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>4.2 Zero Tolerance Conduct:</strong> SkillTok reserves the absolute right to suspend, freeze, or permanently terminate any User account without prior notice if discovered engaging in: fraud, chargeback abuse, harassment, hate speech, distribution of malware, uploading explicit adult content, or attempting to reverse-engineer platform APIs.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">5</span>
              <h3 className="font-extrabold text-base text-white">Limitation of Liability & Warranty Disclaimer</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light uppercase font-bold text-amber-300">
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES OF ANY KIND, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              In no event shall SkillTok, its directors, employees, or infrastructure providers be liable for any indirect, incidental, consequential, special, or exemplary damages—including but not limited to loss of revenue, lost data, business interruption, or reputational harm resulting from the use or inability to use the platform. SkillTok's maximum cumulative liability in any dispute shall not exceed the net platform fees collected from the specific transaction in question.
            </p>
          </div>

          {/* Section 6 */}
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">6</span>
              <h3 className="font-extrabold text-base text-white">Binding Arbitration & Class Action Waiver</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>6.1 Mandatory Arbitration:</strong> Any legal controversy, claim, or dispute arising out of or relating to these Terms, the platform, or escrow payouts shall be settled exclusively through binding, confidential arbitration administered by the American Arbitration Association (AAA) or equivalent international arbitration body.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              <strong>6.2 Class Action Waiver:</strong> All Users expressly waive the right to initiate, join, or participate as a plaintiff or class member in any class action lawsuit, collective action, or representative proceeding against SkillTok.
            </p>
          </div>

        </div>

        {/* Footer Acknowledgement */}
        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">User Contract Validated</p>
              <p className="text-[11px] text-slate-400">By creating an account, you digitally sign and consent to all terms above.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Print / Save Legal PDF</span>
            </button>
            <button
              onClick={() => setTab('feed')}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>I Agree & Continue to Feed</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
