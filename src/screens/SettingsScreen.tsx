import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PlanType } from '../types';
import {
  Settings, ShieldCheck, Zap, QrCode, Bell, Eye, Palette, Link2,
  User, Globe, Lock, ChevronRight, Check, Moon, Sun, Smartphone,
  Mail, MessageSquare, ShoppingBag, Heart, X, Camera, Save,
  AlertTriangle, Trash2, LogOut, ExternalLink
} from 'lucide-react';
import { SubscriptionPaymentModal } from '../components/SubscriptionPaymentModal';

type SettingsTab = 'plan' | 'security' | 'notifications' | 'privacy' | 'appearance' | 'profile' | 'linked';

export const SettingsScreen: React.FC = () => {
  const { user, updateUserPlan, setup2FA, enable2FA, updateUserProfile, logout, setTab } = useAppStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [show2FAConfig, setShow2FAConfig] = useState(false);
  const [twoFAMessage, setTwoFAMessage] = useState('');
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);

  // Profile edit state
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true, messages: true, newFollowers: true,
    promotions: false, weeklyDigest: true, securityAlerts: true,
    pushEnabled: true, emailEnabled: true, smsEnabled: false,
  });

  // Privacy
  const [privacyPrefs, setPrivacyPrefs] = useState({
    profilePublic: true, showEarnings: false, showOnlineStatus: true,
    allowDMs: true, indexedSearch: true, showCompletedOrders: true,
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    theme: 'dark' as 'dark' | 'light' | 'system',
    compactMode: false,
    reducedMotion: false,
    language: 'en',
  });

  const handlePlanSelect = (plan: PlanType) => {
    if (plan === 'free') { updateUserPlan('free'); return; }
    if (user?.plan === plan) return;
    setPendingPlan(plan);
  };

  const handlePaymentSuccess = (plan: PlanType, ref: string) => {
    updateUserPlan(plan);
    setPendingPlan(null);
  };

  const handleStart2FA = () => {
    const s = setup2FA();
    setSecret(s);
    setShow2FAConfig(true);
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    const success = enable2FA(verificationCode);
    setTwoFAMessage(success ? '✓ 2FA Authenticator verified successfully!' : '✗ Invalid 6-digit code.');
    if (success) setTimeout(() => setShow2FAConfig(false), 1500);
  };

  const handleSaveProfile = () => {
    updateUserProfile({ name: editName, bio: editBio, username: editUsername });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );

  const sidebarItems: { id: SettingsTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'profile',       label: 'Edit Profile',      icon: User },
    { id: 'plan',          label: 'Subscription Plan',  icon: Zap,         badge: user?.plan?.toUpperCase() },
    { id: 'security',      label: 'Security & 2FA',     icon: ShieldCheck, badge: user?.twoFactorEnabled ? '✓' : undefined },
    { id: 'notifications', label: 'Notifications',      icon: Bell },
    { id: 'privacy',       label: 'Privacy & Visibility', icon: Eye },
    { id: 'appearance',    label: 'Appearance',         icon: Palette },
    { id: 'linked',        label: 'Linked Accounts',    icon: Link2 },
  ];

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-70px)] pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6">

        {/* Page header */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 mb-6 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Account Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage your profile, security, notifications and preferences</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden sticky top-24">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold transition-all border-b border-slate-800/60 last:border-0 ${
                      isActive ? 'bg-cyan-500/10 text-cyan-400 border-l-4 border-l-cyan-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : ''}`} />
                      {item.label}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">{item.badge}</span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => { logout(); setTab('auth'); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 space-y-6 min-w-0">

            {/* ── PROFILE ── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <h2 className="font-black text-base text-white">Public Profile</h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={user?.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-700" />
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-400 transition-colors">
                        <Camera className="w-3.5 h-3.5 text-slate-950" />
                      </button>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{user?.name}</div>
                      <div className="text-xs text-slate-400">@{user?.username}</div>
                      <button className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Change avatar photo →</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Display Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                        <input value={editUsername} onChange={e => setEditUsername(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Bio</label>
                      <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
                        placeholder="Tell buyers about your skills and experience..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none" />
                      <div className="text-right text-xs text-slate-500 mt-1">{editBio.length}/300</div>
                    </div>
                  </div>

                  <button onClick={handleSaveProfile}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                      profileSaved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                    }`}>
                    {profileSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                  </button>
                </div>

                {/* Danger zone */}
                <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-rose-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div>
                      <div className="font-bold text-sm text-white">Delete Account</div>
                      <div className="text-xs text-slate-400">Permanently delete all your data, gigs, and earnings history</div>
                    </div>
                    <button className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PLAN ── */}
            {activeTab === 'plan' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h2 className="font-black text-base text-white">Subscription Plan</h2>
                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded-full">Billed Monthly</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'free' as PlanType, name: 'Free', price: '$0', sub: 'Forever', fee: '5%', perks: ['Standard listing', 'Basic analytics', 'Community support'], color: 'slate' },
                      { id: 'pro' as PlanType, name: 'Pro', price: '$29', sub: '/month', fee: '4%', popular: true, perks: ['Boosted algorithm', 'Priority escrow', '2× gig slots', 'Advanced analytics', 'Email support'], color: 'cyan' },
                      { id: 'agency' as PlanType, name: 'Agency', price: '$99', sub: '/month', fee: '3%', perks: ['Lowest fees', 'Unlimited gigs', 'Dedicated manager', 'API access', 'White-label invoices'], color: 'purple' },
                    ].map(plan => {
                      const isCurrent = user?.plan === plan.id;
                      return (
                        <div key={plan.id} className={`relative p-5 rounded-2xl border flex flex-col transition-all ${
                          isCurrent
                            ? plan.color === 'purple' ? 'bg-purple-500/5 border-purple-500 ring-1 ring-purple-500/30' : 'bg-cyan-500/5 border-cyan-500 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                        }`}>
                          {plan.popular && !isCurrent && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full">
                              Most Popular
                            </span>
                          )}
                          {isCurrent && (
                            <span className="absolute -top-3 right-4 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                          <div className="mb-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{plan.name}</div>
                            <div className="text-2xl font-black text-white mt-1">{plan.price}<span className="text-sm font-normal text-slate-400">{plan.sub}</span></div>
                            <div className={`text-xs font-bold mt-1 ${plan.color === 'purple' ? 'text-purple-400' : plan.color === 'cyan' ? 'text-teal-400' : 'text-slate-400'}`}>
                              {plan.fee} Seller Fee
                            </div>
                          </div>
                          <ul className="space-y-1.5 flex-1 mb-5">
                            {plan.perks.map(perk => (
                              <li key={perk} className="flex items-center gap-2 text-xs text-slate-300">
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> {perk}
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => handlePlanSelect(plan.id)}
                            disabled={isCurrent}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                              isCurrent ? 'bg-slate-800 text-slate-500 cursor-default'
                              : plan.color === 'purple' ? 'bg-purple-500 hover:bg-purple-400 text-white'
                              : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-90 text-slate-950'
                            }`}>
                            {isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : '💳 Upgrade Now'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <h2 className="font-black text-base text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Security</h2>

                  {/* 2FA */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Authenticator App (TOTP)</div>
                        <div className="text-xs text-slate-400">Google Authenticator / Authy</div>
                      </div>
                    </div>
                    <button onClick={handleStart2FA} disabled={user?.twoFactorEnabled}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${user?.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'}`}>
                      {user?.twoFactorEnabled ? '✓ Enabled' : 'Set Up'}
                    </button>
                  </div>

                  {show2FAConfig && (
                    <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
                      <div className="text-xs font-bold text-cyan-400 flex items-center gap-2"><QrCode className="w-4 h-4" /> Scan with your Authenticator App</div>
                      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-900 rounded-xl">
                        <div className="w-32 h-32 bg-white p-3 rounded-xl flex items-center justify-center flex-shrink-0">
                          <div className="w-full h-full bg-slate-950 flex items-center justify-center font-mono text-xs text-cyan-400 text-center p-2">
                            [QR CODE]{'\n'}{secret.substring(0, 8)}...
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-400">
                          <p className="text-white font-bold">Setup Steps:</p>
                          <p>1. Open your authenticator app</p>
                          <p>2. Tap "+" to add a new account</p>
                          <p>3. Scan this QR code</p>
                          <p>4. Enter the 6-digit code below</p>
                          <p className="font-mono text-cyan-400 bg-slate-950 px-2 py-1 rounded mt-2">Secret: {secret}</p>
                        </div>
                      </div>
                      <form onSubmit={handleVerify2FA} className="flex gap-3 max-w-xs">
                        <input type="text" maxLength={6} placeholder="000000" value={verificationCode}
                          onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white tracking-[0.4em] text-center placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
                        <button type="submit" disabled={verificationCode.length !== 6}
                          className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl disabled:opacity-40">Verify</button>
                      </form>
                      {twoFAMessage && (
                        <div className={`p-3 rounded-xl text-xs font-bold ${twoFAMessage.includes('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{twoFAMessage}</div>
                      )}
                    </div>
                  )}

                  {/* Password change */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">Change Password</div>
                        <div className="text-xs text-slate-400">Last changed 3 months ago</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-xs text-slate-300 transition-all">Update</button>
                  </div>

                  {/* Active sessions */}
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Active Sessions</div>
                    {[
                      { device: 'Chrome / macOS', location: 'Lagos, Nigeria', current: true, time: 'Now' },
                      { device: 'Safari / iPhone 15', location: 'Lagos, Nigeria', current: false, time: '2 hours ago' },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-4 h-4 text-slate-500" />
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              {session.device}
                              {session.current && <span className="text-[10px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Current</span>}
                            </div>
                            <div className="text-xs text-slate-400">{session.location} · {session.time}</div>
                          </div>
                        </div>
                        {!session.current && (
                          <button className="text-xs text-rose-400 hover:text-rose-300 font-bold">Revoke</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h2 className="font-black text-base text-white flex items-center gap-2"><Bell className="w-5 h-5 text-cyan-400" /> Notification Preferences</h2>

                {/* Channels */}
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Delivery Channels</div>
                  <div className="space-y-3">
                    {[
                      { key: 'pushEnabled', icon: Smartphone, label: 'Push Notifications', desc: 'Real-time alerts on your device' },
                      { key: 'emailEnabled', icon: Mail, label: 'Email Notifications', desc: user?.email || '' },
                      { key: 'smsEnabled', icon: MessageSquare, label: 'SMS Notifications', desc: user?.phoneNumber || 'Not set' },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="font-bold text-sm text-white">{item.label}</div>
                              <div className="text-xs text-slate-500">{item.desc}</div>
                            </div>
                          </div>
                          <Toggle checked={(notifPrefs as any)[item.key]} onChange={() => setNotifPrefs(p => ({ ...p, [item.key]: !(p as any)[item.key] }))} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Event types */}
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Notify Me About</div>
                  <div className="space-y-2">
                    {[
                      { key: 'orderUpdates',  label: 'Order & Escrow Updates', desc: 'New orders, deliveries, payments' },
                      { key: 'messages',      label: 'Direct Messages', desc: 'New chat messages from buyers/sellers' },
                      { key: 'newFollowers',  label: 'New Followers & Reviews', desc: 'When someone follows or reviews you' },
                      { key: 'securityAlerts',label: 'Security Alerts', desc: 'Logins from new devices, password changes' },
                      { key: 'weeklyDigest',  label: 'Weekly Performance Digest', desc: 'Summary of views, earnings, and orders' },
                      { key: 'promotions',    label: 'Promotions & Offers', desc: 'SkillTok deals and feature updates' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
                        <div>
                          <div className="font-bold text-sm text-white">{item.label}</div>
                          <div className="text-xs text-slate-500">{item.desc}</div>
                        </div>
                        <Toggle checked={(notifPrefs as any)[item.key]} onChange={() => setNotifPrefs(p => ({ ...p, [item.key]: !(p as any)[item.key] }))} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {activeTab === 'privacy' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h2 className="font-black text-base text-white flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-400" /> Privacy & Visibility</h2>
                <div className="space-y-2">
                  {[
                    { key: 'profilePublic',      label: 'Public Profile', desc: 'Anyone can view your profile and portfolio' },
                    { key: 'showOnlineStatus',   label: 'Show Online Status', desc: 'Buyers see when you\'re active' },
                    { key: 'allowDMs',           label: 'Allow Direct Messages', desc: 'Anyone can message you without an order' },
                    { key: 'showCompletedOrders',label: 'Show Completed Orders Count', desc: 'Display number of jobs done on your profile' },
                    { key: 'showEarnings',       label: 'Show Earnings Badge', desc: 'Display total earnings milestone on profile' },
                    { key: 'indexedSearch',      label: 'Appear in Search Results', desc: 'Show profile in talent search and Google' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-slate-800/60 last:border-0">
                      <div>
                        <div className="font-bold text-sm text-white">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                      <Toggle checked={(privacyPrefs as any)[item.key]} onChange={() => setPrivacyPrefs(p => ({ ...p, [item.key]: !(p as any)[item.key] }))} />
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                  🔒 SkillTok never sells your data. <a href="#" className="underline hover:text-indigo-200">Read our Privacy Policy →</a>
                </div>
              </div>
            )}

            {/* ── APPEARANCE ── */}
            {activeTab === 'appearance' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h2 className="font-black text-base text-white flex items-center gap-2"><Palette className="w-5 h-5 text-purple-400" /> Appearance</h2>

                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Theme</div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'system', label: 'System', icon: Smartphone },
                    ].map(t => {
                      const Icon = t.icon;
                      return (
                        <button key={t.id} onClick={() => setAppearance(a => ({ ...a, theme: t.id as any }))}
                          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${appearance.theme === t.id ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-bold">{t.label}</span>
                          {appearance.theme === t.id && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'compactMode', label: 'Compact Mode', desc: 'Tighter spacing in lists and grids' },
                    { key: 'reducedMotion', label: 'Reduced Motion', desc: 'Minimize animations and transitions' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-slate-800/60 last:border-0">
                      <div>
                        <div className="font-bold text-sm text-white">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                      <Toggle checked={(appearance as any)[item.key]} onChange={() => setAppearance(a => ({ ...a, [item.key]: !(a as any)[item.key] }))} />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Language</div>
                  <select
                    value={appearance.language}
                    onChange={e => {
                      const lang = e.target.value;
                      setAppearance(a => ({ ...a, language: lang }));
                      // Actually apply the language change
                      localStorage.setItem('skilltok_lang', lang);
                      window.dispatchEvent(new Event('languagechange'));
                      // Reload so all translated strings update
                      setTimeout(() => window.location.reload(), 300);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
                    <option value="en">🇺🇸 English</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="pt">🇧🇷 Português</option>
                    <option value="ar">🇸🇦 العربية</option>
                    <option value="yo">🇳🇬 Yorùbá</option>
                    <option value="ha">🇳🇬 Hausa</option>
                    <option value="ig">🇳🇬 Igbo</option>
                    <option value="pcm">🇳🇬 Pidgin</option>
                  </select>
                </div>
              </div>
            )}

            {/* ── LINKED ACCOUNTS ── */}
            {activeTab === 'linked' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="font-black text-base text-white flex items-center gap-2"><Link2 className="w-5 h-5 text-blue-400" /> Linked Accounts & Integrations</h2>
                {[
                  { name: 'Google', icon: '🔵', desc: 'Login with Google OAuth', connected: true },
                  { name: 'GitHub', icon: '⚫', desc: 'Show GitHub projects on profile', connected: false },
                  { name: 'LinkedIn', icon: '🔷', desc: 'Import skills and work history', connected: false },
                  { name: 'Behance', icon: '🎨', desc: 'Sync design portfolio', connected: false },
                  { name: 'Dribbble', icon: '🏀', desc: 'Showcase UI/UX shots', connected: false },
                  { name: 'PayPal', icon: '💙', desc: 'Receive international payouts', connected: false },
                ].map(acct => (
                  <div key={acct.name} className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{acct.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-white">{acct.name}</div>
                        <div className="text-xs text-slate-500">{acct.desc}</div>
                      </div>
                    </div>
                    <button className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      acct.connected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}>
                      {acct.connected ? '✓ Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            )}

          </main>
        </div>
      </div>

      {pendingPlan && (
        <SubscriptionPaymentModal
          open={!!pendingPlan}
          plan={pendingPlan}
          onClose={() => setPendingPlan(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
