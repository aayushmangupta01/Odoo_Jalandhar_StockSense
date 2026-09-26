const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { authenticate, hashToken, requireRole, auditMutations } = require('../middleware/auth');

const router = express.Router();
const SESSION_DURATION_HOURS = 12;
router.use('/users', authenticate, auditMutations);

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare(`
    INSERT INTO auth_sessions (token_hash, user_id, expires_at)
    VALUES (?, ?, datetime('now', ?))
  `).run(hashToken(token), user.id, `+${SESSION_DURATION_HOURS} hours`);
  return token;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.is_active),
    warehouseId: user.warehouse_id || null,
  };
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !['admin', 'staff'].includes(role)) {
      return res.status(400).json({ error: 'Email, password, and a valid role are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email.trim());
    if (!user || !user.is_active || user.role !== role || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const token = createSession(user);
    return res.json({ user: publicUser(user), token });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', authenticate, (req, res, next) => {
  try {
    db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(req.authTokenHash);
    return res.json({ message: 'Signed out successfully.' });
  } catch (error) {
    return next(error);
  }
});

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== 'string' || password.length < 10) {
      return res.status(400).json({ error: 'Enter a valid name and email, and a password of at least 10 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, warehouse_id)
      VALUES (?, ?, ?, 'staff', 'WH-01')
    `).run(name.trim(), email.trim().toLowerCase(), passwordHash);

    return res.status(201).json({ message: 'Staff account created.', id: result.lastInsertRowid });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

router.get('/users', authenticate, requireRole('admin'), (req, res, next) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, is_active, warehouse_id, created_at
      FROM users ORDER BY name COLLATE NOCASE
    `).all();
    return res.json(users.map(publicUser));
  } catch (error) {
    return next(error);
  }
});

router.post('/users', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role = 'staff', warehouseId = 'WH-01' } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== 'string' || password.length < 10 ||
        !['admin', 'staff'].includes(role) ||
        (role === 'staff' && (typeof warehouseId !== 'string' || !warehouseId.trim()))) {
      return res.status(400).json({ error: 'Provide a valid name, email, password (at least 10 characters), and role.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, warehouse_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), email.trim().toLowerCase(), passwordHash, role, role === 'staff' ? warehouseId.trim() : null);

    const user = db.prepare(`
      SELECT id, name, email, role, is_active, warehouse_id FROM users WHERE id = ?
    `).get(result.lastInsertRowid);
    return res.status(201).json(publicUser(user));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

router.patch('/users/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ error: 'User not found.' });

    const {
      name = current.name,
      role = current.role,
      isActive = Boolean(current.is_active),
      password,
      warehouseId = current.warehouse_id,
    } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2 || !['admin', 'staff'].includes(role)) {
      return res.status(400).json({ error: 'Provide a valid name and role.' });
    }
    if (Number(req.params.id) === req.user.id && (!isActive || role !== 'admin')) {
      return res.status(400).json({ error: 'You cannot deactivate or demote your own account.' });
    }
    if (password !== undefined && (typeof password !== 'string' || password.length < 10)) {
      return res.status(400).json({ error: 'Password must be at least 10 characters.' });
    }
    if (role === 'staff' && (typeof warehouseId !== 'string' || !warehouseId.trim())) {
      return res.status(400).json({ error: 'Staff accounts must be assigned to a warehouse.' });
    }

    const passwordHash = password === undefined ? current.password_hash : await bcrypt.hash(password, 12);
    db.prepare(`
      UPDATE users
      SET name = ?, role = ?, is_active = ?, password_hash = ?, warehouse_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name.trim(), role, isActive ? 1 : 0, passwordHash, role === 'staff' ? warehouseId.trim() : null, req.params.id);
    if (!isActive) {
      db.prepare('DELETE FROM auth_sessions WHERE user_id = ?').run(req.params.id);
    }

    const updated = db.prepare(`
      SELECT id, name, email, role, is_active, warehouse_id FROM users WHERE id = ?
    `).get(req.params.id);
    return res.json(publicUser(updated));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
