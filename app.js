// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { init } = require('./db');
const createAuthRouter = require('./routes/auth');
const createItemsRouter = require('./routes/items');
const authMiddleware = require('./middleware/auth');

const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || './data/database.sqlite';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_this';

// Warn if JWT secret is not set
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set — using default dev secret. Set JWT_SECRET in production.');
}

async function start() {
  // Initialize database
  const db = await init(DB_FILE);

  const app = express();
  app.use(bodyParser.json());

  // --------------------------------------------------
  // Homepage route (fixes "Cannot GET /")
  // --------------------------------------------------
  app.get('/', (req, res) => {
    res.send(`
      <h2>Welcome to the CI/CD Demo API 🚀</h2>
      <p>This backend is running successfully.</p>
      <p>Available endpoints:</p>
      <ul>
        <li>POST /auth/register</li>
        <li>POST /auth/login</li>
        <li>GET /items (requires token)</li>
        <li>POST /items (requires token)</li>
        <li>GET /dashboard (requires token)</li>
        <li>GET /health</li>
      </ul>
    `);
  });

  // --------------------------------------------------
  // Health check
  // --------------------------------------------------
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // --------------------------------------------------
  // Auth routes
  // --------------------------------------------------
  app.use('/auth', createAuthRouter(db));

  // --------------------------------------------------
  // Item CRUD routes
  // --------------------------------------------------
  app.use('/items', createItemsRouter(db, authMiddleware));

  // --------------------------------------------------
  // Dashboard (protected)
  // --------------------------------------------------
  app.get('/dashboard', authMiddleware, async (req, res) => {
    const totalItems = (await db.get('SELECT COUNT(*) as c FROM items')).c;
    const myItems = (await db.get(
      'SELECT COUNT(*) as c FROM items WHERE created_by = ?',
      req.user.id
    )).c;

    res.json({
      user: req.user.username,
      totalItems,
      myItems
    });
  });

  // --------------------------------------------------
  // Global error handler
  // --------------------------------------------------
  app.use((err, req, res, next) => {
    console.error('ERROR:', err);
    res.status(500).json({ error: 'internal_error' });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Export for automated tests
  module.exports = app;
}

start().catch(err => {
  console.error('Failed to start app', err);
});
