import { Router } from 'express';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ── Open a dispute ────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { transactionId, reason, evidence, requestedResolution } = req.body;

    if (!transactionId || !reason)
      return res.status(400).json({ error: 'transactionId and reason are required' });

    // Verify transaction belongs to buyer or seller
    const txResult = await db.query(
      `SELECT * FROM transactions WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [transactionId, req.user.userId]
    );
    if (txResult.rows.length === 0)
      return res.status(403).json({ error: 'Transaction not found or access denied.' });

    const tx = txResult.rows[0];

    if (tx.status === 'refunded' || tx.status === 'completed')
      return res.status(400).json({ error: 'Cannot dispute a completed or refunded order.' });

    // Check if dispute already open
    const existing = await db.query(
      'SELECT id FROM disputes WHERE transaction_id = $1 AND status = $2',
      [transactionId, 'open']
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'A dispute is already open for this order.' });

    const result = await db.query(
      `INSERT INTO disputes
         (transaction_id, opened_by, reason, evidence, requested_resolution)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [transactionId, req.user.userId, reason, evidence || '', requestedResolution || 'refund']
    );

    // Update transaction status
    await db.query(
      `UPDATE transactions SET status = 'disputed' WHERE id = $1`,
      [transactionId]
    );

    // Notify the other party
    const otherPartyId = tx.buyer_id === req.user.userId ? tx.seller_id : tx.buyer_id;
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'system', 'Dispute Opened', $2, '/dashboard')`,
      [otherPartyId, `A dispute has been opened on order #${transactionId.slice(0, 8)}.`]
    );

    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET dispute details ───────────────────────────────────────────────────────
router.get('/:transactionId', requireAuth, async (req: any, res) => {
  try {
    const result = await db.query(
      `SELECT d.*, 
         u.name AS opened_by_name,
         t.base_price_cents, t.status AS tx_status
       FROM disputes d
       JOIN users u ON u.id = d.opened_by
       JOIN transactions t ON t.id = d.transaction_id
       WHERE d.transaction_id = $1
         AND (t.buyer_id = $2 OR t.seller_id = $2)`,
      [req.params.transactionId, req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Dispute not found.' });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: resolve dispute ────────────────────────────────────────────────────
router.post('/:disputeId/resolve', requireAuth, async (req: any, res) => {
  try {
    // Only admin
    const adminCheck = await db.query(
      'SELECT role FROM users WHERE id = $1', [req.user.userId]
    );
    if (adminCheck.rows[0]?.role !== 'admin')
      return res.status(403).json({ error: 'Admin only.' });

    const { resolution, verdict } = req.body;
    // verdict: 'buyer' | 'seller' | 'split'

    const dispute = await db.query(
      `UPDATE disputes SET status = 'resolved', resolution = $1, verdict = $2,
         resolved_by = $3, resolved_at = NOW()
       WHERE id = $4 RETURNING *`,
      [resolution, verdict, req.user.userId, req.params.disputeId]
    );

    if (dispute.rows.length === 0)
      return res.status(404).json({ error: 'Dispute not found.' });

    // Update transaction
    const finalStatus = verdict === 'buyer' ? 'refunded' : 'completed';
    await db.query(
      `UPDATE transactions SET status = $1 WHERE id = $2`,
      [finalStatus, dispute.rows[0].transaction_id]
    );

    res.json(dispute.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
