import { Router } from 'express';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (_, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, u.name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar
      FROM services s JOIN users u ON s.creator_id = u.id
      WHERE s.is_active = true ORDER BY s.created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { title, description, category, priceCents, deliveryDays, imageUrl } = req.body;
    const result = await db.query(
      `INSERT INTO services (creator_id, title, description, category, price_cents, delivery_days, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.userId, title, description, category, priceCents, deliveryDays, imageUrl]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
