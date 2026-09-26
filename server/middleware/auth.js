const crypto = require('crypto');
const db = require('../config/db');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication is required.' });
  }

  try {
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.warehouse_id
      FROM auth_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
    `).get(hashToken(token));

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Your session is invalid or has expired. Sign in again.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      warehouseId: user.warehouse_id || null,
    };
    req.authTokenHash = hashToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}

function auditMutations(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const pathParts = req.path.split('/').filter(Boolean);
  const entity = pathParts[0] || 'inventory';
  const pathEntityId = pathParts.find((part) => /^\d+$/.test(part)) || null;
  const entityTables = {
    products: 'products',
    receipts: 'receipts',
    deliveries: 'deliveries',
    transfers: 'internal_transfers',
    'adjustment-requests': 'adjustment_requests',
    users: 'users',
  };
  let responseBody;
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  let previous = null;
  const table = entityTables[entity];
  if (table && pathEntityId) {
    try {
      previous = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(pathEntityId) || null;
      if (previous) delete previous.password_hash;
    } catch (error) {
      console.error('Unable to read audit snapshot:', error);
    }
  }

  res.once('finish', () => {
    if (res.statusCode >= 400 || !req.user) return;

    const entityId = pathEntityId || (Number.isInteger(responseBody?.id) ? String(responseBody.id) : null);
    const safeBody = { ...(req.body || {}) };
    delete safeBody.password;
    delete safeBody.password_hash;
    delete safeBody.token;

    try {
      db.prepare(`
        INSERT INTO audit_logs (
          user_id, user_name, action, entity, entity_id, previous_value, new_value, location_id, warehouse_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        req.user.name,
        `${req.method} ${req.path}`,
        entity,
        entityId,
        previous ? JSON.stringify(previous) : null,
        JSON.stringify(safeBody),
        safeBody.location_id || safeBody.source_location_id || safeBody.dest_location_id || null,
        safeBody.warehouse_id || safeBody.source_warehouse_id || null
      );
    } catch (error) {
      console.error('Unable to write audit log:', error);
    }
  });

  return next();
}

module.exports = { authenticate, requireRole, auditMutations, hashToken };
