import { Router } from 'express';
import multer from 'multer';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';
import { uploadFile } from '../services/adapter';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 95 * 1024 * 1024 }  // 95MB — Railway proxy hard limit is 100MB
});

// ── GET video feed ────────────────────────────────────────────────────────────
router.get('/feed', async (_, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, u.name AS creator_name, u.username AS creator_username,
             u.avatar_url AS creator_avatar, u.is_verified AS creator_verified
      FROM videos v
      JOIN users u ON v.creator_id = u.id
      WHERE v.is_blocked = false
      ORDER BY v.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── UPLOAD video (uses adapter — auto picks Cloudinary, S3, etc.) ─────────────
router.post('/upload', requireAuth, upload.single('video'), async (req: any, res) => {
  try {
    const { title, description, category, linkedServiceId } = req.body;

    if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });

    const videoUrl = await uploadFile(
      req.file.buffer,
      `video-${req.user.userId}-${Date.now()}.mp4`,
      req.file.mimetype,
      'skilltok-videos'
    );

    // Generate thumbnail from video URL (Cloudinary does this automatically)
    const thumbnailUrl = videoUrl.includes('cloudinary')
      ? videoUrl.replace('/upload/', '/upload/so_2,w_400,h_600,c_fill/').replace('.mp4', '.jpg')
      : videoUrl; // For S3/other providers, use video URL as fallback

    const dbResult = await db.query(
      `INSERT INTO videos (creator_id, title, description, video_url, thumbnail_url, category, linked_service_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.userId, title, description, videoUrl, thumbnailUrl, category, linkedServiceId || null]
    );

    res.json(dbResult.rows[0]);
  } catch (e: any) {
    console.error('Video upload error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ── LIKE video ────────────────────────────────────────────────────────────────
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE videos SET likes = likes + 1 WHERE id = $1', [req.params.id]);
    res.json({ liked: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE video ──────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const result = await db.query(
      'DELETE FROM videos WHERE id = $1 AND creator_id = $2 RETURNING id',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(403).json({ error: 'Video not found or not yours.' });
    res.json({ deleted: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
