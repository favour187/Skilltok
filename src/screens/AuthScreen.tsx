import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Role } from '../types';
import { ShieldCheck, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { UserRegistry } from '../utils/userRegistry';
import { bugWatchdog } from '../utils/bugWatchdog';
import { useTranslation } from '../utils/useTranslation';
import { api } from '../utils/api';

export const AuthScreen: React.FC<{ defaultMode?: 'login' | 'register' }> = ({ defaultMode = 'login' }) => {
  const { setTab, loginWithOAuth } = useAppStore();
  const { t } = useTranslation();

  const [isRegistering, setIsRegistering] = useState(defaultMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('buyer');
  const [phoneCountry, setPhoneCountry] = useState('+1 US');
  const [phoneDigits, setPhoneDigits] = useState('');

  // OTP Verification state
  const [step, setStep] = useState<'form' | 'otp' | 'forgot' | 'reset'>('form');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpValue, setOtpValue] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'newpass'>('email');
  const [forgotMsg, setForgotMsg] = useState('');

  const AGENCY_SETUP_FEE_KOBO = 16335000; // ₦163,350 (same as current Agency monthly plan)

  const persistAuthUser = (authUser: any) => {
    localStorage.setItem('skilltok_user', JSON.stringify(authUser));
    localStorage.setItem('skilltok_is_authenticated', JSON.stringify(true));
  };

  const roles: { id: Role; label: string; desc: string; icon: string }[] = [
    { id: 'buyer',  label: 'Buyer',          desc: 'Browse services & secure escrow', icon: '🛍️' },
    { id: 'seller', label: 'Creator',         desc: 'Upload videos & sell freelance gigs', icon: '⚡' },
    { id: 'hybrid', label: 'Both (Hybrid)',   desc: 'Buy & Sell simultaneously', icon: '🔄' },
    { id: 'agency', label: 'Agency',          desc: 'Team accounts with 3% seller fee', icon: '🏢' },
  ];

  /* ─── Validation helpers ─────────────────────────────── */
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateForm = (): string | null => {
    if (!email || !password) return 'Please fill in all required fields.';
    if (!emailRegex.test(email)) return 'Invalid email. Please enter a valid email (e.g., name@gmail.com).';
    if (isRegistering) {
      if (!name.trim()) return 'Please enter your display name.';
      if (password.length < 8) return 'Password must be at least 8 characters long.';
      if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
      if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
      if (!phoneDigits.trim()) return 'Please enter your phone number.';
      const digitsOnly = phoneDigits.replace(/\D/g, '');
      if (digitsOnly.length < 7) return 'Please enter a valid phone number.';
    }
    return null;
  };

  /* ─── Step 1: validate form then trigger OTP send ───── */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validateForm();
    if (err) { setAuthError(err); return; }

    setAuthError('');
    setIsLoading(true);

    try {
      // Send OTP to the email before showing the OTP step
      await api.post('/api/auth/send-otp', { email: email.toLowerCase() });
      setStep('otp');
    } catch (ex: any) {
      const msg = ex.response?.data?.error || ex.message;
      setAuthError(msg || 'Could not send OTP. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Step 2: verify OTP then register / login ───────── */
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setAuthError('Please enter the full 6-digit OTP code.');
      return;
    }

    // Security scan
    const xssCheck = bugWatchdog.scanForXSS(email + name, 'auth_form');
    const sqlCheck = bugWatchdog.scanForSQL(email + password, 'auth_form');
    if (!xssCheck.safe || !sqlCheck.safe) {
      setAuthError('⚠ Suspicious input blocked by security scanner.');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    const fullPhone = phoneDigits ? `${phoneCountry.split(' ')[0]} ${phoneDigits}` : undefined;

    try {
      if (isRegistering) {
        const otpResult = await UserRegistry.verifyOtp(email, fullOtp);
        if (!otpResult.success) {
          setAuthError(otpResult.error || 'OTP verification failed. Please check the code sent to your email.');
          setIsLoading(false);
          return;
        }
        const result = await UserRegistry.create({
          name: name || email.split('@')[0],
          email,
          password,
          role,
          phoneCountry: phoneCountry.split(' ')[0],
          phoneNumber: fullPhone,
        });
        setIsLoading(false);
        if (!result.success) {
          setAuthError(result.error || 'Registration failed.');
          setStep('form');
          return;
        }
        persistAuthUser(result.user);
        useAppStore.setState({ user: result.user, isAuthenticated: true });
        setTab('terms');
      } else {
        const otpResult = await UserRegistry.verifyOtp(email, fullOtp);
        if (!otpResult.success) {
          setAuthError(otpResult.error || 'OTP verification failed. Check your email for the code.');
          setIsLoading(false);
          return;
        }
        const result = await UserRegistry.login(email, password);
        setIsLoading(false);
        if (!result.success) {
          setAuthError(result.error || 'Login failed. Please check your password.');
          return;
        }
        persistAuthUser(result.user);
        useAppStore.setState({ user: result.user, isAuthenticated: true });
        setTab('feed');
      }
    } catch (err: any) {
      setIsLoading(false);
      setAuthError(err?.response?.data?.error || err?.message || 'Network error. Please check your connection and try again.');
    }
  };

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtpValue(digits);
    const arr = digits.split('');
    while (arr.length < 6) arr.push('');
    setOtp(arr);
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/send-otp', { email: email.toLowerCase() });
      setAuthError('');
      alert('✅ A new code has been sent to ' + email);
    } catch (ex: any) {
      setAuthError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Forgot password flow ───────────────────────────── */
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !emailRegex.test(forgotEmail)) {
      setForgotMsg('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: forgotEmail.toLowerCase() });
      setForgotMsg('');
      setForgotStep('otp');
    } catch (ex: any) {
      setForgotMsg(ex.response?.data?.error || 'Could not send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetOtp.length !== 6) {
      setForgotMsg('Please enter the 6-digit code sent to your email.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/api/auth/verify-reset-otp', { email: forgotEmail.toLowerCase(), otp: resetOtp });
      setForgotMsg('');
      setForgotStep('newpass');
    } catch (ex: any) {
      setForgotMsg(ex.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setForgotMsg('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(newPassword)) { setForgotMsg('Password must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(newPassword)) { setForgotMsg('Password must contain at least one number.'); return; }
    if (newPassword !== confirmPassword) { setForgotMsg('Passwords do not match.'); return; }
    setIsLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email: forgotEmail.toLowerCase(),
        otp: resetOtp,
        newPassword,
      });
      setForgotMsg('');
      alert('✅ Password reset successfully! You can now log in with your new password.');
      // Return to login
      setStep('form');
      setIsRegistering(false);
      setForgotStep('email');
      setForgotEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (ex: any) {
      setForgotMsg(ex.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Render: Forgot Password ────────────────────────── */
  if (step === 'forgot') {
    return (
      <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-cyan-950/60 via-slate-900 to-indigo-950/50 border-b border-slate-800">
            <h2 className="font-extrabold text-xl text-white">Reset Password</h2>
            <p className="text-xs text-slate-400 mt-1">We'll send a 6-digit reset code to your email</p>
          </div>

          <div className="p-6 space-y-5">
            {forgotMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400">
                {forgotMsg}
              </div>
            )}

            {forgotStep === 'email' && (
              <form onSubmit={handleForgotSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email" required placeholder="your@email.com"
                      value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black text-xs rounded-2xl disabled:opacity-50">
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
                <button type="button" onClick={() => { setStep('form'); setForgotStep('email'); setForgotMsg(''); }}
                  className="w-full text-xs text-slate-400 hover:text-white">← Back to Login</button>
              </form>
            )}

            {forgotStep === 'otp' && (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                <p className="text-xs text-slate-400">Enter the 6-digit code sent to <strong className="text-white">{forgotEmail}</strong></p>
                <input
                  type="text" inputMode="numeric" autoComplete="one-time-code"
                  value={resetOtp} onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-4 text-center font-mono font-black text-2xl tracking-[0.5em] text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                <button type="submit" disabled={isLoading || resetOtp.length !== 6}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black text-xs rounded-2xl disabled:opacity-50">
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button type="button" onClick={() => { setForgotStep('email'); setForgotMsg(''); }}
                  className="w-full text-xs text-slate-400 hover:text-white">← Back</button>
              </form>
            )}

            {forgotStep === 'newpass' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-400">Create a new strong password for <strong className="text-white">{forgotEmail}</strong></p>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="flex gap-1 mt-2">
                      <div className={`h-1 flex-1 rounded ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      <div className={`h-1 flex-1 rounded ${/[0-9]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      <div className={`h-1 flex-1 rounded ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password" required placeholder="Re-enter your new password"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-2xl disabled:opacity-50">
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Render: Main Auth ──────────────────────────────── */
  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-teal-500/10 to-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">

        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-br from-cyan-950/60 via-slate-900 to-indigo-950/50 border-b border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/30 flex-shrink-0">
            <img src="/skilltok-logo.png" alt="SkillTok" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-white">SkillTok</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Auth</span>
            </div>
            <p className="text-xs text-slate-400">Escrow Secured Marketplace & Creator Feed</p>
          </div>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-5">

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-extrabold text-white">
                {isRegistering ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <button type="button"
                onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold tracking-wide">
                {isRegistering ? 'Login instead ➔' : 'Create an account ➔'}
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400">
                {authError}
              </div>
            )}

            {/* OAuth buttons */}
            <div className="space-y-2">
              <button type="button"
                onClick={() => loginWithOAuth('google')}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => loginWithOAuth('linkedin')}
                  className="w-full py-3 bg-[#0A66C2] hover:bg-[#0856A8] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </button>
                <button type="button"
                  onClick={() => loginWithOAuth('github')}
                  className="w-full py-3 bg-[#24292e] hover:bg-[#1a1f24] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Or use email & password</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Your Role</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {roles.map(r => (
                    <button type="button" key={r.id} onClick={() => setRole(r.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        role === r.id
                          ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg ring-2 ring-cyan-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                      <span className="text-base block mb-1">{r.icon}</span>
                      <span className="font-extrabold text-xs block text-white">{r.label}</span>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">{r.desc}</span>
                    </button>
                  ))}
                </div>
                {role === 'agency' && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-100 leading-relaxed">
                    <strong className="text-amber-300">Agency account fee required:</strong> Agency registration includes the Agency plan fee of ₦163,350. After OTP verification your account opens on Agency plan; collect payment through Settings → Subscription if Paystack is not yet configured.
                  </div>
                )}
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" required placeholder="e.g. Favour"
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-xs text-white font-bold focus:outline-none focus:border-cyan-500 w-1/3">
                    <option value="+1 US">🇺🇸 +1 US</option>
                    <option value="+1 CA">🇨🇦 +1 CA</option>
                    <option value="+44 GB">🇬🇧 +44 GB</option>
                    <option value="+234 NG">🇳🇬 +234 NG</option>
                    <option value="+86 CN">🇨🇳 +86 CN</option>
                    <option value="+91 IN">🇮🇳 +91 IN</option>
                    <option value="+233 GH">🇬🇭 +233 GH</option>
                    <option value="+27 ZA">🇿🇦 +27 ZA</option>
                    <option value="+61 AU">🇦🇺 +61 AU</option>
                    <option value="+49 DE">🇩🇪 +49 DE</option>
                    <option value="+33 FR">🇫🇷 +33 FR</option>
                    <option value="+7 RU">🇷🇺 +7 RU</option>
                    <option value="+81 JP">🇯🇵 +81 JP</option>
                    <option value="+971 AE">🇦🇪 +971 AE</option>
                    <option value="+254 KE">🇰🇪 +254 KE</option>
                    <option value="+52 MX">🇲🇽 +52 MX</option>
                    <option value="+65 SG">🇸🇬 +65 SG</option>
                  </select>
                  <input type="tel" required placeholder="e.g. 812 345 6789"
                    value={phoneDigits} onChange={(e) => setPhoneDigits(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" required placeholder="e.g. favour@gmail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                {!isRegistering && (
                  <button type="button"
                    onClick={() => { setStep('forgot'); setForgotStep('email'); setForgotMsg(''); setForgotEmail(email); }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} required
                  placeholder={isRegistering ? 'Min 8 chars, 1 uppercase, 1 number' : 'Enter your password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isRegistering && password && (
                <div className="flex gap-1 mt-2">
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(password) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded ${/[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded ${/[^A-Za-z0-9]/.test(password) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                </div>
              )}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:opacity-90 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 disabled:opacity-50 transition-all">
              {isLoading
                ? <span>Sending OTP...</span>
                : <><span>{isRegistering ? (role === 'agency' ? 'Register Agency & Get OTP' : t('auth.register') + ' & Get OTP') : t('auth.login') + ' & Get OTP'}</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full mx-auto flex items-center justify-center border-2 border-cyan-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Enter 6-Digit OTP</h3>
              <p className="text-xs text-slate-400">
                A verification code was sent to <strong className="text-white font-mono">{email}</strong>
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400">
                {authError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">6-Digit Code</label>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code"
                value={otpValue} onChange={(e) => handleOtpChange(e.target.value)}
                placeholder="000000"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-4 text-center font-mono font-black text-2xl tracking-[0.5em] text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all"
                autoFocus
              />
              <div className="flex justify-center gap-2 pt-2">
                {otp.map((digit, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-all ${digit ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep('form'); setAuthError(''); }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl">
                Back
              </button>
              <button type="submit" disabled={otp.join('').length !== 6 || isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl disabled:opacity-40 shadow-lg shadow-cyan-500/20">
                {isLoading ? 'Verifying...' : 'Verify & Enter 🚀'}
              </button>
            </div>

            <button type="button" onClick={handleResendOtp} disabled={isLoading}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold disabled:opacity-40">
              Didn't receive it? Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
