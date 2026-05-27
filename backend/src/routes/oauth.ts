/**
 * OAuth Routes — Google, GitHub, LinkedIn
 * Uses simple redirect flow with JWT issued on callback.
 * Set these env vars:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 *   LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
 *   FRONTEND_URL (e.g. https://your-app.railway.app)
 */
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../index';

const router = Router();

const JWT_SECRET   = process.env.JWT_SECRET || 'fallback-secret-change-me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Helper: upsert OAuth user and return JWT ────────────────────────────────
async function upsertOAuthUser(profile: {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatar: string;
}): Promise<string> {
  const { provider, providerId, email, name, avatar } = profile;

  // Check existing user by email
  let result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  let user = result.rows[0];

  if (!user) {
    // Create new user
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') + Math.floor(Math.random() * 100);
    const insertResult = await db.query(
      `INSERT INTO users (email, name, username, role, plan, avatar_url, is_verified, created_at)
       VALUES ($1, $2, $3, 'buyer', 'free', $4, true, NOW())
       RETURNING *`,
      [email.toLowerCase(), name, username, avatar]
    );
    user = insertResult.rows[0];
  } else {
    // Update avatar if missing
    if (!user.avatar_url && avatar) {
      await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatar, user.id]);
      user.avatar_url = avatar;
    }
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return token;
}

// ─── Helper: redirect to frontend with token or error ───────────────────────
function redirectWithToken(res: Response, token: string) {
  res.redirect(`${FRONTEND_URL}?oauth_token=${token}`);
}
function redirectWithError(res: Response, msg: string) {
  res.redirect(`${FRONTEND_URL}?oauth_error=${encodeURIComponent(msg)}`);
}

// ════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ════════════════════════════════════════════════════════════
router.get('/google', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return redirectWithError(res, 'Google OAuth not configured');
  const callbackUrl = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/auth/google/callback`);
  const scope = encodeURIComponent('openid email profile');
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${callbackUrl}&response_type=code&scope=${scope}`);
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code: string };
  if (!code) return redirectWithError(res, 'Google auth failed');
  try {
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: callbackUrl, grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) return redirectWithError(res, 'Google token exchange failed');

    // Get user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as any;

    const token = await upsertOAuthUser({
      provider: 'google', providerId: profile.sub,
      email: profile.email, name: profile.name,
      avatar: profile.picture || '',
    });
    redirectWithToken(res, token);
  } catch (e) {
    console.error('Google callback error:', e);
    redirectWithError(res, 'Google login failed');
  }
});

// ════════════════════════════════════════════════════════════
// GITHUB OAUTH
// ════════════════════════════════════════════════════════════
router.get('/github', (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return redirectWithError(res, 'GitHub OAuth not configured');
  const callbackUrl = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/auth/github/callback`);
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${callbackUrl}&scope=user:email`);
});

router.get('/github/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code: string };
  if (!code) return redirectWithError(res, 'GitHub auth failed');
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) return redirectWithError(res, 'GitHub token exchange failed');

    // Get user profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'SkillTok' },
    });
    const profile = await profileRes.json() as any;

    // Get primary email if not public
    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'SkillTok' },
      });
      const emails = await emailsRes.json() as any[];
      const primary = emails.find((e: any) => e.primary && e.verified);
      email = primary?.email;
    }
    if (!email) return redirectWithError(res, 'No verified email on GitHub account');

    const token = await upsertOAuthUser({
      provider: 'github', providerId: String(profile.id),
      email, name: profile.name || profile.login,
      avatar: profile.avatar_url || '',
    });
    redirectWithToken(res, token);
  } catch (e) {
    console.error('GitHub callback error:', e);
    redirectWithError(res, 'GitHub login failed');
  }
});

// ════════════════════════════════════════════════════════════
// LINKEDIN OAUTH
// ════════════════════════════════════════════════════════════
router.get('/linkedin', (req: Request, res: Response) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) return redirectWithError(res, 'LinkedIn OAuth not configured');
  const callbackUrl = encodeURIComponent(`${req.protocol}://${req.get('host')}/api/auth/linkedin/callback`);
  const scope = encodeURIComponent('openid profile email');
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${callbackUrl}&scope=${scope}`);
});

router.get('/linkedin/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code: string };
  if (!code) return redirectWithError(res, 'LinkedIn auth failed');
  try {
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/linkedin/callback`;
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: callbackUrl,
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) return redirectWithError(res, 'LinkedIn token exchange failed');

    // Get user profile (OpenID Connect)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as any;

    const token = await upsertOAuthUser({
      provider: 'linkedin', providerId: profile.sub,
      email: profile.email, name: profile.name,
      avatar: profile.picture || '',
    });
    redirectWithToken(res, token);
  } catch (e) {
    console.error('LinkedIn callback error:', e);
    redirectWithError(res, 'LinkedIn login failed');
  }
});

export default router;
