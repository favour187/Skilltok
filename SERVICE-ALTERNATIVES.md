# SkillTok — Service Swap Guide

Every third-party service in this app can be replaced.
Just update the Railway environment variables and swap the relevant code file.

---

## SMS / OTP

| Current | Alternatives | Railway Variable |
|---|---|---|
| Twilio | **Termii**, Africa's Talking, Vonage, MessageBird | `TWILIO_ACCOUNT_SID` → `TERMII_API_KEY` |

**To switch to Termii**, in `backend/src/routes/auth.ts` replace:
```typescript
// Twilio
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
await client.messages.create({ body: `Your OTP: ${code}`, from: process.env.TWILIO_PHONE, to: phone });
```
With:
```typescript
// Termii
await fetch('https://api.ng.termii.com/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: process.env.TERMII_API_KEY,
    to: phone,
    from: 'SkillTok',
    sms: `Your SkillTok OTP is: ${code}. Expires in 10 minutes.`,
    type: 'plain',
    channel: 'generic'
  })
});
```
Railway variable: `TERMII_API_KEY=your_termii_key`

---

## File / Media Storage

| Current | Alternatives | Railway Variables |
|---|---|---|
| Cloudinary | **AWS S3**, Uploadcare, ImageKit, Backblaze B2 | `CLOUDINARY_*` → `S3_*` or `UPLOADCARE_*` |

**To switch to AWS S3**, in `backend/src/routes/users.ts` replace the cloudinary upload with:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION });
await s3.send(new PutObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: `avatars/${Date.now()}-${req.user.userId}`,
  Body: req.file.buffer,
  ContentType: req.file.mimetype,
  ACL: 'public-read'
}));
```
Railway variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`

---

## Payments

| Current | Alternatives | Railway Variables |
|---|---|---|
| Paystack | **Flutterwave**, Stripe, Monnify | Already in code — just use different keys |

All three are already wired in `backend/src/routes/payments.ts`.
- Paystack: set `PAYSTACK_SECRET_KEY`
- Flutterwave: set `FLUTTERWAVE_SECRET_KEY`
- Stripe: set `STRIPE_SECRET_KEY`

The code automatically uses whichever key is present.

---

## Email

| Current | Alternatives | Railway Variables |
|---|---|---|
| Gmail (nodemailer) | **Resend**, SendGrid, Mailgun, Brevo | `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` |

**To switch to Resend (recommended — easier than Gmail)**:
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'SkillTok <noreply@yourdomain.com>',
  to: email,
  subject: 'Your OTP Code',
  html: `<p>Your code is <strong>${code}</strong></p>`
});
```
Railway variable: `RESEND_API_KEY=re_your_key`
Get key free at: resend.com

---

## Database

| Current | Alternatives |
|---|---|
| PostgreSQL (Railway) | Supabase, Neon, PlanetScale (MySQL variant) |

Just change `DATABASE_URL` — the pg client works with any PostgreSQL-compatible database.

---

## Push Notifications

| Current | Alternatives |
|---|---|
| Web Push (VAPID) | Firebase FCM, OneSignal |

OneSignal is easiest — free tier, no key generation needed.
Replace `web-push` with OneSignal REST API calls.

