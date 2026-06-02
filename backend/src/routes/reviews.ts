import { Router } from 'express';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ── GET reviews for a service ────────────────────────────────────────────────
router.get('/service/:serviceId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name AS buyer_name, u.avatar_url AS buyer_avatar
       FROM reviews r
       JOIN users u ON r.buyer_id = u.id
       WHERE r.service_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.serviceId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET seller overall stats ─────────────────────────────────────────────────
router.get('/seller/:sellerId/stats', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         COUNT(*) AS total_reviews,
         ROUND(AVG(rating)::numeric, 1) AS avg_rating,
         ROUND(AVG(communication_rating)::numeric, 1) AS avg_communication,
         ROUND(AVG(service_as_described_rating)::numeric, 1) AS avg_accuracy,
         ROUND(AVG(recommend_rating)::numeric, 1) AS avg_recommend
       FROM reviews
       WHERE seller_id = $1`,
      [req.params.sellerId]
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST submit a review (buyer only, one per completed transaction) ──────────
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const {
      serviceId, transactionId, sellerId,
      rating, comment,
      communicationRating, serviceAsDescribedRating, recommendRating,
      tipAmount
    } = req.body;

    if (!serviceId || !transactionId || !rating)
      return res.status(400).json({ error: 'serviceId, transactionId, and rating are required' });

    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    // Verify the transaction belongs to this buyer and is completed
    const txCheck = await db.query(
      `SELECT id FROM transactions WHERE id = $1 AND buyer_id = $2 AND status = 'completed'`,
      [transactionId, req.user.userId]
    );
    if (txCheck.rows.length === 0)
      return res.status(403).json({ error: 'You can only review completed orders you purchased.' });

    // Prevent duplicate reviews
    const dupCheck = await db.query(
      'SELECT id FROM reviews WHERE transaction_id = $1',
      [transactionId]
    );
    if (dupCheck.rows.length > 0)
      return res.status(409).json({ error: 'You have already reviewed this order.' });

    const result = await db.query(
      `INSERT INTO reviews
         (service_id, transaction_id, buyer_id, seller_id, rating, comment,
          communication_rating, service_as_described_rating, recommend_rating, tip_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [serviceId, transactionId, req.user.userId, sellerId,
       rating, comment || '',
       communicationRating || rating,
       serviceAsDescribedRating || rating,
       recommendRating || rating,
       tipAmount || 0]
    );

    // Update service average rating
    await db.query(
      `UPDATE services SET
         rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE service_id = $1),
         review_count = (SELECT COUNT(*) FROM reviews WHERE service_id = $1)
       WHERE id = $1`,
      [serviceId]
    );

    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST seller reply to a review ────────────────────────────────────────────
router.post('/:reviewId/reply', requireAuth, async (req: any, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ error: 'Reply cannot be empty' });

    const result = await db.query(
      `UPDATE reviews SET seller_reply = $1, replied_at = NOW()
       WHERE id = $2 AND seller_id = $3 RETURNING *`,
      [reply.trim(), req.params.reviewId, req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(403).json({ error: 'Review not found or not yours to reply to.' });

    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
