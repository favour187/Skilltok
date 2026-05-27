import { Router } from 'express';
import { db } from '../index';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ── GET all conversations for logged-in user ─────────────────────────────────
router.get('/conversations', requireAuth, async (req: any, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT ON (
          LEAST(m.sender_id, m.receiver_id),
          GREATEST(m.sender_id, m.receiver_id)
        )
        m.id,
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
        u.name AS other_user_name,
        u.username AS other_user_username,
        u.avatar_url AS other_user_avatar,
        m.content AS last_message,
        m.created_at AS last_message_at,
        (SELECT COUNT(*) FROM messages
         WHERE receiver_id = $1 AND sender_id = u.id AND is_read = false) AS unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY
        LEAST(m.sender_id, m.receiver_id),
        GREATEST(m.sender_id, m.receiver_id),
        m.created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET messages between two users ───────────────────────────────────────────
router.get('/thread/:otherUserId', requireAuth, async (req: any, res) => {
  try {
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await db.query(
      `SELECT m.*, 
         s.name AS sender_name, s.avatar_url AS sender_avatar,
         s.username AS sender_username
       FROM messages m
       JOIN users s ON s.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC
       LIMIT $3 OFFSET $4`,
      [req.user.userId, otherUserId, Number(limit), offset]
    );

    // Mark received messages as read
    await db.query(
      `UPDATE messages SET is_read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [otherUserId, req.user.userId]
    );

    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST send a message ───────────────────────────────────────────────────────
router.post('/send', requireAuth, async (req: any, res) => {
  try {
    const { receiverId, content, attachmentUrl, attachmentType } = req.body;

    if (!receiverId || !content?.trim())
      return res.status(400).json({ error: 'receiverId and content are required' });

    if (receiverId === req.user.userId)
      return res.status(400).json({ error: 'You cannot message yourself.' });

    // Verify receiver exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [receiverId]);
    if (userCheck.rows.length === 0)
      return res.status(404).json({ error: 'Recipient not found.' });

    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, content, attachment_url, attachment_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, receiverId, content.trim(), attachmentUrl || null, attachmentType || null]
    );

    // Create notification for receiver
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'message', 'New Message', $2, $3)`,
      [receiverId, `You have a new message`, `/chat`]
    );

    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE message (soft delete, only own messages) ──────────────────────────
router.delete('/:messageId', requireAuth, async (req: any, res) => {
  try {
    const result = await db.query(
      `UPDATE messages SET is_deleted = true, content = '[Message deleted]'
       WHERE id = $1 AND sender_id = $2 RETURNING id`,
      [req.params.messageId, req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(403).json({ error: 'Message not found or not yours to delete.' });
    res.json({ deleted: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
