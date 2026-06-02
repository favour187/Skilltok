import { Router } from 'express';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';
import { uploadFile } from '../services/adapter';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── GET public profile ────────────────────────────────────────────────────────
router.get('/:userId/profile', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, username, avatar_url, bio, role, plan, is_verified,
              created_at AS joined_date,
              (SELECT COUNT(*) FROM videos WHERE creator_id = u.id) AS video_count,
              (SELECT COUNT(*) FROM services WHERE creator_id = u.id AND is_active = true) AS service_count,
              (SELECT ROUND(AVG(rating)::numeric,1) FROM reviews WHERE seller_id = u.id) AS avg_rating,
              (SELECT COUNT(*) FROM reviews WHERE seller_id = u.id) AS review_count
       FROM users u WHERE id = $1`,
      [req.params.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET my profile (authenticated) ───────────────────────────────────────────
router.get('/me', requireAuth, async (req: any, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, name, username, avatar_url AS avatar, bio, role, plan,
              phone, phone_country, phone_verified, is_verified, two_factor_enabled,
              created_at AS joined_date, skills, followers_count, following_count
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH update profile ──────────────────────────────────────────────────────
router.patch('/me', requireAuth, async (req: any, res) => {
  try {
    const { name, bio, skills, username } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name)     { updates.push(`name = $${idx++}`);     values.push(name); }
    if (bio !== undefined) { updates.push(`bio = $${idx++}`); values.push(bio); }
    if (skills)   { updates.push(`skills = $${idx++}`);   values.push(skills); }
    if (username) {
      // Uniqueness check
      const uCheck = await db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username.toLowerCase(), req.user.userId]
      );
      if (uCheck.rows.length > 0)
        return res.status(409).json({ error: 'That username is already taken.' });
      updates.push(`username = $${idx++}`);
      values.push(username.toLowerCase());
    }

    if (updates.length === 0)
      return res.status(400).json({ error: 'No valid fields to update.' });

    updates.push(`updated_at = NOW()`);
    values.push(req.user.userId);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING
         id, email, name, username, avatar_url AS avatar, bio, role, plan,
         is_verified, created_at AS joined_date, skills`,
      values
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST upload avatar ────────────────────────────────────────────────────────
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

    const url = await uploadFile(req.file.buffer, `avatar-${req.user.userId}`, req.file.mimetype, 'skilltok-avatars');

    await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [url, req.user.userId]);
    res.json({ avatar_url: url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET user's services ───────────────────────────────────────────────────────
router.get('/:userId/services', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM services WHERE creator_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET user's videos ─────────────────────────────────────────────────────────
router.get('/:userId/videos', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM videos WHERE creator_id = $1 AND is_blocked = false ORDER BY created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST follow/unfollow ──────────────────────────────────────────────────────
router.post('/:userId/follow', requireAuth, async (req: any, res) => {
  try {
    if (req.params.userId === req.user.userId)
      return res.status(400).json({ error: 'You cannot follow yourself.' });

    const existing = await db.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.userId, req.params.userId]
    );

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [req.user.userId, req.params.userId]);
      await db.query('UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = $1', [req.user.userId]);
      await db.query('UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = $1', [req.params.userId]);
      return res.json({ following: false });
    }

    await db.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [req.user.userId, req.params.userId]);
    await db.query('UPDATE users SET following_count = following_count + 1 WHERE id = $1', [req.user.userId]);
    await db.query('UPDATE users SET followers_count = followers_count + 1 WHERE id = $1', [req.params.userId]);

    res.json({ following: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
