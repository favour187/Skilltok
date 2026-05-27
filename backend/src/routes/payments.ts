import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';
import { initializePayment, verifyPayment, getPaymentProvider } from '../services/adapter';

const router = Router();

// ── Initialize payment (auto-picks provider from env vars) ───────────────────
router.post('/init', requireAuth, async (req: any, res) => {
  try {
    const { serviceId, amountCents, currency } = req.body;
    if (!serviceId || !amountCents) return res.status(400).json({ error: 'serviceId and amountCents required' });

    const reference = `ST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const result = await initializePayment({
      email: req.user.email,
      amountCents,
      currency: currency || 'NGN',
      reference,
      callbackUrl: `${process.env.FRONTEND_URL}/payment/success`,
      metadata: { serviceId, buyerId: req.user.userId }
    });

    await db.query(
      `INSERT INTO transactions (service_id, buyer_id, base_price_cents, payment_method, stripe_payment_id, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [serviceId, req.user.userId, amountCents, getPaymentProvider(), reference]
    );

    res.json({ ...result, provider: getPaymentProvider() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Verify payment ────────────────────────────────────────────────────────────
router.get('/verify/:reference', requireAuth, async (req, res) => {
  try {
    const verified = await verifyPayment(req.params.reference);
    if (verified) {
      await db.query(
        `UPDATE transactions SET status = 'completed' WHERE stripe_payment_id = $1`,
        [req.params.reference]
      );
    }
    res.json({ verified, provider: getPaymentProvider() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Webhook (handles Paystack, Flutterwave, Stripe all in one) ───────────────
router.post('/webhook', async (req, res) => {
  try {
    const provider = getPaymentProvider();
    let reference: string | null = null;
    let success = false;

    if (provider === 'paystack') {
      const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(JSON.stringify(req.body)).digest('hex');
      if (hash !== req.headers['x-paystack-signature']) return res.status(401).send('Invalid signature');
      if (req.body.event === 'charge.success') { reference = req.body.data.reference; success = true; }
    }

    if (provider === 'flutterwave') {
      if (req.headers['verif-hash'] !== process.env.FLUTTERWAVE_WEBHOOK_HASH) return res.status(401).send('Invalid hash');
      if (req.body.event === 'charge.completed' && req.body.data.status === 'successful') {
        reference = req.body.data.tx_ref; success = true;
      }
    }

    if (provider === 'stripe') {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
      if (event.type === 'checkout.session.completed') {
        reference = event.data.object.metadata?.reference; success = true;
      }
    }

    if (success && reference) {
      await db.query(`UPDATE transactions SET status = 'completed' WHERE stripe_payment_id = $1`, [reference]);
      console.log(`✅ Payment confirmed: ${reference} via ${provider}`);
    }

    res.json({ received: true });
  } catch (e: any) {
    console.error('Webhook error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

// ── Charge card directly (subscription flow) ─────────────────────────────────
router.post('/charge-card', requireAuth, async (req: any, res) => {
  try {
    const { plan, amountCents, cardNumber, cardExpiry, cardCvv, cardName, pin } = req.body;
    const provider = getPaymentProvider();

    if (provider === 'paystack') {
      const axios = require('axios');
      const [mm, yy] = cardExpiry.split('/');
      const chargeRes = await axios.post('https://api.paystack.co/charge', {
        email: req.user.email,
        amount: amountCents,
        card: { number: cardNumber, cvv: cardCvv, expiry_month: mm, expiry_year: yy },
        pin,
        metadata: { plan, type: 'subscription' }
      }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });

      const data = chargeRes.data.data;
      if (data.status === 'success') {
        return res.json({ status: 'success', reference: data.reference });
      }
      return res.status(400).json({ error: data.display_text || 'Card charge failed' });
    }

    if (provider === 'flutterwave') {
      const axios = require('axios');
      const [mm, yy] = cardExpiry.split('/');
      const txRef = `ST-SUB-${Date.now()}`;
      const chargeRes = await axios.post('https://api.flutterwave.com/v3/charges?type=card', {
        card_number: cardNumber, cvv: cardCvv, expiry_month: mm, expiry_year: `20${yy}`,
        currency: 'NGN', amount: amountCents / 100, email: req.user.email,
        tx_ref: txRef, pin, authorization: { mode: 'pin', pin }
      }, { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } });

      if (chargeRes.data.data?.status === 'successful') {
        return res.json({ status: 'success', reference: txRef });
      }
      return res.status(400).json({ error: chargeRes.data.message || 'Card charge failed' });
    }

    res.status(400).json({ error: `Direct card charge not supported for ${provider}. Use payment link instead.` });
  } catch (e: any) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});


// ============ LEGACY PROVIDER-SPECIFIC ROUTES (kept for backward compat) ============

import axios from 'axios';

// Paystack init
router.post('/paystack/init', requireAuth, async (req: any, res) => {
  try {
    const { serviceId, amountKobo, email } = req.body;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email || req.user.email,
        amount: amountKobo,
        currency: 'NGN',
        callback_url: `${process.env.FRONTEND_URL}/payment/success`,
        metadata: { serviceId, buyerId: req.user.userId }
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' } }
    );

    await db.query(
      `INSERT INTO transactions (service_id, buyer_id, base_price_cents, payment_method, stripe_payment_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [serviceId, req.user.userId, amountKobo, 'paystack', response.data.data.reference, 'pending']
    );

    res.json({
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference
    });
  } catch (error: any) {
    console.error('Paystack init error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// Paystack verify
router.get('/paystack/verify/:reference', requireAuth, async (req, res) => {
  try {
    const { reference } = req.params;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    if (response.data.data.status === 'success') {
      await db.query(
        'UPDATE transactions SET status = $1 WHERE stripe_payment_id = $2',
        ['completed', reference]
      );
      return res.json({ verified: true, data: response.data.data });
    }
    res.json({ verified: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Flutterwave init
router.post('/flutterwave/init', requireAuth, async (req: any, res) => {
  try {
    const { serviceId, amount, email } = req.body;
    const txRef = `ST-FLW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const FLUTTERWAVE_SECRET = process.env.FLUTTERWAVE_SECRET_KEY || '';

    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: txRef,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
        customer: { email: email || req.user.email },
        meta: { serviceId, buyerId: req.user.userId }
      },
      { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET}` } }
    );

    await db.query(
      `INSERT INTO transactions (service_id, buyer_id, base_price_cents, payment_method, stripe_payment_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [serviceId, req.user.userId, Math.round(amount * 100), 'flutterwave', txRef, 'pending']
    );

    res.json({ payment_link: response.data.data.link, tx_ref: txRef });
  } catch (error: any) {
    console.error('Flutterwave init error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// Paystack webhook (legacy separate endpoint)
router.post('/webhook/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex');

  if (hash !== signature) return res.status(401).json({ error: 'Invalid Paystack signature' });

  const event = req.body;
  if (event.event === 'charge.success') {
    await db.query(
      'UPDATE transactions SET status = $1 WHERE stripe_payment_id = $2',
      ['completed', event.data.reference]
    );
  }
  res.json({ received: true });
});

// Flutterwave webhook (legacy separate endpoint)
router.post('/webhook/flutterwave', async (req, res) => {
  const signature = req.headers['verif-hash'] as string;
  if (signature !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    return res.status(401).json({ error: 'Invalid Flutterwave signature' });
  }

  const event = req.body;
  if (event.event === 'charge.completed' && event.data.status === 'successful') {
    await db.query(
      'UPDATE transactions SET status = $1 WHERE stripe_payment_id = $2',
      ['completed', event.data.tx_ref]
    );
  }
  res.json({ received: true });
});

// Paystack transfer to seller
router.post('/paystack/transfer', requireAuth, async (req: any, res) => {
  try {
    const { recipientCode, amountKobo, reason } = req.body;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
    const response = await axios.post(
      'https://api.paystack.co/transfer',
      { source: 'balance', amount: amountKobo, recipient: recipientCode, reason: reason || 'SkillTok creator payout' },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );
    res.json({ transfer: response.data.data });
  } catch (error: any) {
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// Create Paystack transfer recipient
router.post('/paystack/recipient', requireAuth, async (req: any, res) => {
  try {
    const { name, accountNumber, bankCode } = req.body;
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
    const response = await axios.post(
      'https://api.paystack.co/transferrecipient',
      { type: 'nuban', name, account_number: accountNumber, bank_code: bankCode, currency: 'NGN' },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );
    res.json({ recipient_code: response.data.data.recipient_code });
  } catch (error: any) {
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

export default router;
