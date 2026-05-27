import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';
import { sendEmail } from '../services/adapter';

// Map DB snake_case row to camelCase user object for frontend
function mapUser(row: any) {
  return {
    id:             row.id,
    email:          row.email,
    name:           row.name,
    username:       row.username,
    role:           row.role,
    plan:           row.plan || 'free',
    avatar:         row.avatar_url || null,
    isVerified:     row.is_verified || false,
    followersCount: row.followers_count || 0,
    followingCount: row.following_count || 0,
    totalEarnings:  0,
    bio:            row.bio || '',
    skills:         [],
    location:       '',
    website:        '',
    isBanned:       row.is_banned || false,
  };
}


const router = Router();

const JWT_SECRET         = process.env.JWT_SECRET         || 'fallback-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

// ─── Helper: generate & store a 6-digit OTP ──────────────────────────────────
async function generateAndStoreOtp(email: string): Promise<string> {
  const otpCode  = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.query(
    'UPDATE otp_codes SET used = true WHERE email = $1 AND used = false',
    [email.toLowerCase()]
  );

  await db.query(
    'INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)',
    [email.toLowerCase(), otpCode, expiresAt]
  );

  return otpCode;
}

// ─── Helper: send OTP email ───────────────────────────────────────────────────
async function sendOtpEmail(email: string, code: string, subject: string, heading: string) {
  await sendEmail(email, subject, `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0f172a;color:white;padding:30px;border-radius:15px;">
      <h1 style="background:linear-gradient(to right,#06b6d4,#14b8a6);-webkit-background-clip:text;color:transparent;font-size:28px;">SkillTok</h1>
      <h2 style="color:white;">${heading}</h2>
      <p style="color:#94a3b8;">Your 6-digit verification code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:20px;background:#1e293b;border-radius:12px;text-align:center;color:#06b6d4;margin:20px 0;">
        ${code}
      </div>
      <p style="color:#64748b;font-size:12px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `);
}

// ════════════════════════════════════════════════════════════
// SEND OTP (before login or register — triggered by front-end
// before showing the OTP step)
// ════════════════════════════════════════════════════════════
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const code = await generateAndStoreOtp(email);

    try {
      await sendOtpEmail(
        email,
        code,
        'Your SkillTok Verification Code',
        'Welcome to SkillTok!'
      );
    } catch (mailErr: any) {
      console.warn('Email send failed (send-otp):', mailErr.message);
      // Don't block the request — the code is stored; user can request resend
    }

    res.json({ sent: true, message: 'Verification code sent to your email.' });
  } catch (error: any) {
    console.error('send-otp error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, phoneCountry, role } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ error: 'Missing required fields' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered. Please sign in.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const username     = name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000);

    // Check if OTP was already verified for this email (pre-register verify flow)
    const otpVerified = await db.query(
      `SELECT id FROM otp_codes WHERE email = $1 AND used = true ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase()]
    );
    const isVerified = otpVerified.rows.length > 0;

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, username, phone, phone_country, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, name, username, role, plan, avatar_url, is_verified, bio`,
      [email.toLowerCase(), passwordHash, name, username, phone, phoneCountry, role || 'buyer', isVerified]
    );

    const user = mapUser(result.rows[0]);

    const accessToken  = jwt.sign({ userId: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role }, JWT_SECRET,         { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: result.rows[0].id },                                     JWT_REFRESH_SECRET,  { expiresIn: '30d' });

    res.json({ user, token: accessToken, refreshToken, message: 'Account created successfully.' });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const result = await db.query(
      'SELECT id, email, password_hash, name, username, role, plan, avatar_url, is_banned, is_verified, bio, followers_count, following_count FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'No account found with this email' });

    const user = result.rows[0];

    if (user.is_banned)
      return res.status(403).json({ error: 'Account has been suspended. Contact support.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Incorrect password' });

    const accessToken  = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET,        { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id },                                     JWT_REFRESH_SECRET, { expiresIn: '30d' });

    res.json({ user: mapUser(user), token: accessToken, refreshToken });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// VERIFY OTP (registration / login step)
// ════════════════════════════════════════════════════════════
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ error: 'Email and OTP are required' });

    const result = await db.query(
      `SELECT id FROM otp_codes
       WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), otp]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Invalid or expired OTP code' });

    await db.query('UPDATE otp_codes SET used = true WHERE id = $1', [result.rows[0].id]);
    await db.query('UPDATE users SET is_verified = true WHERE email = $1', [email.toLowerCase()]);

    res.json({ verified: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// RESEND OTP
// ════════════════════════════════════════════════════════════
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const code = await generateAndStoreOtp(email);

    try {
      await sendOtpEmail(email, code, 'Your New SkillTok Verification Code', 'New Verification Code');
    } catch (mailErr: any) {
      console.warn('Resend email failed:', mailErr.message);
    }

    res.json({ sent: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// FORGOT PASSWORD — step 1: send reset OTP
// ════════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check account exists (don't reveal whether it does for security)
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    // Always respond success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return res.json({ sent: true, message: 'If an account with this email exists, a reset code has been sent.' });
    }

    const code = await generateAndStoreOtp(email);

    try {
      await sendOtpEmail(
        email,
        code,
        'SkillTok Password Reset Code',
        'Reset Your Password'
      );
    } catch (mailErr: any) {
      console.warn('Forgot-password email failed:', mailErr.message);
      return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
    }

    res.json({ sent: true, message: 'If an account with this email exists, a reset code has been sent.' });
  } catch (error: any) {
    console.error('forgot-password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// VERIFY RESET OTP — step 2
// ════════════════════════════════════════════════════════════
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ error: 'Email and OTP are required' });

    const result = await db.query(
      `SELECT id FROM otp_codes
       WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), otp]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Invalid or expired reset code. Please request a new one.' });

    // Don't mark as used yet — we still need it for the reset step to verify
    res.json({ verified: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// RESET PASSWORD — step 3
// ════════════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });

    if (newPassword.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    if (!/[A-Z]/.test(newPassword))
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });

    if (!/[0-9]/.test(newPassword))
      return res.status(400).json({ error: 'Password must contain at least one number' });

    // Verify the OTP one final time
    const otpResult = await db.query(
      `SELECT id FROM otp_codes
       WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [email.toLowerCase(), otp]
    );

    if (otpResult.rows.length === 0)
      return res.status(400).json({ error: 'Reset code is invalid or has expired. Please start again.' });

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email.toLowerCase()]);

    // Invalidate the OTP
    await db.query('UPDATE otp_codes SET used = true WHERE id = $1', [otpResult.rows[0].id]);

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error: any) {
    console.error('reset-password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ════════════════════════════════════════════════════════════
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded: any = jwt.verify(token, JWT_REFRESH_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
