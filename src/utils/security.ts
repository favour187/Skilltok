/**
 * SkillTok Security Utilities
 * XSS Sanitization, Rate Limiting, Input Validation, Token Security
 */

// ============ XSS & Input Sanitization ============

/** Strip all HTML tags and dangerous characters from user input */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;')
    .replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;|#96;)/g, '&amp;');
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/** Validate URL format */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Validate phone number digits only */
export function sanitizePhone(digits: string): string {
  return digits.replace(/[^\d\s+\-]/g, '').slice(0, 20);
}

// ============ Rate Limiting (Client-Side) ============

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore: Record<string, RateLimitEntry> = {};

/**
 * Client-side rate limiter to prevent brute force
 * @param key - unique key (e.g., 'login', 'otp')
 * @param maxAttempts - max allowed within window
 * @param windowMs - time window in milliseconds
 * @returns true if rate limited, false if allowed
 */
export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore[key];

  if (!entry || now > entry.resetAt) {
    rateLimitStore[key] = { count: 1, resetAt: now + windowMs };
    return false;
  }

  if (entry.count >= maxAttempts) {
    return true;
  }

  entry.count++;
  return false;
}

/** Get remaining attempts for a rate-limited action */
export function getRemainingAttempts(key: string, maxAttempts: number): number {
  const entry = rateLimitStore[key];
  if (!entry) return maxAttempts;
  return Math.max(0, maxAttempts - entry.count);
}

/** Get seconds until rate limit resets */
export function getResetSeconds(key: string): number {
  const entry = rateLimitStore[key];
  if (!entry) return 0;
  const remaining = Math.max(0, entry.resetAt - Date.now());
  return Math.ceil(remaining / 1000);
}

/** Clear rate limit for a key */
export function clearRateLimit(key: string): void {
  delete rateLimitStore[key];
}

// ============ Token Security ============

/**
 * SkillTok uses JWT tokens stored in memory/session where possible.
 * localStorage is used as a fallback for the web demo.
 * 
 * PRODUCTION RECOMMENDATION:
 * - Move to HttpOnly secure cookies for JWT storage
 * - Use SameSite=Strict; Secure; HttpOnly cookie flags
 * - Implement CSRF protection with double-submit cookie pattern
 * 
 * Current localStorage usage is for prototype/demo purposes only.
 */

export function storeToken(key: string, token: string): void {
  // PRODUCTION: Replace with HttpOnly cookie via backend Set-Cookie header
  localStorage.setItem(key, token);
}

export function getToken(key: string): string | null {
  return localStorage.getItem(key);
}

export function removeToken(key: string): void {
  localStorage.removeItem(key);
}

// ============ Input Validators for Uploads & Comments ============

const BLOCKED_WORDS = [
  '<script', 'javascript:', 'onerror=', 'onload=', '<iframe',
  'eval(', 'document.cookie', 'window.location',
];

export function detectMaliciousContent(input: string): boolean {
  const lower = input.toLowerCase();
  return BLOCKED_WORDS.some(word => lower.includes(word));
}

export function validateUploadTitle(title: string): string | null {
  if (!title || title.trim().length < 5) return 'Title must be at least 5 characters.';
  if (title.length > 200) return 'Title must be under 200 characters.';
  if (detectMaliciousContent(title)) return 'Title contains blocked content.';
  return null; // valid
}

export function validateComment(content: string): string | null {
  if (!content || content.trim().length < 1) return 'Comment cannot be empty.';
  if (content.length > 1000) return 'Comment must be under 1000 characters.';
  if (detectMaliciousContent(content)) return 'Comment contains blocked content.';
  return null; // valid
}

// ============ Payment Security ============

/**
 * ESCROW / PAYMENT SECURITY NOTES (Paystack / Flutterwave):
 * 
 * 1. Webhook Verification: Always verify Paystack signature using
 *    crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.body)
 * 
 * 2. Escrow Dispute Locking: When a dispute is raised, freeze escrow
 *    funds immediately and log all delivery timestamps.
 * 
 * 3. Payout Verification: Require admin approval for all payouts over ₦200,000.
 * 
 * 4. Anti-Fraud Checks:
 *    - Flag same-card-multiple-accounts
 *    - Flag rapid-fire orders from new accounts
 *    - Flag IP mismatches between payment and login
 */

export function verifyPaystackWebhookNote(): string {
  return `Webhook verification endpoint: POST /api/payments/webhook/paystack
  Must verify x-paystack-signature header using PAYSTACK_SECRET_KEY env var.
  Event types: charge.success, transfer.success, transfer.failed`;
}
