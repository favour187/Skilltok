/**
 * SMART PAYMENT SERVICE
 * Auto-detects which provider based on environment variables.
 * Priority: Paystack → Flutterwave → Stripe
 *
 * Set ONE of these in Railway Variables:
 *   PAYSTACK_SECRET_KEY     → uses Paystack (NGN, recommended for Nigeria)
 *   FLUTTERWAVE_SECRET_KEY  → uses Flutterwave (multi-currency Africa)
 *   STRIPE_SECRET_KEY       → uses Stripe (global)
 */
import axios from 'axios';
import crypto from 'crypto';

interface InitPaymentOptions {
  email: string;
  amountCents: number;   // In smallest currency unit (kobo, cents)
  currency?: string;     // 'NGN', 'USD', 'GHS', etc.
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

interface PaymentResult {
  paymentUrl: string;
  reference: string;
  accessCode?: string;
}

interface ChargeCardOptions {
  email: string;
  amountCents: number;
  cardNumber: string;
  cardExpiry: string;  // MM/YY
  cardCvv: string;
  cardName: string;
  pin?: string;
  currency?: string;
}

function getProvider(): string {
  if (process.env.PAYSTACK_SECRET_KEY)    return 'paystack';
  if (process.env.FLUTTERWAVE_SECRET_KEY) return 'flutterwave';
  if (process.env.STRIPE_SECRET_KEY)      return 'stripe';
  return 'none';
}

const provider = getProvider();
console.log(`💳 Payment provider: ${provider}`);

// ─── Initialize a payment (redirect flow) ────────────────────────────────────
export async function initializePayment(opts: InitPaymentOptions): Promise<PaymentResult> {
  const ref = opts.reference || `ST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const callbackUrl = opts.callbackUrl || `${process.env.FRONTEND_URL}/payment/success`;

  switch (provider) {
    case 'paystack': {
      const res = await axios.post('https://api.paystack.co/transaction/initialize', {
        email:        opts.email,
        amount:       opts.amountCents,
        currency:     opts.currency || 'NGN',
        reference:    ref,
        callback_url: callbackUrl,
        metadata:     opts.metadata || {}
      }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
      return {
        paymentUrl:  res.data.data.authorization_url,
        reference:   res.data.data.reference,
        accessCode:  res.data.data.access_code
      };
    }

    case 'flutterwave': {
      const res = await axios.post('https://api.flutterwave.com/v3/payments', {
        tx_ref:       ref,
        amount:       opts.amountCents / 100,
        currency:     opts.currency || 'NGN',
        redirect_url: callbackUrl,
        customer: { email: opts.email },
        meta:         opts.metadata || {}
      }, { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } });
      return { paymentUrl: res.data.data.link, reference: ref };
    }

    case 'stripe': {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' as any });
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: (opts.currency || 'usd').toLowerCase(), unit_amount: opts.amountCents, product_data: { name: 'SkillTok Service' } }, quantity: 1 }],
        mode:        'payment',
        success_url: `${callbackUrl}?reference=${ref}`,
        cancel_url:  `${process.env.FRONTEND_URL}/payment/cancelled`,
        metadata:    { reference: ref, ...opts.metadata }
      });
      return { paymentUrl: session.url || '', reference: ref };
    }

    default:
      throw new Error('No payment provider configured. Set PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY, or STRIPE_SECRET_KEY in Railway Variables.');
  }
}

// ─── Verify a payment ─────────────────────────────────────────────────────────
export async function verifyPayment(reference: string): Promise<{ verified: boolean; amount?: number; currency?: string; email?: string }> {
  switch (provider) {
    case 'paystack': {
      const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });
      const d = res.data.data;
      return { verified: d.status === 'success', amount: d.amount, currency: d.currency, email: d.customer?.email };
    }

    case 'flutterwave': {
      const res = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
      });
      const d = res.data.data;
      return { verified: d.status === 'successful', amount: d.amount * 100, currency: d.currency, email: d.customer?.email };
    }

    case 'stripe': {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' as any });
      const sessions = await stripe.checkout.sessions.list({ limit: 10 });
      const session = sessions.data.find(s => s.metadata?.reference === reference);
      return { verified: session?.payment_status === 'paid', amount: session?.amount_total || 0 };
    }

    default:
      return { verified: false };
  }
}

// ─── Verify webhook signature ─────────────────────────────────────────────────
export function verifyWebhook(payload: string, signature: string): boolean {
  switch (provider) {
    case 'paystack': {
      const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
        .update(payload).digest('hex');
      return hash === signature;
    }
    case 'flutterwave': {
      return signature === process.env.FLUTTERWAVE_WEBHOOK_HASH;
    }
    case 'stripe': {
      try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
        stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
        return true;
      } catch { return false; }
    }
    default: return false;
  }
}

export { provider as paymentProvider };
