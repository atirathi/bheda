import { Router, Request, Response } from 'express';
import { query } from '../../services/db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const result = await query('SELECT * FROM comments ORDER BY created_at DESC');
  return res.send(renderComments(result.rows));
});

router.post('/', async (req: Request, res: Response) => {
  const { username, comment } = req.body;
  await query(`INSERT INTO comments (username, body) VALUES ('${username || 'anon'}', '${comment || ''}')`);
  const result = await query('SELECT * FROM comments ORDER BY created_at DESC');
  return res.send(renderComments(result.rows));
});

function renderComments(comments: any[]): string {
  let html = '<h1>Comments</h1><form method="POST"><input name="username" placeholder="Name"><textarea name="comment"></textarea><button type="submit">Post</button></form><hr>';
  for (const c of comments) {
    html += `<div class="comment"><strong>${c.username}</strong><p>${c.body}</p></div>`;
  }
  return html;
}

export default router;
