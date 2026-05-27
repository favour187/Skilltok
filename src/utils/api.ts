import axios from 'axios';
import { storeToken, getToken, removeToken, isRateLimited, getRemainingAttempts, getResetSeconds, clearRateLimit } from './security';

// Force HTTPS in production
function ensureHttps(url: string): string {
  if (!url) return url;
  if (url.includes('localhost') || url.includes('127.0.0.1')) return url;
  return url.replace(/^http:\/\//i, 'https://');
}

/**
 * SMART BACKEND URL DETECTION
 * Auto-detects backend URL in this priority order:
 * 1. VITE_BACKEND_URL build-time env variable (from Railway/Vercel)
 * 2. window.SKILLTOK_BACKEND_URL runtime config (set via index.html or admin panel)
 * 3. localStorage override (allows admins to change URL on the fly)
 * 4. Same-domain /api prefix (if frontend and backend share domain)
 * 5. Default Railway URL fallback
 */
function detectBackendUrl(): string {
  // 1. Build-time env variable (set VITE_API_URL in Railway frontend service)
  const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl) return ensureHttps(envUrl);

  // 2. Runtime window config (allows changing without rebuild)
  if (typeof window !== 'undefined' && (window as any).SKILLTOK_BACKEND_URL) {
    return ensureHttps((window as any).SKILLTOK_BACKEND_URL);
  }

  // 3. localStorage override (admins can change URL via /settings without redeploying)
  try {
    const stored = localStorage.getItem('skilltok_backend_url_override');
    if (stored) return ensureHttps(stored);
  } catch {}

  // 4. IMPORTANT: Set VITE_BACKEND_URL in Railway frontend service variables.
  //    The fallback below is a placeholder and will NOT work unless you change it.
  return 'https://skilltok-backend-production.up.railway.app';
}

const LIVE_BACKEND_URL = detectBackendUrl();

// Log connection target for debugging
if (typeof console !== 'undefined') {
  console.log('🌐 SkillTok Backend:', LIVE_BACKEND_URL);
}

export const api = axios.create({
  baseURL: LIVE_BACKEND_URL,
  timeout: 30000, // 30 seconds (Railway cold starts can be slow)
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

// Expose URL change helper for admin debugging
if (typeof window !== 'undefined') {
  (window as any).SkillTokAPI = {
    currentUrl: LIVE_BACKEND_URL,
    setBackendUrl(url: string) {
      localStorage.setItem('skilltok_backend_url_override', url);
      window.location.reload();
    },
    reset() {
      localStorage.removeItem('skilltok_backend_url_override');
      window.location.reload();
    },
    async testConnection() {
      try {
        const response = await api.get('/api/health');
        console.log('✅ Backend OK:', response.data);
        return response.data;
      } catch (err: any) {
        console.error('❌ Backend unreachable:', err.message);
        return { error: err.message };
      }
    }
  };
}

// Force browser to upgrade insecure requests
if (typeof document !== 'undefined') {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = 'upgrade-insecure-requests';
  document.head.appendChild(meta);
}

// Interceptor to auto-add JWT Bearer token from secure storage
api.interceptors.request.use((config) => {
  const token = getToken('skilltok_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle token refresh if 401 occurs
api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    try {
      const refreshToken = getToken('skilltok_refresh_token');
      if (refreshToken) {
        const res = await axios.post(`${LIVE_BACKEND_URL}/api/auth/refresh`, { token: refreshToken });
        if (res.data.accessToken) {
          storeToken('skilltok_access_token', res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      }
    } catch (refreshErr) {
      removeToken('skilltok_access_token');
      removeToken('skilltok_refresh_token');
    }
  }
  return Promise.reject(error);
});

export const BackendService = {
  // ============ AUTH (Production: password is created by user, NEVER hardcoded) ============
  
  register: async (name: string, email: string, password: string, role: string, phone?: string, adminSecret?: string) => {
    const res = await api.post('/api/auth/register', { 
      name, 
      email, 
      password,  // User-defined password, never hardcoded
      role, 
      phone,
      adminSecret 
    });
    if (res.data.token) {
      storeToken('skilltok_access_token', res.data.token);
      if (res.data.refreshToken) storeToken('skilltok_refresh_token', res.data.refreshToken);
    }
    return res.data;
  },

  login: async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { 
      email, 
      password  // User-entered password, never hardcoded
    });
    if (res.data.token) {
      storeToken('skilltok_access_token', res.data.token);
      if (res.data.refreshToken) storeToken('skilltok_refresh_token', res.data.refreshToken);
    }
    return res.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const res = await api.post('/api/auth/verify-otp', { email, otp });
    return res.data;
  },

  setup2fa: async () => {
    const res = await api.post('/api/auth/2fa/setup');
    return res.data;
  },

  enable2fa: async (token: string) => {
    const res = await api.post('/api/auth/2fa/enable', { token });
    return res.data;
  },

  // ============ SERVICES ============
  getServices: async () => {
    const res = await api.get('/api/services');
    return res.data;
  },

  createService: async (serviceData: any) => {
    const res = await api.post('/api/services', serviceData);
    return res.data;
  },

  // ============ VIDEOS ============
  getFeed: async () => {
    const res = await api.get('/api/videos/feed');
    return res.data;
  },

  uploadVideo: async (videoData: any) => {
    const res = await api.post('/api/videos/upload', videoData);
    return res.data;
  },

  likeVideo: async (id: string) => {
    const res = await api.post(`/api/videos/${id}/like`);
    return res.data;
  },

  // ============ PAYMENTS (Stripe webhook verification required in production) ============
  createPayment: async (serviceId: string, amountCents: number, paymentMethod: string) => {
    const res = await api.post('/api/payments/create', { serviceId, amountCents, paymentMethod });
    return res.data;
  }
};

// ============ RATE LIMITING HELPERS ============

export const RateLimiter = {
  login: (): { blocked: boolean; remaining: number; resetSeconds: number } => ({
    blocked: isRateLimited('login', 5, 60_000),
    remaining: getRemainingAttempts('login', 5),
    resetSeconds: getResetSeconds('login')
  }),
  
  otp: (): { blocked: boolean; remaining: number; resetSeconds: number } => ({
    blocked: isRateLimited('otp', 3, 120_000),
    remaining: getRemainingAttempts('otp', 3),
    resetSeconds: getResetSeconds('otp')
  }),
  
  register: (): { blocked: boolean; remaining: number; resetSeconds: number } => ({
    blocked: isRateLimited('register', 3, 300_000),
    remaining: getRemainingAttempts('register', 3),
    resetSeconds: getResetSeconds('register')
  }),

  upload: (): { blocked: boolean; remaining: number; resetSeconds: number } => ({
    blocked: isRateLimited('upload', 10, 600_000),
    remaining: getRemainingAttempts('upload', 10),
    resetSeconds: getResetSeconds('upload')
  }),

  clear: clearRateLimit
};
