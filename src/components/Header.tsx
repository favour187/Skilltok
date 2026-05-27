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

  // Auto-close dropdowns when clicking anywhere else
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

  // Close other dropdown when opening one
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
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 lg:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab('feed')}>
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/30">
            <img src="/skilltok-logo.png" alt="SkillTok" className="w-full h-full object-cover" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">⚡</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-cyan-200 to-teal-400 bg-clip-text text-transparent">
                SkillTok
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                2026 Pro
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">Video Feed & Freelance Market</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Controls & Navigation Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Upload Button */}
          <button
            onClick={() => setTab('upload')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">Upload</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-cyan-500/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Notifications ({unreadCount})</h3>
                  <button 
                    onClick={() => markAllNotificationsRead()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.link && n.link.includes('services')) setTab('services');
                        }}
                        className={`p-3.5 hover:bg-slate-800/50 cursor-pointer transition-colors flex gap-3 ${!n.read ? 'bg-cyan-500/5 border-l-2 border-cyan-500' : ''}`}
                      >
                        <div className="mt-1">
                          {n.type === 'order' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {n.type === 'message' && <MessageSquare className="w-4 h-4 text-cyan-400" />}
                          {n.type === 'like' && <span className="text-sm">❤️</span>}
                          {n.type === 'system' && <ShieldCheck className="w-4 h-4 text-purple-400" />}
                        </div>
                        <div className="flex-1 text-xs">
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
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              >
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-7 h-7 rounded-lg object-cover ring-2 ring-cyan-500/50" 
                />
                <span className="text-xs font-semibold text-slate-200 hidden md:block max-w-[100px] truncate">
                  {user.name}
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white ${
                  user.role === 'admin' ? 'bg-purple-500' : user.role === 'agency' ? 'bg-amber-500' : user.role === 'seller' ? 'bg-cyan-500' : 'bg-slate-600'
                }`}>
                  {user.role}
                </span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="font-bold text-sm text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400 border border-slate-700">
                        Plan: <strong className="uppercase">{user.plan}</strong>
                      </span>
                      {user.twoFactorEnabled && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 2FA Secured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setTab('profile'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-slate-200 flex items-center gap-2.5"
                    >
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                      My Profile & Portfolio
                    </button>
                    
                    <button
                      onClick={() => { setTab('dashboard'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-slate-200 flex items-center gap-2.5"
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-400" />
                      Creator / Seller Dashboard
                    </button>

                    <button
                      onClick={() => { setTab('admin'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-slate-200 flex items-center gap-2.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      Admin Governance
                    </button>

                    <button
                      onClick={() => { setTab('settings'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-slate-200 flex items-center gap-2.5"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Account Settings & 2FA
                    </button>
                  </div>

                  <div className="border-t border-slate-800 pt-1">
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-rose-500/10 text-rose-400 flex items-center gap-2.5"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setTab('auth' as any)}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-cyan-500/20"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
