// routes/items.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');

function createItemsRouter(db, requireAuth) {
  const router = express.Router();

  // Create item (authenticated)
  router.post('/', requireAuth, async (req, res) => {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const id = uuidv4();
    await db.run('INSERT INTO items (id, title, description, created_by) VALUES (?, ?, ?, ?)', id, title, description || '', req.user.id);
    const item = await db.get('SELECT id, title, description, created_by, created_at FROM items WHERE id = ?', id);
    res.status(201).json(item);
  });

  // Search items (public)
  router.get('/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) {
      // return recent
      const list = await db.all('SELECT id, title, description, created_at FROM items ORDER BY created_at DESC LIMIT 20');
      return res.json({ results: list });
    }
    // simple LIKE search
    const param = `%${q}%`;
    const rows = await db.all('SELECT id, title, description, created_at FROM items WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT 50', param, param);
    res.json({ results: rows });
  });

  // Get item by id
  router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const item = await db.get('SELECT id, title, description, created_by, created_at FROM items WHERE id = ?', id);
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  });

  // Delete item (owner only)
  router.delete('/:id', requireAuth, async (req, res) => {
    const id = req.params.id;
    const item = await db.get('SELECT created_by FROM items WHERE id = ?', id);
    if (!item) return res.status(404).json({ error: 'not found' });
    if (item.created_by !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    await db.run('DELETE FROM items WHERE id = ?', id);
    res.status(204).end();
  });

  return router;
}

module.exports = createItemsRouter;
