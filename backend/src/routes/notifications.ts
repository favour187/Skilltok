import { Router } from 'express';
import webpush from 'web-push';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';
import { sendPushNotification, getActiveProviders } from '../services/adapter';

// ── Configure VAPID keys for web-push ────────────────────────────────────────
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@skilltok.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const router = Router();

// ── GET all notifications for logged-in user ─────────────────────────────────
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET unread count ──────────────────────────────────────────────────────────
router.get('/unread-count', requireAuth, async (req: any, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.userId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH mark one notification as read ──────────────────────────────────────
router.patch('/:id/read', requireAuth, async (req: any, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH mark all as read ────────────────────────────────────────────────────
router.patch('/read-all', requireAuth, async (req: any, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.userId]
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST subscribe to push notifications ─────────────────────────────────────
router.post('/subscribe', requireAuth, async (req: any, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint)
      return res.status(400).json({ error: 'Invalid push subscription object.' });

    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id`,
      [req.user.userId, subscription.endpoint,
       subscription.keys?.p256dh, subscription.keys?.auth]
    );
    res.json({ subscribed: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Internal helper: send push to a user (used by other routes) ───────────────
export async function pushToUser(userId: string, title: string, body: string, url?: string) {
  try {
    const subs = await db.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    for (const sub of subs.rows) {
      const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
      await webpush.sendNotification(pushSub, JSON.stringify({ title, body, url: url || '/' }))
        .catch(() => {}); // Ignore expired subscriptions
    }
  } catch {}
}

export default router;
