import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PlusCircle, MessageSquare, LayoutDashboard, ShieldCheck, Settings, Bell, Search, LogOut, CheckCircle2, UserCheck } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '../utils/useTranslation';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { 
    setTab, 
    user, 
    isAuthenticated, 
    logout, 
    searchQuery,
    setSearchQuery,
    notifications,
    markAllNotificationsRead,
    markNotificationRead
  } = useAppStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [showNotifications, showUserMenu]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-3 py-2 transition-colors duration-200">
      <div className="flex items-center justify-between gap-2">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setTab('feed')}>
          <div className="relative w-7 h-7 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/30">
            <img src="/skilltok-logo.png" alt="SkillTok" className="w-full h-full object-cover" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-900 flex items-center justify-center">
              <span className="text-[6px] font-bold text-white">⚡</span>
            </div>
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-cyan-200 to-teal-400 bg-clip-text text-transparent">
            SkillTok
          </span>
        </div>

        {/* Global Search Bar - hidden on mobile */}
        <div className="flex-1 max-w-xs relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Upload Button */}
          <button
            onClick={() => setTab('upload')}
            className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">Upload</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={toggleNotifications}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-cyan-500/10 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-xs text-white">Notifications ({unreadCount})</h3>
                  <button onClick={() => markAllNotificationsRead()} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.link && n.link.includes('services')) setTab('services');
                        }}
                        className={`p-3 hover:bg-slate-800/50 cursor-pointer transition-colors flex gap-2.5 ${!n.read ? 'bg-cyan-500/5 border-l-2 border-cyan-500' : ''}`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'order' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {n.type === 'message' && <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />}
                          {n.type === 'like' && <span className="text-xs">❤️</span>}
                          {n.type === 'system' && <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <div className="flex-1 text-[11px]">
                          <p className="font-semibold text-slate-200">{n.title}</p>
                          <p className="text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{n.createdAt}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Menu */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              >
                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-md object-cover ring-1 ring-cyan-500/50" />
                <span className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded text-white ${
                  user.role === 'admin' ? 'bg-purple-500' : user.role === 'agency' ? 'bg-amber-500' : user.role === 'seller' ? 'bg-cyan-500' : 'bg-slate-600'
                }`}>
                  {user.role}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-2.5 border-b border-slate-800">
                    <p className="font-bold text-xs text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 border border-slate-700">
                        Plan: <strong className="uppercase">{user.plan}</strong>
                      </span>
                      {user.twoFactorEnabled && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> 2FA
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setTab('profile'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-800 text-slate-200 flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> My Profile
                    </button>
                    <button onClick={() => { setTab('dashboard'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-800 text-slate-200 flex items-center gap-2">
                      <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" /> Dashboard
                    </button>
                    <button onClick={() => { setTab('admin'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-800 text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Admin
                    </button>
                    <button onClick={() => { setTab('settings'); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-800 text-slate-200 flex items-center gap-2">
                      <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings & 2FA
                    </button>
                  </div>
                  <div className="border-t border-slate-800 pt-1">
                    <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-rose-500/10 text-rose-400 flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setTab('auth' as any)}
              className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 rounded-lg text-xs font-black transition-all shadow-md shadow-cyan-500/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
