# 🚀 SkillTok Backend - Production API

Real Node.js + Express backend with PostgreSQL, Stripe, Cloudinary video uploads, and email-based OTP.

---

## 📦 What This Backend Does (REAL Features)

| Feature | Service | Implementation |
|---------|---------|---------------|
| **Real Email OTP** | Nodemailer + Gmail | Sends 6-digit code to user's actual email inbox |
| **Real Password Hashing** | bcryptjs | 12-round bcrypt hashing in PostgreSQL |
| **Real JWT Auth** | jsonwebtoken | Access + refresh tokens |
| **Real Video Upload** | Cloudinary | Upload MP4 files → CDN URL + auto-thumbnail |
| **Real Stripe Payments** | Stripe API | Payment intents + webhook verification |
| **Real Database** | Render PostgreSQL | Users, videos, services, transactions tables |
| **Rate Limiting** | express-rate-limit | 100 req/15min per IP |
| **Security Headers** | helmet | CSP, HSTS, XSS protection |

---

## 🛠️ Step-by-Step Render Deployment

### 1. Create Free Accounts You'll Need
- **Render.com** — backend + database hosting
- **Cloudinary.com** — free tier video uploads (10GB free)
- **Gmail App Password** — for sending OTP emails
  - Go to https://myaccount.google.com/apppasswords
  - Generate a 16-character app password
- **Stripe.com** — payment processing (test keys to start)

### 2. Push This Backend Folder to GitHub
```bash
cd ~/skilltok-backend
git init
git add .
git commit -m "Production backend v1.0"
git branch -M main
git remote add origin https://github.com/favour187/skilltok-backend.git
git push -u origin main
```

### 3. Deploy on Render
1. Go to https://render.com → **New** → **Web Service**
2. Connect repo: `favour187/skilltok-backend`
3. Settings:
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Plan**: Free

### 4. Add PostgreSQL Database
1. Render Dashboard → **New** → **PostgreSQL**
2. Name: `skilltok-db`
3. Plan: Free
4. Copy the **Internal Database URL**

### 5. Add Environment Variables (Render → Environment tab)
```
PORT=8080
NODE_ENV=production
DATABASE_URL=<paste Render Internal Database URL>
JWT_SECRET=skilltok-jwt-prod-2026-very-long-random-string-here
JWT_REFRESH_SECRET=skilltok-refresh-prod-2026-very-long-random-string
ADMIN_REGISTRATION_SECRET=SKILLTOKFAVOUR@15

EMAIL_SERVICE=gmail
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your-16-char-gmail-app-password

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

CORS_ORIGIN=https://skilltok.onrender.com
```

### 6. Test the Live API
After deploy, test the health endpoint:
```
curl https://skilltok-backend.onrender.com/api/health
```

### 7. Point Frontend to Backend
In your frontend `~/skilltok-web`, set environment variable in Render:
```
VITE_BACKEND_URL=https://skilltok-backend.onrender.com
```

---

## 🔐 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account + send OTP email |
| POST | `/api/auth/login` | Login with email+password |
| POST | `/api/auth/verify-otp` | Confirm 6-digit code |
| POST | `/api/auth/resend-otp` | Resend OTP code |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/videos/feed` | Get video feed |
| POST | `/api/videos/upload` | Upload MP4 → Cloudinary |
| POST | `/api/videos/:id/like` | Like a video |
| GET | `/api/services` | List all freelance services |
| POST | `/api/services` | Create new service gig |
| POST | `/api/payments/create` | Create Stripe payment intent |
| POST | `/api/payments/webhook/stripe` | Stripe webhook handler |

---

## 🧪 Testing OTP Locally

After registering a new user, check your inbox at the email you registered with — you'll see the SkillTok 6-digit code styled in cyan branding.

If you don't receive it:
- Check Render logs for `Email send failed:`
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` (Gmail App Password, NOT account password)
- Confirm Gmail "Less Secure Apps" isn't blocking it

---

## 🎬 Cloudinary Video Setup

1. Sign up at https://cloudinary.com (free)
2. Dashboard → Account Details → copy:
   - Cloud Name
   - API Key
   - API Secret
3. Add to Render environment variables
4. Videos automatically get:
   - Streaming URL
   - Auto-generated thumbnail at 2-second mark
   - Hosted on global CDN
