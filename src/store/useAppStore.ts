import { create } from 'zustand';
import { User, Service, Video, VideoComment, Transaction, AppNotification, ChatConversation, Message, PlanType, Role } from '../types';
import { BackendService } from '../utils/api';

// ─── LocalStorage persistence helpers ────────────────────────────────────────
const LS_USER         = 'skilltok_user';
const LS_AUTH         = 'skilltok_is_authenticated';
const LS_VIDEOS       = 'skilltok_cached_videos';
const LS_TRANSACTIONS = 'skilltok_transactions';
const LS_SAVED        = 'skilltok_saved_services';
const LS_DARK         = 'skilltok_dark_mode';

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function lsClear(...keys: string[]) {
  keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
}

const buildGuestUser = (): User => ({
  id: 'guest-' + Date.now(),
  email: 'guest@skilltok.com',
  name: 'Guest',
  username: 'guest_user',
  avatar: `https://api.dicebear.com/7.x/initials/svg?seed=guest&backgroundColor=06b6d4`,
  role: 'buyer',
  plan: 'free',
  followersCount: 0,
  followingCount: 0,
  joinedDate: new Date().toISOString().split('T')[0],
});

interface AppState {
  currentTab: 'feed' | 'services' | 'upload' | 'chat' | 'dashboard' | 'profile' | 'admin' | 'settings' | 'auth' | 'terms' | 'adminLogin' | 'talent' | 'gigDetail';
  setTab: (tab: 'feed' | 'services' | 'upload' | 'chat' | 'dashboard' | 'profile' | 'admin' | 'settings' | 'auth' | 'terms' | 'adminLogin' | 'talent' | 'gigDetail') => void;
  activeGigDetailId: string | null;
  setActiveGigDetailId: (id: string | null) => void;
  isLiveApiMode: boolean;
  toggleLiveApiMode: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: Role) => boolean;
  loginWithOAuth: (provider: 'google' | 'github' | 'linkedin') => Promise<void>;
  register: (name: string, email: string, password: string, role: Role, adminSecret?: string) => void;
  logout: () => void;
  updateUserPlan: (plan: PlanType) => void;
  awardSkillCertificate: (cert: import('../types').SkillCertificate) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  setup2FA: () => string;
  enable2FA: (code: string) => boolean;

  videos: Video[];
  services: Service[];
  creators: User[];
  transactions: Transaction[];
  notifications: AppNotification[];
  comments: Record<string, VideoComment[]>;
  conversations: ChatConversation[];
  messages: Record<string, Message[]>;

  selectedServiceForCheckout: Service | null;
  savedServiceIds: string[];
  toggleSavedService: (id: string) => void;
  reviewModalService: Service | null;
  setReviewModalService: (s: Service | null) => void;
  requirementsModalService: Service | null;
  setRequirementsModalService: (s: Service | null) => void;
  setSelectedServiceForCheckout: (service: Service | null) => void;
  activeChatConversationId: string | null;
  setActiveChatConversationId: (id: string | null) => void;
  activeVideoForComments: Video | null;
  setActiveVideoForComments: (vid: Video | null) => void;
  isCreateServiceModalOpen: boolean;
  setCreateServiceModalOpen: (open: boolean) => void;
  isReportModalOpen: boolean;
  reportedTarget: { type: 'video' | 'user'; id: string; name: string } | null;
  openReportModal: (type: 'video' | 'user', id: string, name: string) => void;
  closeReportModal: () => void;

  toggleLikeVideo: (videoId: string) => void;
  toggleSaveVideo: (videoId: string) => void;
  addComment: (videoId: string, content: string) => void;
  uploadVideo: (video: Omit<Video, 'id' | 'creatorId' | 'creatorName' | 'creatorUsername' | 'creatorAvatar' | 'views' | 'likes' | 'shares' | 'commentsCount' | 'createdAt'>) => void;
  createService: (service: Omit<Service, 'id' | 'creatorId' | 'creatorName' | 'creatorUsername' | 'creatorAvatar' | 'rating' | 'reviewCount' | 'isActive' | 'createdAt'>) => void;
  createTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deliverOrder: (txId: string, proofUrl: string, notes: string) => void;
  approveOrder: (txId: string) => void;
  disputeOrder: (txId: string, reason: string) => void;
  sendMessage: (conversationId: string, content: string, receiverId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Restore persisted tab or default to auth ──
  currentTab: lsGet<string>(LS_AUTH, 'false') === 'true' ? 'feed' : 'auth' as any,
  setTab: (tab) => set({ currentTab: tab }),
  activeGigDetailId: null,
  setActiveGigDetailId: (id) => set({ activeGigDetailId: id }),
  isLiveApiMode: true,
  toggleLiveApiMode: () => set((state) => ({ isLiveApiMode: !state.isLiveApiMode })),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedCategory: 'All',
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  isDarkMode: lsGet<boolean>(LS_DARK, true),
  toggleDarkMode: () => set((state) => {
    const next = !state.isDarkMode;
    lsSet(LS_DARK, next);
    return { isDarkMode: next };
  }),

  // ── Restore persisted user & auth state ──
  user: lsGet<User | null>(LS_USER, null),
  isAuthenticated: lsGet<string>(LS_AUTH, 'false') === 'true',

  login: (email, password, requestedRole) => {
    if (get().isLiveApiMode) {
      BackendService.login(email, password || 'user_entered_password').catch(() => {});
    }
    const newUser: User = {
      id: 'u-' + Math.floor(Math.random() * 1000),
      email,
      name: email.split('@')[0].toUpperCase(),
      username: email.split('@')[0].toLowerCase() + '_user',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundColor=06b6d4`,
      role: requestedRole || 'buyer',
      plan: 'free',
      followersCount: 0,
      followingCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    lsSet(LS_USER, newUser);
    lsSet(LS_AUTH, 'true');
    set({ user: newUser, isAuthenticated: true });
    return true;
  },

  // ── OAuth: redirect to backend OAuth endpoint ──
  loginWithOAuth: async (provider) => {
    const { Browser } = await import('@capacitor/browser');
    const backendUrl =
      (import.meta as any).env?.VITE_BACKEND_URL ||
      (import.meta as any).env?.VITE_API_URL ||
      localStorage.getItem('skilltok_backend_url_override') ||
      'https://skilltok-backend-production.up.railway.app';
    const isNative = (window as any).Capacitor?.isNativePlatform?.();
    if (isNative) {
      await Browser.open({ url: `${backendUrl}/api/auth/${provider}` });
    } else {
      window.location.href = `${backendUrl}/api/auth/${provider}`;
    }
  },

  register: (name, email, password, role, adminSecret) => {
    const finalRole: Role = (adminSecret === 'SKILLTOKFAVOUR@15') ? 'admin' : role;
    if (get().isLiveApiMode) {
      BackendService.register(name, email, password || 'user_entered_password', finalRole, undefined, adminSecret).catch(() => {});
    }
    const newUser: User = {
      id: 'u-' + Date.now(),
      email,
      name,
      username: name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 100),
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
      role: finalRole,
      plan: finalRole === 'agency' ? 'agency' : finalRole === 'admin' ? 'agency' : 'free',
      followersCount: 0,
      followingCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      bio: `Hello! I am a new ${finalRole} on SkillTok.`,
      skills: ['General Freelancing'],
    };
    lsSet(LS_USER, newUser);
    lsSet(LS_AUTH, 'true');
    set({ user: newUser, isAuthenticated: true });
  },

  logout: () => {
    sessionStorage.removeItem('feed_index');
    lsClear(LS_USER, LS_AUTH, LS_TRANSACTIONS);
    set({ user: null, isAuthenticated: false, currentTab: 'auth', transactions: [] });
  },

  awardSkillCertificate: (cert) => {
    const user = get().user;
    if (!user) return;
    const existing = user.skillCertificates || [];
    const updated = existing.filter(c => c.skill !== cert.skill).concat(cert);
    const updatedUser = { ...user, skillCertificates: updated };
    lsSet(LS_USER, updatedUser);
    set({ user: updatedUser });
  },

  updateUserPlan: (plan) => {
    const user = get().user;
    if (user) {
      const updatedUser = { ...user, plan };
      lsSet(LS_USER, updatedUser);
      const notif: AppNotification = {
        id: 'n-' + Date.now(),
        userId: user.id,
        type: 'system',
        title: 'Plan Upgraded successfully! 🚀',
        message: `Your account has been upgraded to the ${plan.toUpperCase()} plan. Your seller fee is now ${plan === 'agency' ? '3%' : plan === 'pro' ? '4%' : '5%'}.`,
        read: false,
        createdAt: 'Just now'
      };
      set(state => ({ user: updatedUser, notifications: [notif, ...state.notifications] }));
    }
  },

  updateUserProfile: (updates) => {
    const user = get().user;
    if (user) {
      const updatedUser = { ...user, ...updates };
      lsSet(LS_USER, updatedUser);
      set({ user: updatedUser });
    }
  },

  setup2FA: () => {
    const secret = 'SKILLTOK2FASECRET' + Math.floor(Math.random() * 999999);
    const user = get().user;
    if (user) {
      const updatedUser = { ...user, twoFactorSecret: secret };
      lsSet(LS_USER, updatedUser);
      set({ user: updatedUser });
    }
    return secret;
  },

  enable2FA: (code) => {
    if (code.length === 6) {
      const user = get().user;
      if (user) {
        const updatedUser = { ...user, twoFactorEnabled: true };
        lsSet(LS_USER, updatedUser);
        set({ user: updatedUser });
        return true;
      }
    }
    return false;
  },

  // ── Persisted videos & transactions ──
  videos: lsGet<Video[]>(LS_VIDEOS, []),
  services: [],
  creators: [],
  transactions: lsGet<Transaction[]>(LS_TRANSACTIONS, []),
  notifications: [],
  comments: {},
  conversations: [],
  messages: {},

  selectedServiceForCheckout: null,
  setSelectedServiceForCheckout: (service) => set({ selectedServiceForCheckout: service }),
  savedServiceIds: lsGet<string[]>(LS_SAVED, []),
  toggleSavedService: (id) => {
    set((state) => {
      const isAlreadySaved = state.savedServiceIds.includes(id);
      const newList = isAlreadySaved
        ? state.savedServiceIds.filter(sid => sid !== id)
        : [...state.savedServiceIds, id];
      lsSet(LS_SAVED, newList);
      return { savedServiceIds: newList };
    });
  },
  reviewModalService: null,
  setReviewModalService: (s) => set({ reviewModalService: s }),
  requirementsModalService: null,
  setRequirementsModalService: (s) => set({ requirementsModalService: s }),
  activeChatConversationId: null,
  setActiveChatConversationId: (id) => set({ activeChatConversationId: id }),
  activeVideoForComments: null,
  setActiveVideoForComments: (vid) => set({ activeVideoForComments: vid }),
  isCreateServiceModalOpen: false,
  setCreateServiceModalOpen: (open) => set({ isCreateServiceModalOpen: open }),
  isReportModalOpen: false,
  reportedTarget: null,
  openReportModal: (type, id, name) => set({ isReportModalOpen: true, reportedTarget: { type, id, name } }),
  closeReportModal: () => set({ isReportModalOpen: false, reportedTarget: null }),

  toggleLikeVideo: (videoId) => {
    set((state) => {
      const updatedVideos = state.videos.map((vid) => {
        if (vid.id === videoId) {
          const isLiked = !vid.isLikedByMe;
          return { ...vid, isLikedByMe: isLiked, likes: isLiked ? vid.likes + 1 : vid.likes - 1 };
        }
        return vid;
      });
      lsSet(LS_VIDEOS, updatedVideos);
      return { videos: updatedVideos };
    });
  },

  toggleSaveVideo: (videoId) => {
    set((state) => {
      const updatedVideos = state.videos.map((vid) =>
        vid.id === videoId ? { ...vid, isSavedByMe: !vid.isSavedByMe } : vid
      );
      lsSet(LS_VIDEOS, updatedVideos);
      return { videos: updatedVideos };
    });
  },

  addComment: (videoId, content) => {
    const user = get().user || buildGuestUser();
    const newComment: VideoComment = {
      id: 'c-' + Date.now(),
      videoId,
      userId: user.id,
      userName: user.name,
      userUsername: user.username,
      userAvatar: user.avatar,
      content,
      createdAt: 'Just now',
      likes: 0,
      isLikedByMe: false,
    };
    set((state) => {
      const existing = state.comments[videoId] || [];
      const updatedComments = { ...state.comments, [videoId]: [newComment, ...existing] };
      const updatedVideos = state.videos.map(v =>
        v.id === videoId ? { ...v, commentsCount: v.commentsCount + 1 } : v
      );
      lsSet(LS_VIDEOS, updatedVideos);
      return { comments: updatedComments, videos: updatedVideos };
    });
  },

  uploadVideo: (vidData) => {
    const user = get().user || buildGuestUser();
    const newVideo: Video = {
      id: 'v-' + Date.now(),
      creatorId: user.id,
      creatorName: user.name,
      creatorUsername: user.username,
      creatorAvatar: user.avatar,
      views: 1,
      likes: 0,
      shares: 0,
      commentsCount: 0,
      createdAt: 'Just now',
      ...vidData,
    };
    set((state) => {
      const updatedVideos = [newVideo, ...state.videos];
      lsSet(LS_VIDEOS, updatedVideos);
      return { videos: updatedVideos, currentTab: 'feed' };
    });
  },

  createService: (servData) => {
    const user = get().user || buildGuestUser();
    const newService: Service = {
      id: 's-' + Date.now(),
      creatorId: user.id,
      creatorName: user.name,
      creatorUsername: user.username,
      creatorAvatar: user.avatar,
      rating: 5.0,
      reviewCount: 0,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      ...servData,
    };
    set((state) => ({
      services: [newService, ...state.services],
      isCreateServiceModalOpen: false,
      currentTab: 'services'
    }));
  },

  createTransaction: (txData) => {
    const newTx: Transaction = {
      id: 'tx-' + Math.floor(Math.random() * 90000 + 10000),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ...txData,
    };
    const notif: AppNotification = {
      id: 'n-' + Date.now(),
      userId: txData.buyerId,
      type: 'order',
      title: 'Payment Successful! 🎉',
      message: `Your payment for "${txData.serviceTitle}" has been processed via ${txData.paymentMethod.toUpperCase()}.`,
      read: false,
      createdAt: 'Just now',
      link: `/services/${txData.serviceId}`
    };
    set((state) => {
      const updatedTx = [newTx, ...state.transactions];
      lsSet(LS_TRANSACTIONS, updatedTx);
      return {
        transactions: updatedTx,
        notifications: [notif, ...state.notifications],
        selectedServiceForCheckout: null,
      };
    });
  },

  deliverOrder: (txId, proofUrl, notes) => {
    const deliveredAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const autoRel = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16);
    set((state) => {
      const updatedTx = state.transactions.map(t =>
        t.id === txId ? { ...t, status: 'delivered', deliveryProofUrl: proofUrl, deliveryNotes: notes, deliveredAt, autoReleaseDate: autoRel } : t
      );
      lsSet(LS_TRANSACTIONS, updatedTx);
      return {
        transactions: updatedTx,
        notifications: [{
          id: 'n-' + Date.now(),
          userId: state.transactions.find(t => t.id === txId)?.buyerId || 'u-100',
          type: 'order',
          title: 'Order Delivered! 📦',
          message: `The creator has submitted Proof of Delivery. Please inspect and accept within 3 days.`,
          read: false,
          createdAt: 'Just now'
        }, ...state.notifications]
      };
    });
  },

  approveOrder: (txId) => {
    set((state) => {
      const updatedTx = state.transactions.map(t =>
        t.id === txId ? { ...t, status: 'completed' } : t
      );
      lsSet(LS_TRANSACTIONS, updatedTx);
      return {
        transactions: updatedTx,
        notifications: [{
          id: 'n-' + Date.now(),
          userId: state.transactions.find(t => t.id === txId)?.sellerId || 'u-101',
          type: 'order',
          title: 'Escrow Released! 💰',
          message: `The buyer accepted your delivery. Net funds have been added to your Available Earnings.`,
          read: false,
          createdAt: 'Just now'
        }, ...state.notifications]
      };
    });
  },

  disputeOrder: (txId, reason) => {
    set((state) => {
      const updatedTx = state.transactions.map(t =>
        t.id === txId ? { ...t, status: 'disputed', disputeReason: reason } : t
      );
      lsSet(LS_TRANSACTIONS, updatedTx);
      return {
        transactions: updatedTx,
        notifications: [{
          id: 'n-' + Date.now(),
          userId: 'u-105',
          type: 'system',
          title: 'Escrow Dispute Raised 🚨',
          message: `Order #${txId} was disputed. Reason: ${reason}. Escrow frozen pending review.`,
          read: false,
          createdAt: 'Just now'
        }, ...state.notifications]
      };
    });
  },

  sendMessage: (convId, content, receiverId) => {
    const user = get().user || buildGuestUser();
    const newMsg: Message = {
      id: 'm-' + Date.now(),
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      receiverId,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };
    set((state) => {
      const existing = state.messages[convId] || [];
      const updatedMsgs = { ...state.messages, [convId]: [...existing, newMsg] };
      const updatedConvs = state.conversations.map(c =>
        c.id === convId ? { ...c, lastMessage: content, timestamp: newMsg.timestamp } : c
      );
      return { messages: updatedMsgs, conversations: updatedConvs };
    });
    setTimeout(() => {
      const replyMsg: Message = {
        id: 'm-reply-' + Date.now(),
        senderId: receiverId,
        senderName: 'SkillTok Creator',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        receiverId: user.id,
        content: `Got your message! I'm currently reviewing the details and will get back to you shortly. Thanks!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
      };
      set((state) => ({
        messages: { ...state.messages, [convId]: [...(state.messages[convId] || []), replyMsg] }
      }));
    }, 2000);
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  }
}));
