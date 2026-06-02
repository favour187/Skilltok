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
import { useState, useEffect, useCallback } from 'react';

// ── Map backend snake_case video fields → frontend camelCase ──────────────────
function mapVideo(v: any) {
  return {
    id: v.id,
    creatorId: v.creator_id || v.creatorId || '',
    creatorName: v.creator_name || v.creatorName || 'Unknown',
    creatorUsername: v.creator_username || v.creatorUsername || '',
    creatorAvatar: v.creator_avatar || v.creatorAvatar || '',
    creatorVerified: v.creator_verified || v.creatorVerified || false,
    title: v.title || '',
    description: v.description || '',
    videoUrl: v.video_url || v.videoUrl || '',
    thumbnailUrl: v.thumbnail_url || v.thumbnailUrl || '',
    category: v.category || 'General',
    views: Number(v.views) || 0,
    likes: Number(v.likes) || 0,
    shares: Number(v.shares) || 0,
    commentsCount: Number(v.comments_count || v.commentsCount) || 0,
    isLikedByMe: v.is_liked_by_me === true || v.isLikedByMe === true,
    isSavedByMe: v.is_saved_by_me === true || v.isSavedByMe === true,
    linkedServiceId: v.linked_service_id || v.linkedServiceId || null,
    createdAt: v.created_at || v.createdAt || '',
  };
}

// ── Decode JWT and build user object ─────────────────────────────────────────
function buildUserFromToken(token: string) {
  const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(base64));
  return {
    id: String(payload.userId || payload.id || ''),
    email: payload.email || '',
    name: payload.name ||
      payload.email?.split('@')[0]
        ?.replace(/[._]/g, ' ')
        ?.replace(/\b\w/g, (c: string) => c.toUpperCase()) ||
      'User',
    username: payload.username ||
      (payload.email?.split('@')[0]?.toLowerCase() + '_user') ||
      'user',
    avatar: payload.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.email || 'user')}&backgroundColor=06b6d4`,
    role: payload.role || 'buyer',
    plan: payload.plan || 'free',
    followersCount: 0,
    followingCount: 0,
    joinedDate: new Date().toISOString().split('T')[0],
  };
}

export default function App() {
  const {
    currentTab, user, isAuthenticated,
    reviewModalService, setReviewModalService,
    requirementsModalService, setRequirementsModalService,
    setSelectedServiceForCheckout, activeGigDetailId, setTab
  } = useAppStore();

  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWalletTransfer, setShowWalletTransfer] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);

  // ── Shared OAuth token handler (used by URL params AND deep link) ─────────
  const handleOAuthToken = useCallback((token: string) => {
    localStorage.setItem('skilltok_access_token', token);
    try {
      const oauthUser = buildUserFromToken(token);
      localStorage.setItem('skilltok_user', JSON.stringify(oauthUser));
      localStorage.setItem('skilltok_is_authenticated', JSON.stringify(true));
      useAppStore.setState({ user: oauthUser, isAuthenticated: true, currentTab: 'feed' as any });
    } catch (e) {
      console.error('OAuth token decode failed:', e);
    }
  }, []);

  // ── Handle web OAuth redirect: ?oauth_token=... ───────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('oauth_token') || params.get('token') || params.get('access_token');
    const oauthError = params.get('oauth_error') || params.get('error');

    if (oauthToken) {
      handleOAuthToken(oauthToken);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthError) {
      alert('Login failed: ' + decodeURIComponent(oauthError));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [handleOAuthToken]);

  // ── Handle Android deep link: com.skilltok.app://oauth?token=... ──────────
  useEffect(() => {
    const setupDeepLink = async () => {
      try {
        const { App: CapApp } = await import('@capacitor/app');
        CapApp.addListener('appUrlOpen', (data: { url: string }) => {
          if (data.url && data.url.includes('com.skilltok.app://oauth')) {
            try {
              const urlObj = new URL(data.url);
              const token = urlObj.searchParams.get('token');
              if (token) handleOAuthToken(token);
            } catch {}
          }
        });
      } catch {
        // @capacitor/app not available on web — that's fine
      }
    };
    setupDeepLink();
  }, [handleOAuthToken]);

  // ── Expose globals ────────────────────────────────────────────────────────
  useEffect(() => {
    (window as any).openOrderTracking = () => setShowOrderTracking(true);
    (window as any).openWalletTransfer = () => setShowWalletTransfer(true);
  }, []);

  // ── Register PWA service worker ───────────────────────────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // ── Fetch videos + services from backend; map fields ─────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('skilltok_access_token');
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
    const base =
      (import.meta as any).env?.VITE_BACKEND_URL ||
      localStorage.getItem('skilltok_backend_url_override') ||
      'https://skilltok-backend-production.up.railway.app';

    // Videos
    fetch(`${base}/api/videos/feed`, { headers })
      .then(r => r.ok ? r.json() : { videos: [] })
      .then(data => {
        const raw = Array.isArray(data) ? data : (data.videos || []);
        const mapped = raw.map(mapVideo).filter((v: any) => v.videoUrl && !String(v.videoUrl).startsWith('blob:'));
        if (mapped.length) {
          try { localStorage.setItem('skilltok_cached_videos', JSON.stringify(mapped)); } catch {}
          useAppStore.setState({ videos: mapped });
        }
      })
      .catch(() => {});

    // Services
    fetch(`${base}/api/services`, { headers })
      .then(r => r.ok ? r.json() : { services: [] })
      .then(data => {
        const raw = Array.isArray(data) ? data : (data.services || []);
        if (raw.length) useAppStore.setState({ services: raw });
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // ── Onboarding / profile builder ─────────────────────────────────────────
  useEffect(() => {
    if (currentTab === 'feed' && isAuthenticated && user && user.role !== 'admin') {
      const onboardingKey = `skilltok_onboarding_${user.id}`;
      const profileKey = `skilltok_profile_prompt_${user.id}`;
      if (!localStorage.getItem(onboardingKey)) {
        setTimeout(() => {
          setShowOnboarding(true);
          localStorage.setItem(onboardingKey, '1');
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

  const isAuthScreen = currentTab === 'auth' || currentTab === 'terms' || currentTab === 'adminLogin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      {!isAuthScreen && <Header />}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {!isAuthScreen && <Navigation />}
        <main className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${!isAuthScreen ? 'lg:pl-64' : ''}`}>
          {currentTab === 'feed'      && <FeedScreen />}
          {currentTab === 'services'  && <ServicesScreen />}
          {currentTab === 'upload'    && <UploadScreen />}
          {currentTab === 'chat'      && <ChatScreen />}
          {currentTab === 'dashboard' && <DashboardScreen />}
          {currentTab === 'profile'   && <ProfileScreen />}
          {currentTab === 'admin'     && <AdminScreen />}
          {currentTab === 'talent'    && <TalentScreen />}
          {currentTab === 'gigDetail' && activeGigDetailId && (
            <GigDetailScreen serviceId={activeGigDetailId} onBack={() => setTab('services')} />
          )}
          {currentTab === 'settings'   && <SettingsScreen />}
          {currentTab === 'auth'       && <AuthScreen />}
          {currentTab === 'terms'      && <TermsScreen />}
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
          if (svc) setSelectedServiceForCheckout(svc);
        }}
      />
    </div>
  );
}
