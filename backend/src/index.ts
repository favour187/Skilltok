import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';

import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import paymentRoutes from './routes/payments';
import serviceRoutes from './routes/services';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';
import reviewRoutes from './routes/reviews';
import messageRoutes from './routes/messages';
import disputeRoutes from './routes/disputes';
import referralRoutes from './routes/referrals';
import aiRoutes from './routes/ai';
import oauthRoutes from './routes/oauth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ============ SECURITY MIDDLEWARE ============
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.paystack.co", "https://checkout.paystack.com", "https://api.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'https://skilltok.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============ RATE LIMITERS ============
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true
});

const otpLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP requests. Please wait 2 minutes.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', strictAuthLimiter);
app.use('/api/auth/register', strictAuthLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/verify-reset-otp', otpLimiter);
app.use('/api', generalLimiter);

// ============ PostgreSQL connection pool ============
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// ============ Initialize database tables with security columns ============
async function initDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        username VARCHAR(100) UNIQUE,
        phone VARCHAR(50),
        phone_country VARCHAR(10),
        phone_verified BOOLEAN DEFAULT false,
        role VARCHAR(20) DEFAULT 'buyer',
        plan VARCHAR(20) DEFAULT 'free',
        avatar_url TEXT,
        bio TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_banned BOOLEAN DEFAULT false,
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP,
        last_login_ip VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      
      -- OAuth accounts do not have a local password, so this must be nullable.
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        attempts INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
      
      CREATE TABLE IF NOT EXISTS videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500),
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        category VARCHAR(100),
        linked_service_id UUID,
        views INT DEFAULT 0,
        likes INT DEFAULT 0,
        shares INT DEFAULT 0,
        is_blocked BOOLEAN DEFAULT false,
        moderation_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_videos_creator ON videos(creator_id);
      CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

      CREATE TABLE IF NOT EXISTS video_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        likes INT DEFAULT 0,
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE video_comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

      CREATE INDEX IF NOT EXISTS idx_comments_video ON video_comments(video_id);
      CREATE INDEX IF NOT EXISTS idx_comments_user ON video_comments(user_id);
      
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500),
        description TEXT,
        category VARCHAR(100),
        price_cents INT NOT NULL,
        delivery_days INT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES services(id),
        buyer_id UUID REFERENCES users(id),
        seller_id UUID REFERENCES users(id),
        base_price_cents INT NOT NULL,
        seller_fee_cents INT,
        platform_net_cents INT,
        payment_method VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        stripe_payment_id VARCHAR(255),
        delivery_proof_url TEXT,
        delivered_at TIMESTAMP,
        auto_release_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
      
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES users(id),
        target_type VARCHAR(20),
        target_id UUID,
        reason VARCHAR(100),
        evidence TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Reviews & ratings
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES services(id) ON DELETE CASCADE,
        transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE UNIQUE,
        buyer_id UUID REFERENCES users(id),
        seller_id UUID REFERENCES users(id),
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        communication_rating SMALLINT DEFAULT 5 CHECK (communication_rating BETWEEN 1 AND 5),
        service_as_described_rating SMALLINT DEFAULT 5 CHECK (service_as_described_rating BETWEEN 1 AND 5),
        recommend_rating SMALLINT DEFAULT 5 CHECK (recommend_rating BETWEEN 1 AND 5),
        tip_amount INT DEFAULT 0,
        seller_reply TEXT,
        replied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_seller  ON reviews(seller_id);

      -- Update services table with rating fields if missing
      ALTER TABLE services ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 0;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
      ALTER TABLE services ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
      ALTER TABLE services ADD COLUMN IF NOT EXISTS delivery_days INT DEFAULT 7;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

      -- Messages (direct)
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        attachment_url TEXT,
        attachment_type VARCHAR(20),
        is_read BOOLEAN DEFAULT false,
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_msg_sender   ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_msg_receiver ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_msg_thread   ON messages(sender_id, receiver_id);

      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) DEFAULT 'system',
        title VARCHAR(200),
        message TEXT,
        link VARCHAR(500),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

      -- Push subscriptions (web push)
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT,
        auth TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Follows
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(follower_id, following_id)
      );
      CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

      -- Disputes
      CREATE TABLE IF NOT EXISTS disputes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
        opened_by UUID REFERENCES users(id),
        reason VARCHAR(200) NOT NULL,
        evidence TEXT,
        requested_resolution VARCHAR(20) DEFAULT 'refund',
        status VARCHAR(20) DEFAULT 'open',
        resolution TEXT,
        verdict VARCHAR(10),
        resolved_by UUID REFERENCES users(id),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Add missing columns to users
      ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(100);
    `);
    console.log('✅ Database initialized with all tables & indexes');
  } catch (error: any) {
    console.error('❌ DB init error:', error.message);
  }
}

// ════════════════════════════════════════════════════════
// AUTO-RELEASE ESCROW — runs every 5 minutes
// If buyer hasn't disputed within 7 days of delivery,
// funds are automatically released to seller.
// ════════════════════════════════════════════════════════
async function autoReleaseEscrow() {
  try {
    const result = await db.query(
      `UPDATE transactions
       SET status = 'completed'
       WHERE status = 'delivered'
         AND auto_release_at IS NOT NULL
         AND auto_release_at <= NOW()
       RETURNING id, seller_id, base_price_cents, seller_fee_cents`
    );
    if (result.rows.length > 0) {
      console.log(`✅ Auto-released ${result.rows.length} escrow(s)`);
      // Notify each seller
      for (const tx of result.rows) {
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, link)
           VALUES ($1, 'order', 'Funds Released 💰',
             'Escrow funds for order #' || LEFT($2::text, 8) || ' have been released to your balance.',
             '/dashboard')`,
          [tx.seller_id, tx.id]
        );
      }
    }
  } catch (err: any) {
    console.warn('Auto-release escrow error:', err.message);
  }
}
setInterval(autoReleaseEscrow, 5 * 60 * 1000); // every 5 minutes

// ============ Health check ============
app.get('/api/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: !!process.env.DATABASE_URL,
      email: !!process.env.EMAIL_USER,
      sms: !!process.env.TWILIO_ACCOUNT_SID,
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
      paystack: !!process.env.PAYSTACK_SECRET_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY
    }
  });
});

// ============ Routes ============
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', oauthRoutes);

// 404
app.use((_, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, _: any, res: any, __: any) => {
  console.error('🔥 Server error:', err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

app.listen(PORT, async () => {
  console.log(`🚀 SkillTok API v1.0 running on port ${PORT}`);
  console.log(`🔒 Security: helmet + rate-limit + bcrypt + JWT`);
  if (process.env.DATABASE_URL) {
    await initDatabase();
  } else {
    console.warn('⚠ DATABASE_URL not set - skipping DB init');
  }
});
