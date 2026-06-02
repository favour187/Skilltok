import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../utils/useTranslation';
import { Video, ShoppingBag, MessageSquare, LayoutDashboard, ShieldCheck, PlusSquare, User, Users, LucideIcon } from 'lucide-react';

interface NavItem {
  id: 'feed' | 'services' | 'upload' | 'chat' | 'dashboard' | 'profile' | 'talent';
  label: string;
  icon: LucideIcon;
  isSpecial?: boolean;
  badge?: number;
}

export const Navigation: React.FC = () => {
  const { currentTab, setTab, user, conversations } = useAppStore();
  const { t } = useTranslation();

  const totalUnreadMessages = conversations.reduce((acc, curr) => acc + curr.unreadCount, 0);

  const navItems: NavItem[] = [
    { id: 'feed', label: t('nav.feed'), icon: Video },
    { id: 'services', label: t('nav.services'), icon: ShoppingBag },
    { id: 'talent', label: t('nav.talent'), icon: Users },
    { id: 'upload', label: t('common.upload'), icon: PlusSquare, isSpecial: true },
    { id: 'chat', label: t('nav.chat'), icon: MessageSquare, badge: totalUnreadMessages },
    { id: 'dashboard', label: t('nav.studio'), icon: LayoutDashboard },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-[65px] bottom-0 bg-slate-900 border-r border-slate-800 p-4 z-40 overflow-y-auto">
        <div className="space-y-1 my-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase px-3 tracking-wider mb-2">Main Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? item.isSpecial
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-bold'
                      : 'bg-cyan-500/10 text-cyan-400 font-bold border-l-4 border-cyan-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive && !item.isSpecial ? 'text-cyan-400' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-cyan-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Quick Admin Access */}
        {user?.role === 'admin' && (
          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <p className="text-[10px] font-bold text-purple-400 uppercase px-3 tracking-wider mb-2">Governance</p>
            <button
              onClick={() => setTab('admin')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                currentTab === 'admin'
                  ? 'bg-purple-500/15 text-purple-300 font-bold border-l-4 border-purple-500'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        )}

        {/* Footer info in sidebar */}
        <div className="mt-auto pt-4 border-t border-slate-800/80 text-xs text-slate-500 px-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span>Role Tier:</span>
            <span className="font-bold uppercase text-slate-300">{user?.role}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Fee Discount:</span>
            <span className="font-bold text-emerald-400">
              {user?.plan === 'agency' ? '3% Fee' : user?.plan === 'pro' ? '4% Fee' : '5% Base'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">SkillTok v2026.1</span>
            <button 
              onClick={() => setTab('terms' as any)}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline"
            >
              Terms & Legal ⚖️
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center justify-center relative p-2 rounded-xl transition-all ${
                  isActive
                    ? item.isSpecial
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/20 -translate-y-2 font-bold px-4'
                      : 'text-cyan-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isSpecial ? 'w-6 h-6' : ''}`} />
                <span className={`text-[10px] mt-1 ${item.isSpecial ? 'hidden' : 'block'}`}>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-1 right-1 bg-cyan-500 text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
