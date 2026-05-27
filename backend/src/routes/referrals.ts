import { Router } from 'express';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Log referral invite (fire-and-forget from frontend)
router.post('/invite', requireAuth, async (req: any, res) => {
  try {
    const { friendEmail, referrerCode } = req.body;
    if (!friendEmail || !referrerCode) return res.status(400).json({ error: 'friendEmail and referrerCode required' });

    // Log in audit table - non-blocking
    await db.query(
      `INSERT INTO audit_logs (user_id, action, target_type, metadata)
       VALUES ($1, 'referral_invite', 'user', $2)`,
      [req.user.userId, JSON.stringify({ friendEmail, referrerCode })]
    ).catch(() => {}); // swallow DB errors - this is non-critical

    res.json({ logged: true });
  } catch {
    res.json({ logged: false }); // Never fail - this is fire-and-forget
  }
});

// Get referral stats for current user
router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    const result = await db.query(
      `SELECT metadata FROM audit_logs WHERE user_id = $1 AND action = 'referral_invite'`,
      [req.user.userId]
    );
    res.json({ invites: result.rows.length, data: result.rows.map(r => r.metadata) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
