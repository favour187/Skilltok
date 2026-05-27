import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CheckoutModal } from './components/CheckoutModal';
import { CommentsModal } from './components/CommentsModal';
import { ReportModal } from './components/ReportModal';
import { CreateServiceModal } from './components/CreateServiceModal';
import { ProfileBuilderModal } from './components/ProfileBuilderModal';
import { ReviewModal } from './components/ReviewModal';
import { OrderRequirementsModal } from './components/OrderRequirementsModal';
import { OnboardingTour } from './components/OnboardingTour';
import { WalletTransfer } from './components/WalletTransfer';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { PushNotify } from './utils/pushNotifications';
import { FeedScreen } from './screens/FeedScreen';
import { ServicesScreen } from './screens/ServicesScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ChatScreen } from './screens/ChatScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminScreen } from './screens/AdminScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { TermsScreen } from './screens/TermsScreen';
import { AdminLoginScreen } from './screens/AdminLoginScreen';
import { GigDetailScreen } from './screens/GigDetailScreen';
import { TalentScreen } from './screens/TalentScreen';

import { useState, useEffect } from 'react';

export default function App() {
  const { currentTab, user, isAuthenticated, reviewModalService, setReviewModalService, requirementsModalService, setRequirementsModalService, setSelectedServiceForCheckout, activeGigDetailId, setTab } = useAppStore();
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWalletTransfer, setShowWalletTransfer] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);

  // ── Handle OAuth redirect: ?oauth_token=... or ?oauth_error=... ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('oauth_token');
    const oauthError = params.get('oauth_error');

    if (oauthToken) {
      // Store JWT and decode basic user info from token payload
      localStorage.setItem('skilltok_access_token', oauthToken);
      try {
        const payload = JSON.parse(atob(oauthToken.split('.')[1]));
        const oauthUser = {
          id: String(payload.userId),
          email: payload.email || '',
          name: payload.email?.split('@')[0]?.toUpperCase() || 'User',
          username: payload.email?.split('@')[0]?.toLowerCase() + '_user' || 'user',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.email || 'user')}&backgroundColor=06b6d4`,
          role: payload.role || 'buyer',
          plan: 'free',
          followersCount: 0,
          followingCount: 0,
          joinedDate: new Date().toISOString().split('T')[0],
        };
        localStorage.setItem('skilltok_user', JSON.stringify(oauthUser));
        localStorage.setItem('skilltok_is_authenticated', 'true');
        useAppStore.setState({ user: oauthUser, isAuthenticated: true, currentTab: 'feed' });
      } catch {}
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthError) {
      alert('Login failed: ' + decodeURIComponent(oauthError));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Expose order tracking opener globally (used by DashboardScreen button)
  useEffect(() => {
    (window as any).openOrderTracking = () => setShowOrderTracking(true);
  }, []);

  const isAuthScreen = currentTab === 'auth' || currentTab === 'terms' || currentTab === 'adminLogin';


  // Register PWA service worker once
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Expose wallet transfer globally so other components can open it
  useEffect(() => {
    (window as any).openWalletTransfer = () => setShowWalletTransfer(true);
  }, []);

  // Fetch videos and services from backend on login / app load
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('skilltok_access_token');
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
    const base = (import.meta as any).env?.VITE_BACKEND_URL || '';

    // Load feed videos — cache to localStorage so they survive re-login
    fetch(`${base}/api/videos/feed`, { headers })
      .then(r => r.ok ? r.json() : { videos: [] })
      .then(data => {
        if (data.videos?.length) {
          try { localStorage.setItem('skilltok_cached_videos', JSON.stringify(data.videos)); } catch {}
          useAppStore.setState({ videos: data.videos });
        }
      })
      .catch(() => {});

    // Load services/gigs
    fetch(`${base}/api/services`, { headers })
      .then(r => r.ok ? r.json() : { services: [] })
      .then(data => {
        if (data.services?.length) {
          useAppStore.setState({ services: data.services });
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // First-time user: show onboarding tour, then profile builder
  useEffect(() => {
    if (currentTab === 'feed' && isAuthenticated && user && user.role !== 'admin') {
      const onboardingKey = `skilltok_onboarding_${user.id}`;
      const profileKey = `skilltok_profile_prompt_${user.id}`;

      if (!localStorage.getItem(onboardingKey)) {
        setTimeout(() => {
          setShowOnboarding(true);
          localStorage.setItem(onboardingKey, '1');
          // Request push notification permission silently after onboarding
          PushNotify.requestPermission().catch(() => {});
        }, 1000);
      } else if (!localStorage.getItem(profileKey)) {
        setTimeout(() => {
          setShowProfileBuilder(true);
          localStorage.setItem(profileKey, '1');
        }, 1500);
      }
    }
  }, [currentTab, user, isAuthenticated]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      {/* Top Navbar - hidden on auth screens */}
      {!isAuthScreen && <Header />}

      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Navigation Sidebar / Bottom bar - hidden on auth screens */}
        {!isAuthScreen && <Navigation />}

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${!isAuthScreen ? 'lg:pl-64' : ''}`}>
          {currentTab === 'feed' && <FeedScreen />}
          {currentTab === 'services' && <ServicesScreen />}
          {currentTab === 'upload' && <UploadScreen />}
          {currentTab === 'chat' && <ChatScreen />}
          {currentTab === 'dashboard' && <DashboardScreen />}
          {currentTab === 'profile' && <ProfileScreen />}
          {currentTab === 'admin' && <AdminScreen />}
          {currentTab === 'talent' && <TalentScreen />}
          {currentTab === 'gigDetail' && activeGigDetailId && (
            <GigDetailScreen serviceId={activeGigDetailId} onBack={() => setTab('services')} />
          )}
          {currentTab === 'settings' && <SettingsScreen />}
          {currentTab === 'auth' && <AuthScreen />}
          {currentTab === 'terms' && <TermsScreen />}
          {currentTab === 'adminLogin' && <AdminLoginScreen />}
        </main>
      </div>

      {/* Global Modals */}
      <CheckoutModal />
      <CommentsModal />
      <ReportModal />
      <CreateServiceModal />
      <ProfileBuilderModal open={showProfileBuilder} onClose={() => setShowProfileBuilder(false)} />
      <OnboardingTour open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <WalletTransfer open={showWalletTransfer} onClose={() => setShowWalletTransfer(false)} />
      <OrderTrackingModal open={showOrderTracking} onClose={() => setShowOrderTracking(false)} />
      <ReviewModal 
        open={!!reviewModalService}
        onClose={() => setReviewModalService(null)}
        serviceTitle={reviewModalService?.title || ''}
        sellerName={reviewModalService?.creatorName || ''}
        onSubmit={(review) => {
          alert(`✅ Review submitted!\nRating: ${review.rating}/5\n${review.tipAmount ? `Tip: $${review.tipAmount}` : ''}`);
        }}
      />
      <OrderRequirementsModal
        open={!!requirementsModalService}
        service={requirementsModalService}
        onClose={() => setRequirementsModalService(null)}
        onContinue={() => {
          const svc = requirementsModalService;
          setRequirementsModalService(null);
          if (svc) {
            setSelectedServiceForCheckout(svc);
          }
        }}
      />
    </div>
  );
}
