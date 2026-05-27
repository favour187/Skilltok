import { Router } from 'express';
import { db } from '../index';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getActiveProviders } from '../services/adapter';

const router = Router();

router.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, name, username, role, plan, is_verified, is_banned, created_at
       FROM users ORDER BY created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/ban', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_banned = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/users/:id/unban', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE users SET is_banned = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/videos/:id/block', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE videos SET is_blocked = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/transactions', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, b.name AS buyer_name, s.name AS seller_name
       FROM transactions t
       LEFT JOIN users b ON b.id = t.buyer_id
       LEFT JOIN users s ON s.id = t.seller_id
       ORDER BY t.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/analytics', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [users, videos, services, txs] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM users'),
      db.query('SELECT COUNT(*) AS count FROM videos'),
      db.query('SELECT COUNT(*) AS count FROM services WHERE is_active = true'),
      db.query(`SELECT COALESCE(SUM(base_price_cents),0) AS total, COUNT(*) AS count FROM transactions WHERE status = 'completed'`)
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalVideos: parseInt(videos.rows[0].count),
      activeServices: parseInt(services.rows[0].count),
      totalRevenueCents: parseInt(txs.rows[0].total),
      completedTransactions: parseInt(txs.rows[0].count)
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/providers', requireAuth, requireAdmin, (_req, res) => {
  res.json(getActiveProviders());
});

export default router;
