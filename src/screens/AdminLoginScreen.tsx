import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Lock, ArrowRight, ArrowLeft, Key, User } from 'lucide-react';
import { AdminRegistry } from '../utils/adminRegistry';

export const AdminLoginScreen: React.FC = () => {
  const { setTab } = useAppStore();
  const [step, setStep] = useState<'identity' | 'passcode'>('identity');
  const [selectedAdminId, setSelectedAdminId] = useState<string>('admin-1');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const admins = AdminRegistry.list();

  const handleSelectIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('passcode');
    setError('');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= 3) {
      setError('⛔ Too many failed attempts. Access frozen.');
      return;
    }
    if (adminPasscode === 'SKILLTOKFAVOUR@15') {
      const adminAccount = AdminRegistry.recordLogin(selectedAdminId);
      if (adminAccount) {
        useAppStore.setState({
          user: {
            id: adminAccount.id,
            email: adminAccount.email,
            name: adminAccount.alias,
            username: adminAccount.alias.toLowerCase().replace(/\s+/g, '_'),
            avatar: '/skilltok-logo.png',
            role: 'admin',
            plan: 'agency',
            followersCount: 0,
            followingCount: 0,
            joinedDate: '2026-01-01',
            isVerified: true,
            twoFactorEnabled: true,
            bio: `Platform Governance Officer — ${adminAccount.alias}`
          },
          isAuthenticated: true
        });
        setTab('admin');
      }
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setError('⛔ Maximum attempts reached. Access locked.');
      } else {
        setError(`✗ Incorrect passcode. ${3 - newAttempts} attempt(s) remaining.`);
      }
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-violet-600/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        <div className="p-6 bg-gradient-to-br from-purple-950/60 via-slate-900 to-indigo-950/50 border-b border-purple-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-purple-500/30 flex-shrink-0">
            <img src="/skilltok-logo.png" alt="SkillTok" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">Administrator Vault</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold uppercase">Secure</span>
            </div>
            <p className="text-xs text-purple-300">Multi-admin governance portal</p>
          </div>
        </div>

        {step === 'identity' ? (
          <form onSubmit={handleSelectIdentity} className="p-8 space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-base font-black text-white">Select Your Admin Identity</h2>
              <p className="text-xs text-slate-400">Choose which administrator account you are signing in as</p>
            </div>

            <div className="space-y-2">
              {admins.map(admin => (
                <label key={admin.id} className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedAdminId === admin.id 
                    ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/30' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}>
                  <input type="radio" name="admin" value={admin.id} 
                    checked={selectedAdminId === admin.id}
                    onChange={() => setSelectedAdminId(admin.id)}
                    className="w-4 h-4 accent-purple-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-sm text-white">{admin.alias}</span>
                      {admin.active && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold">● Online</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">{admin.email}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Last login: {admin.lastLogin} • {admin.loginCount} logins</p>
                  </div>
                </label>
              ))}
            </div>

            <button type="submit"
              className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-500/20">
              Continue → Enter Passcode
            </button>

            <button type="button" onClick={() => setTab('auth')}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to user login</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-white">Enter Shared Admin Passcode</h2>
              <p className="text-xs text-slate-400">
                Signing in as <strong className="text-purple-300">{admins.find(a => a.id === selectedAdminId)?.alias}</strong>
              </p>
            </div>

            {error && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                error.includes('⛔') 
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Administrator Passcode</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center">
                  <Key className="w-4 h-4 text-purple-400" />
                </span>
                <input
                  type="password"
                  required
                  disabled={attempts >= 3}
                  placeholder="Enter shared admin passcode"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-2xl pl-10 pr-4 py-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-400 disabled:opacity-40"
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" disabled={attempts >= 3 || !adminPasscode}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 disabled:opacity-40">
              <Lock className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button type="button" onClick={() => { setStep('identity'); setAdminPasscode(''); setError(''); }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Switch admin identity</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
