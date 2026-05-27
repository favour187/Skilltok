/**
 * SMART EMAIL SERVICE
 * Auto-detects which provider to use based on environment variables.
 * Priority: Resend → SendGrid → Mailgun → Brevo → Nodemailer (Gmail/SMTP)
 *
 * Set ONE of these in Railway Variables:
 *   RESEND_API_KEY              → uses Resend (recommended)
 *   SENDGRID_API_KEY            → uses SendGrid
 *   MAILGUN_API_KEY             → uses Mailgun (+ MAILGUN_DOMAIN)
 *   BREVO_API_KEY               → uses Brevo
 *   EMAIL_USER + EMAIL_PASSWORD → uses Gmail/SMTP
 */
import nodemailer from 'nodemailer';
import axios from 'axios';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const FROM = process.env.EMAIL_FROM || '"SkillTok" <noreply@skilltok.com>';

function getProvider(): string {
  if (process.env.RESEND_API_KEY)   return 'resend';
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.MAILGUN_API_KEY)  return 'mailgun';
  if (process.env.BREVO_API_KEY)    return 'brevo';
  if (process.env.EMAIL_USER)       return 'nodemailer';
  return 'none';
}

const provider = getProvider();
console.log(`📧 Email provider: ${provider}`);

const nodemailerTransport = provider === 'nodemailer'
  ? nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host:    process.env.EMAIL_HOST,
      port:    process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : undefined,
      auth: { user: process.env.EMAIL_USER || '', pass: process.env.EMAIL_PASSWORD || '' },
    })
  : null;

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const { to, subject, html, from = FROM } = opts;

  switch (provider) {
    case 'resend': {
      await axios.post('https://api.resend.com/emails', { from, to, subject, html }, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }
      });
      break;
    }
    case 'sendgrid': {
      await axios.post('https://api.sendgrid.com/v3/mail/send', {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.EMAIL_USER || 'noreply@skilltok.com' },
        subject,
        content: [{ type: 'text/html', value: html }]
      }, { headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` } });
      break;
    }
    case 'mailgun': {
      const domain = process.env.MAILGUN_DOMAIN || '';
      const base = process.env.MAILGUN_REGION === 'eu'
        ? `https://api.eu.mailgun.net/v3/${domain}/messages`
        : `https://api.mailgun.net/v3/${domain}/messages`;
      await axios.post(base, new URLSearchParams({ from, to, subject, html }).toString(), {
        auth: { username: 'api', password: process.env.MAILGUN_API_KEY || '' },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      break;
    }
    case 'brevo': {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: 'SkillTok', email: process.env.EMAIL_USER || 'noreply@skilltok.com' },
        to: [{ email: to }], subject, htmlContent: html
      }, { headers: { 'api-key': process.env.BREVO_API_KEY } });
      break;
    }
    case 'nodemailer': {
      if (!nodemailerTransport) throw new Error('Nodemailer not configured');
      await nodemailerTransport.sendMail({ from, to, subject, html });
      break;
    }
    default: {
      console.warn(`⚠️  No email provider configured. Would send to: ${to} | Subject: ${subject}`);
    }
  }
}

export function otpEmailHtml(code: string, heading: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0f172a;color:white;padding:30px;border-radius:15px;">
      <h1 style="background:linear-gradient(to right,#06b6d4,#14b8a6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;margin:0 0 20px;">SkillTok</h1>
      <h2 style="color:white;margin:0 0 10px;">${heading}</h2>
      <p style="color:#94a3b8;">Your 6-digit verification code:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:20px;background:#1e293b;border-radius:12px;text-align:center;color:#06b6d4;margin:20px 0;">${code}</div>
      <p style="color:#64748b;font-size:12px;">Expires in 10 minutes. If you did not request this, ignore this email.</p>
    </div>
  `;
}
