// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

function createAuthRouter(db) {
  const router = express.Router();

  // Register
  router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const existing = await db.get('SELECT id FROM users WHERE username = ?', username);
    if (existing) return res.status(409).json({ error: 'username taken' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db.run('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)', id, username, hash);

    return res.status(201).json({ id, username });
  });

  // Login
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const user = await db.get('SELECT id, password_hash FROM users WHERE username = ?', username);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign({ id: user.id, username }, process.env.JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  });

  return router;
}

module.exports = createAuthRouter;
