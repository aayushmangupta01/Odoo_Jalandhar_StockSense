const express = require('express');
const router = express.Router();
const db = require('../config/db');
const inventoryService = require('../services/inventoryService');
const ledgerService = require('../services/ledgerService');
const intelligenceService = require('../services/intelligenceService');
const { requireRole } = require('../middleware/auth');

function requireAssigned(table, idParam = 'id') {
  if (!['receipts', 'deliveries'].includes(table)) {
    throw new Error('Unsupported assignment resource.');
  }
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    const assignment = db.prepare(`
      SELECT assigned_user_id, ${table === 'receipts' ? 'warehouse_id' : 'source_warehouse_id'} as assigned_warehouse_id
      FROM ${table} WHERE id = ?
    `).get(req.params[idParam]);
    if (!assignment || assignment.assigned_user_id !== req.user.id ||
        assignment.assigned_warehouse_id !== req.user.warehouseId) {
      return res.status(403).json({ error: 'This operation is not assigned to your account.' });
    }
    return next();
  };
}

// ==========================================
// DASHBOARD INTEGRATION CONTRACT APIS
// ==========================================
router.get('/summary', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Dashboard summary is available to administrators only.' });
  }
  try {
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'ACTIVE'").get().count;
    const totalStockRow = db.prepare('SELECT SUM(quantity) as total FROM inventory').get();
    const totalStock = totalStockRow?.total ?? 0;
    const lowStockCount = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT p.id, COALESCE(SUM(i.quantity), 0) as stock
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.status = 'ACTIVE'
        GROUP BY p.id
        HAVING stock > 0 AND stock <= p.reorder_level
      )
    `).get().count;
    const outOfStockCount = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT p.id, COALESCE(SUM(i.quantity), 0) as stock
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.status = 'ACTIVE'
        GROUP BY p.id
        HAVING stock = 0
      )
    `).get().count;

    res.json({
      totalProducts,
      totalStock,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      pendingReceipts: db.prepare("SELECT COUNT(*) as count FROM receipts WHERE status NOT IN ('DONE', 'CANCELED')").get().count,
      pendingDeliveries: db.prepare("SELECT COUNT(*) as count FROM deliveries WHERE status NOT IN ('DONE', 'CANCELED')").get().count,
      pendingTransfers: db.prepare("SELECT COUNT(*) as count FROM internal_transfers WHERE status NOT IN ('DONE', 'CANCELED')").get().count,
      pendingAdjustments: db.prepare("SELECT COUNT(*) as count FROM adjustment_requests WHERE status = 'PENDING'").get().count,
      warehouseCount: db.prepare('SELECT COUNT(DISTINCT warehouse_id) as count FROM inventory').get().count,
      locationCount: db.prepare('SELECT COUNT(DISTINCT location_id) as count FROM inventory').get().count,
      inventoryValue: db.prepare(`
        SELECT COALESCE(SUM(i.quantity * p.unit_cost), 0) as value
        FROM inventory i JOIN products p ON p.id = i.product_id
        WHERE p.unit_cost IS NOT NULL
      `).get().value,
      unvaluedProductCount: db.prepare(`
        SELECT COUNT(DISTINCT p.id) as count
        FROM products p JOIN inventory i ON i.product_id = p.id
        WHERE i.quantity > 0 AND p.unit_cost IS NULL
      `).get().count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/category-stock', requireRole('admin'), (req, res, next) => {
  try {
    const categories = db.prepare(`
      SELECT COALESCE(c.name, 'Uncategorized') as category_name,
             SUM(i.quantity) as total_quantity
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY total_quantity DESC
    `).all();
    return res.json(categories);
  } catch (error) {
    return next(error);
  }
});

router.get('/low-stock', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.id, p.name, p.sku, p.uom, p.reorder_level, COALESCE(SUM(i.quantity), 0) as current_stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.status = 'ACTIVE'
        AND (? = 'admin' OR i.warehouse_id = ? OR i.warehouse_id IS NULL)
      GROUP BY p.id
      HAVING current_stock <= p.reorder_level
    `).all(req.user.role, req.user.warehouseId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alerts', (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT a.*, p.name as product_name, p.sku
      FROM inventory_alerts a
      JOIN products p ON a.product_id = p.id
      WHERE a.is_resolved = 0
        AND (? = 'admin' OR EXISTS (
          SELECT 1 FROM inventory i
          WHERE i.product_id = a.product_id AND i.warehouse_id = ?
        ))
      ORDER BY a.created_at DESC
    `).all(req.user.role, req.user.warehouseId);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/staff/dashboard', (req, res, next) => {
  try {
    const userId = req.user.id;
    const pendingReceipts = db.prepare(`
      SELECT COUNT(*) as count FROM receipts
      WHERE assigned_user_id = ? AND status NOT IN ('DONE', 'CANCELED')
    `).get(userId).count;
    const pendingDeliveries = db.prepare(`
      SELECT COUNT(*) as count FROM deliveries
      WHERE assigned_user_id = ? AND status NOT IN ('DONE', 'CANCELED')
    `).get(userId).count;
    const lowStockAlerts = db.prepare(`
      SELECT a.id, a.alert_type, a.message, a.created_at,
             p.name as product_name, p.sku
      FROM inventory_alerts a
      JOIN products p ON p.id = a.product_id
      WHERE a.is_resolved = 0
        AND EXISTS (
          SELECT 1 FROM inventory i
          WHERE i.product_id = a.product_id AND i.warehouse_id = ?
        )
      ORDER BY a.created_at DESC LIMIT 10
    `).all(req.user.warehouseId);
    const todayMovements = db.prepare(`
      SELECT m.*, p.name as product_name, p.uom
      FROM stock_movements m
      JOIN products p ON p.id = m.product_id
      WHERE date(m.movement_timestamp) = date('now', 'localtime')
        AND (? = 'admin' OR
          m.source_location_id IN (SELECT location_id FROM inventory WHERE warehouse_id = ?) OR
          m.dest_location_id IN (SELECT location_id FROM inventory WHERE warehouse_id = ?))
      ORDER BY m.id DESC LIMIT 10
    `).all(req.user.role, req.user.warehouseId, req.user.warehouseId);

    const pendingTransfers = db.prepare(`
      SELECT COUNT(*) as count FROM internal_transfers
      WHERE assigned_user_id = ? AND status NOT IN ('DONE', 'CANCELED')
    `).get(userId).count;
    const staffActivities = db.prepare(`
      SELECT action, entity, entity_id, new_value, location_id, warehouse_id, created_at
      FROM audit_logs
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 50
    `).all(userId);

    return res.json({
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      lowStockAlerts,
      todayMovements,
      staffActivities,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/adjustment-requests', (req, res, next) => {
      try {
        const { product_id, location_id, warehouse_id, physical_quantity, reason } = req.body || {};
        if (!product_id || typeof location_id !== 'string' || typeof warehouse_id !== 'string' ||
            !Number.isFinite(Number(physical_quantity)) || Number(physical_quantity) < 0 ||
            typeof reason !== 'string' || !reason.trim()) {
          return res.status(400).json({ error: 'Product, location, warehouse, physical quantity, and reason are required.' });
        }
        const product = db.prepare('SELECT id FROM products WHERE id = ? AND status = ?').get(product_id, 'ACTIVE');
        if (!product) return res.status(404).json({ error: 'Active product not found.' });
        if (req.user.role === 'staff' && warehouse_id !== req.user.warehouseId) {
          return res.status(403).json({ error: 'You can only request adjustments for your assigned warehouse.' });
        }
        const location = db.prepare(`
          SELECT 1 FROM inventory WHERE product_id = ? AND location_id = ? AND warehouse_id = ?
        `).get(product_id, location_id, warehouse_id);
        if (!location) return res.status(400).json({ error: 'The product is not stocked at the selected warehouse location.' });

        const systemQuantity = inventoryService.getProductStock(product_id, location_id);
        const result = db.prepare(`
          INSERT INTO adjustment_requests (
            product_id, location_id, warehouse_id, system_quantity, physical_quantity,
            variance, reason, requested_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          product_id,
          location_id,
          warehouse_id,
          systemQuantity,
          Number(physical_quantity),
          Number(physical_quantity) - systemQuantity,
          reason.trim(),
          req.user.id
        );
        return res.status(201).json({ id: result.lastInsertRowid, status: 'PENDING' });
      } catch (error) {
        return next(error);
      }
    });

    router.get('/adjustment-requests', (req, res, next) => {
      try {
        const requests = db.prepare(`
          SELECT ar.*, p.name as product_name, p.sku, p.uom,
                 requester.name as requested_by_name, reviewer.name as reviewed_by_name
          FROM adjustment_requests ar
          JOIN products p ON p.id = ar.product_id
          JOIN users requester ON requester.id = ar.requested_by
          LEFT JOIN users reviewer ON reviewer.id = ar.reviewed_by
          ${req.user.role === 'admin' ? '' : 'WHERE ar.requested_by = ?'}
          ORDER BY ar.created_at DESC
        `).all(...(req.user.role === 'admin' ? [] : [req.user.id]));
        return res.json(requests);
      } catch (error) {
        return next(error);
      }
    });

    router.post('/adjustment-requests/:id/approve', requireRole('admin'), (req, res, next) => {
      try {
        const result = db.transaction(() => {
          const request = db.prepare(`
            SELECT ar.*, p.sku, p.name as product_name, p.uom
            FROM adjustment_requests ar
            JOIN products p ON p.id = ar.product_id
            WHERE ar.id = ?
          `).get(req.params.id);
          if (!request) throw Object.assign(new Error('Adjustment request not found.'), { status: 404 });
          if (request.status !== 'PENDING') {
            throw Object.assign(new Error('Only pending adjustment requests can be approved.'), { status: 409 });
          }

          const adjustmentNumber = `ADJ-REQ-${request.id}`;
          const adjustment = db.prepare(`
            INSERT INTO adjustments (
              adjustment_number, product_id, location_id, warehouse_id, system_quantity,
              physical_quantity, variance, reason, user_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
          `).run(
            adjustmentNumber, request.product_id, request.location_id, request.warehouse_id,
            request.system_quantity, request.physical_quantity, request.variance,
            `Staff request: ${request.reason}`, req.user.name
          );
          const currentQuantity = inventoryService.getProductStock(request.product_id, request.location_id);
          if (currentQuantity !== request.system_quantity) {
            throw Object.assign(new Error('Stock changed after this request was submitted. Reject it and ask staff to recount.'), { status: 409 });
          }
          const completed = inventoryService.completeAdjustment(adjustment.lastInsertRowid, req.user.name);
          db.prepare(`
            UPDATE adjustment_requests
            SET status = 'APPROVED', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_note = ?
            WHERE id = ?
          `).run(req.user.id, typeof req.body?.review_note === 'string' ? req.body.review_note : null, request.id);
          return { requestId: request.id, adjustmentId: adjustment.lastInsertRowid, completed };
        })();

        return res.json(result);
      } catch (error) {
        return res.status(error.status || 500).json({ error: error.message });
      }
    });

    router.post('/adjustment-requests/:id/reject', requireRole('admin'), (req, res, next) => {
      try {
        const result = db.prepare(`
          UPDATE adjustment_requests
          SET status = 'REJECTED', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_note = ?
          WHERE id = ? AND status = 'PENDING'
        `).run(
          req.user.id,
          typeof req.body?.review_note === 'string' ? req.body.review_note : null,
          req.params.id
        );
        if (!result.changes) return res.status(404).json({ error: 'Pending adjustment request not found.' });
        return res.json({ id: Number(req.params.id), status: 'REJECTED' });
      } catch (error) {
        return next(error);
      }
    });

    router.get('/audit-logs', requireRole('admin'), (req, res, next) => {
      try {
        const rows = db.prepare(`
          SELECT id, user_id, user_name, action, entity, entity_id, previous_value,
                 new_value, location_id, warehouse_id, created_at
          FROM audit_logs
          ORDER BY id DESC LIMIT 500
        `).all();
        return res.json(rows);
      } catch (error) {
        return next(error);
      }
    });

    router.get('/my-activity', (req, res, next) => {
      try {
        const rows = db.prepare(`
          SELECT action, entity, entity_id, new_value, location_id, warehouse_id, created_at
          FROM audit_logs
          WHERE user_id = ?
          ORDER BY id DESC LIMIT 200
        `).all(req.user.id);
        return res.json(rows);
      } catch (error) {
        return next(error);
      }
    });

    router.get('/transfers', (req, res, next) => {
      try {
        const transfers = db.prepare(`
          SELECT t.*, creator.name as created_by_name, assignee.name as assigned_to_name,
                 COUNT(ti.id) as item_count
          FROM internal_transfers t
          JOIN users creator ON creator.id = t.created_by
          LEFT JOIN users assignee ON assignee.id = t.assigned_user_id
          LEFT JOIN internal_transfer_items ti ON ti.transfer_id = t.id
          ${req.user.role === 'admin' ? '' : 'WHERE t.assigned_user_id = ?'}
          GROUP BY t.id
          ORDER BY t.id DESC
        `).all(...(req.user.role === 'admin' ? [] : [req.user.id]));
        return res.json(transfers);
      } catch (error) {
        return next(error);
      }
    });

    router.post('/transfers', requireRole('admin'), (req, res, next) => {
      try {
        const {
          source_location_id,
          destination_location_id,
          source_warehouse_id,
          destination_warehouse_id,
          assigned_user_id,
          items,
        } = req.body || {};
        if (![source_location_id, destination_location_id, source_warehouse_id, destination_warehouse_id].every((value) => typeof value === 'string' && value.trim()) ||
            source_location_id === destination_location_id ||
            !Array.isArray(items) || items.length === 0 ||
            items.some((item) => !Number.isInteger(Number(item.product_id)) || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
          return res.status(400).json({ error: 'Provide distinct source and destination locations, warehouses, and valid positive item quantities.' });
        }
        if (assigned_user_id !== undefined && assigned_user_id !== null) {
          const assignee = db.prepare("SELECT id, warehouse_id FROM users WHERE id = ? AND role = 'staff' AND is_active = 1").get(assigned_user_id);
          if (!assignee || assignee.warehouse_id !== source_warehouse_id) {
            return res.status(400).json({ error: 'Assigned staff must be active and assigned to the source warehouse.' });
          }
        }

        const transfer = db.transaction(() => {
          const transferNumber = `TRF-${Date.now().toString().slice(-8)}`;
          const inserted = db.prepare(`
            INSERT INTO internal_transfers (
              transfer_number, source_location_id, destination_location_id,
              source_warehouse_id, destination_warehouse_id, status, assigned_user_id, created_by
            ) VALUES (?, ?, ?, ?, ?, 'WAITING', ?, ?)
          `).run(
            transferNumber,
            source_location_id.trim(),
            destination_location_id.trim(),
            source_warehouse_id.trim(),
            destination_warehouse_id.trim(),
            assigned_user_id || null,
            req.user.id
          );
          const insertItem = db.prepare(`
            INSERT INTO internal_transfer_items (transfer_id, product_id, quantity)
            VALUES (?, ?, ?)
          `);
          for (const item of items) {
            const product = db.prepare('SELECT id FROM products WHERE id = ? AND status = ?').get(item.product_id, 'ACTIVE');
            if (!product) throw Object.assign(new Error(`Active product ${item.product_id} not found.`), { status: 400 });
            insertItem.run(inserted.lastInsertRowid, item.product_id, Number(item.quantity));
          }
          return { id: inserted.lastInsertRowid, transferNumber };
        })();
        return res.status(201).json(transfer);
      } catch (error) {
        return res.status(error.status || 500).json({ error: error.message });
      }
    });

    router.get('/transfers/:id', (req, res, next) => {
      try {
        const transfer = db.prepare(`
          SELECT t.*, creator.name as created_by_name, assignee.name as assigned_to_name
          FROM internal_transfers t
          JOIN users creator ON creator.id = t.created_by
          LEFT JOIN users assignee ON assignee.id = t.assigned_user_id
          WHERE t.id = ?
        `).get(req.params.id);
        if (!transfer) return res.status(404).json({ error: 'Transfer not found.' });
        if (req.user.role !== 'admin' && transfer.assigned_user_id !== req.user.id) {
          return res.status(403).json({ error: 'This transfer is not assigned to your account.' });
        }
        const items = db.prepare(`
          SELECT ti.*, p.name as product_name, p.sku, p.uom
          FROM internal_transfer_items ti
          JOIN products p ON p.id = ti.product_id
          WHERE ti.transfer_id = ?
        `).all(req.params.id);
        return res.json({ transfer, items });
      } catch (error) {
        return next(error);
      }
    });

    router.post('/transfers/:id/approve', requireRole('admin'), (req, res, next) => {
      try {
        const result = db.prepare(`
          UPDATE internal_transfers SET status = 'READY', updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'WAITING'
        `).run(req.params.id);
        if (!result.changes) return res.status(404).json({ error: 'Pending transfer not found.' });
        return res.json({ id: Number(req.params.id), status: 'READY' });
      } catch (error) {
        return next(error);
      }
    });

    router.post('/transfers/:id/process', (req, res, next) => {
      try {
        const result = db.transaction(() => {
          const transfer = db.prepare('SELECT * FROM internal_transfers WHERE id = ?').get(req.params.id);
          if (!transfer) throw Object.assign(new Error('Transfer not found.'), { status: 404 });
          if (req.user.role !== 'admin' && transfer.assigned_user_id !== req.user.id) {
            throw Object.assign(new Error('This transfer is not assigned to your account.'), { status: 403 });
          }
          if (transfer.status !== 'READY') {
            throw Object.assign(new Error('Only approved transfers can be processed.'), { status: 409 });
          }

          const items = db.prepare(`
            SELECT ti.*, p.sku, p.name as product_name
            FROM internal_transfer_items ti
            JOIN products p ON p.id = ti.product_id
            WHERE ti.transfer_id = ?
          `).all(transfer.id);
          if (!items.length) throw Object.assign(new Error('Transfer has no items.'), { status: 400 });

          for (const item of items) {
            const available = inventoryService.getProductStock(item.product_id, transfer.source_location_id);
            if (available < item.quantity) {
              throw Object.assign(new Error(`Insufficient stock for ${item.product_name}: ${available} available, ${item.quantity} requested.`), { status: 409 });
            }
          }

          for (const item of items) {
            const before = inventoryService.getProductStock(item.product_id, transfer.source_location_id);
            const after = before - item.quantity;
            db.prepare(`
              UPDATE inventory
              SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
              WHERE product_id = ? AND location_id = ?
            `).run(item.quantity, item.product_id, transfer.source_location_id);
            db.prepare(`
              INSERT INTO inventory (product_id, location_id, warehouse_id, quantity)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(product_id, location_id) DO UPDATE SET
                quantity = quantity + excluded.quantity, updated_at = CURRENT_TIMESTAMP
            `).run(item.product_id, transfer.destination_location_id, transfer.destination_warehouse_id, item.quantity);

            db.prepare(`
              INSERT INTO stock_movements (
                product_id, sku, operation, quantity, before_quantity, after_quantity,
                source_location_id, dest_location_id, user_id, reference, reason
              ) VALUES (?, ?, 'INTERNAL_TRANSFER', ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              item.product_id, item.sku, -item.quantity, before, after,
              transfer.source_location_id, transfer.destination_location_id,
              req.user.name, transfer.transfer_number, 'Internal warehouse transfer'
            );
            db.prepare(`
              INSERT INTO stock_ledger (
                product_id, sku, operation, quantity_change, previous_quantity, new_quantity,
                source_location, dest_location, reference, user, reason
              ) VALUES (?, ?, 'INTERNAL_TRANSFER', ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              item.product_id, item.sku, -item.quantity, before, after,
              transfer.source_location_id, transfer.destination_location_id,
              transfer.transfer_number, req.user.name, 'Internal warehouse transfer'
            );
          }
          db.prepare(`
            UPDATE internal_transfers SET status = 'DONE', updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `).run(transfer.id);
          return { id: transfer.id, status: 'DONE' };
        })();
        return res.json(result);
      } catch (error) {
        return res.status(error.status || 500).json({ error: error.message });
      }
    });
// ==========================================
// PRODUCT MASTER APIS
// ==========================================
router.get('/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, COALESCE(SUM(i.quantity), 0) as current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
        AND (? = 'admin' OR i.warehouse_id = ?)
      WHERE (? = 'admin' OR p.status = 'ACTIVE')
      GROUP BY p.id
      ORDER BY p.id DESC
    `).all(req.user.role, req.user.warehouseId, req.user.role);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, COALESCE(SUM(i.quantity), 0) as current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
        AND (? = 'admin' OR i.warehouse_id = ?)
      WHERE p.id = ? AND (? = 'admin' OR p.status = 'ACTIVE')
      GROUP BY p.id
    `).get(req.user.role, req.user.warehouseId, req.params.id, req.user.role);

    if (!product) return res.status(404).json({ error: 'Product not found' });

    const locationDistribution = db.prepare(`
      SELECT location_id, warehouse_id, quantity FROM inventory
      WHERE product_id = ? AND (? = 'admin' OR warehouse_id = ?)
    `).all(req.params.id, req.user.role, req.user.warehouseId);

    const recentMovements = db.prepare(`
      SELECT * FROM stock_movements
      WHERE product_id = ? AND (
        ? = 'admin' OR
        source_location_id IN (SELECT location_id FROM inventory WHERE warehouse_id = ?) OR
        dest_location_id IN (SELECT location_id FROM inventory WHERE warehouse_id = ?)
      )
      ORDER BY id DESC LIMIT 10
    `).all(req.params.id, req.user.role, req.user.warehouseId, req.user.warehouseId);

    res.json({
      product,
      locationDistribution,
      recentMovements,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', requireRole('admin'), (req, res) => {
  try {
    const {
      name, sku, barcode, category_id, brand, uom = 'units', product_type = 'STORABLE',
      initial_stock = 0, reorder_level = 10, safety_stock = 5, min_stock = 5, max_stock = 1000,
      track_batch = 0, track_lot = 0, track_serial = 0, track_expiry = 0, unit_cost = null
    } = req.body;

    if (!name || !sku) return res.status(400).json({ error: 'Product Name and SKU are required.' });
    if (unit_cost !== null && (!Number.isFinite(Number(unit_cost)) || Number(unit_cost) < 0)) {
      return res.status(400).json({ error: 'Unit cost must be a non-negative number.' });
    }

    const existingSKU = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (existingSKU) return res.status(400).json({ error: `SKU '${sku}' already exists.` });

    const info = db.prepare(`
      INSERT INTO products (
        name, sku, barcode, category_id, brand, uom, product_type, initial_stock, unit_cost,
        reorder_level, safety_stock, min_stock, max_stock, track_batch, track_lot, track_serial, track_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, sku, barcode, category_id || null, brand, uom, product_type, initial_stock, unit_cost,
      reorder_level, safety_stock, min_stock, max_stock, track_batch ? 1 : 0, track_lot ? 1 : 0, track_serial ? 1 : 0, track_expiry ? 1 : 0
    );

    const productId = info.lastInsertRowid;

    // If initial stock provided > 0, set up opening stock record
    if (Number(initial_stock) > 0) {
      inventoryService.createOpeningStock({
        reference: `INIT-SKU-${sku}`,
        productId,
        locationId: 'LOC-MAIN-01',
        warehouseId: 'WH-01',
        quantity: Number(initial_stock),
        unit: uom,
        openingDate: new Date().toISOString().split('T')[0],
      });
    }

    res.status(201).json({ id: productId, message: 'Product created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', requireRole('admin'), (req, res) => {
  try {
    const { name, barcode, category_id, brand, uom, reorder_level, safety_stock, min_stock, max_stock, status } = req.body;

    db.prepare(`
      UPDATE products
      SET name = ?, barcode = ?, category_id = ?, brand = ?, uom = ?,
          reorder_level = ?, safety_stock = ?, min_stock = ?, max_stock = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, barcode, category_id || null, brand, uom, reorder_level, safety_stock, min_stock, max_stock, status || 'ACTIVE', req.params.id);

    res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/products/:id/status', requireRole('admin'), (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ error: 'Product status must be ACTIVE, INACTIVE, or ARCHIVED.' });
    }
    const result = db.prepare(`
      UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Product not found.' });
    return res.json({ id: Number(req.params.id), status });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// CATEGORIES APIS
// ==========================================
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', requireRole('admin'), (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const info = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description);
    res.status(201).json({ id: info.lastInsertRowid, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CURRENT STOCK APIS
// ==========================================
router.get('/stock', (req, res) => {
  try {
    const stock = db.prepare(`
      SELECT i.*, p.name as product_name, p.sku, p.uom, p.reorder_level, c.name as category_name,
      MAX(0, i.quantity - COALESCE(i.reserved_quantity, 0)) as available_quantity,
      COALESCE((
        SELECT SUM(ri.quantity)
        FROM receipt_items ri JOIN receipts r ON r.id = ri.receipt_id
        WHERE ri.product_id = i.product_id AND r.location_id = i.location_id
          AND r.status NOT IN ('DONE', 'CANCELED')
      ), 0) as incoming_quantity,
      COALESCE((
        SELECT SUM(di.quantity)
        FROM delivery_items di JOIN deliveries d ON d.id = di.delivery_id
        WHERE di.product_id = i.product_id AND d.source_location_id = i.location_id
          AND d.status NOT IN ('DONE', 'CANCELED')
      ), 0) as outgoing_quantity,
      CASE
        WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
        WHEN i.quantity <= p.reorder_level THEN 'LOW_STOCK'
        WHEN i.quantity > p.max_stock THEN 'OVERSTOCKED'
        ELSE 'IN_STOCK'
      END as stock_status
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE (? = 'admin' OR i.warehouse_id = ?)
      ORDER BY i.quantity ASC
    `).all(req.user.role, req.user.warehouseId);
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RECEIPTS APIS
// ==========================================
router.get('/receipts', (req, res) => {
  try {
    const query = req.user.role === 'admin' ? `
      SELECT r.*, COUNT(ri.id) as item_count, COALESCE(SUM(ri.quantity), 0) as total_quantity
      FROM receipts r
      LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
      GROUP BY r.id
      ORDER BY r.id DESC
    ` : `
      SELECT r.*, COUNT(ri.id) as item_count, COALESCE(SUM(ri.quantity), 0) as total_quantity
      FROM receipts r
      LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
      WHERE r.assigned_user_id = ?
      GROUP BY r.id
      ORDER BY r.id DESC
    `;
    const receipts = req.user.role === 'admin'
      ? db.prepare(query).all()
      : db.prepare(query).all(req.user.id);
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/receipts/:id', requireAssigned('receipts'), (req, res) => {
  try {
    const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    const items = db.prepare(`
      SELECT ri.*, p.name as product_name, p.sku, p.uom
      FROM receipt_items ri
      JOIN products p ON ri.product_id = p.id
      WHERE ri.receipt_id = ?
    `).all(req.params.id);

    res.json({ receipt, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/receipts', (req, res) => {
  try {
    const { supplier, date, warehouse_id = 'WH-01', location_id = 'LOC-MAIN-01', notes, reference, items = [] } = req.body;
    if (!supplier || !date || items.length === 0) {
      return res.status(400).json({ error: 'Supplier, date, and at least one item are required.' });
    }
    if (req.user.role === 'admin' && req.body.assigned_user_id) {
      const assignedStaff = db.prepare("SELECT warehouse_id FROM users WHERE id = ? AND role = 'staff' AND is_active = 1").get(req.body.assigned_user_id);
      if (!assignedStaff || assignedStaff.warehouse_id !== warehouse_id) {
        return res.status(400).json({ error: 'Assigned receipt staff must be active and assigned to the receipt warehouse.' });
      }
    }
    if (req.user.role === 'staff' && warehouse_id !== req.user.warehouseId) {
      return res.status(403).json({ error: 'You can only create receipts for your assigned warehouse.' });
    }
    if (req.user.role === 'staff' && !db.prepare(`
      SELECT 1 FROM inventory WHERE warehouse_id = ? AND location_id = ? LIMIT 1
    `).get(warehouse_id, location_id)) {
      return res.status(400).json({ error: 'The receipt location is not in your assigned warehouse.' });
    }

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO receipts (receipt_number, supplier, date, warehouse_id, location_id, status, notes, reference, assigned_user_id, created_by)
        VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?)
      `).run(
        receiptNumber,
        supplier,
        date,
        warehouse_id,
        location_id,
        notes,
        reference,
        req.user.role === 'staff' ? req.user.id : (req.body.assigned_user_id || null),
        req.user.name
      );

      const receiptId = info.lastInsertRowid;

      for (const item of items) {
        if (!item.product_id || Number(item.quantity) <= 0) {
          throw new Error('Valid product and positive quantity required for each line item.');
        }
        db.prepare(`
          INSERT INTO receipt_items (receipt_id, product_id, quantity, unit, batch_number, serial_number, expiry_date, unit_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(receiptId, item.product_id, item.quantity, item.unit || 'units', item.batch_number, item.serial_number, item.expiry_date, item.unit_price || 0);
      }

      return receiptId;
    });

    const receiptId = transaction();
    res.status(201).json({ id: receiptId, receiptNumber, message: 'Draft receipt created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/receipts/:id/validate', requireAssigned('receipts'), (req, res) => {
  try {
    if (req.user.role === 'staff') {
      const receipt = db.prepare('SELECT status FROM receipts WHERE id = ?').get(req.params.id);
      if (!receipt || !['READY', 'WAITING'].includes(receipt.status)) {
        return res.status(403).json({ error: 'Only assigned receipts marked READY or WAITING can be validated by staff.' });
      }
    }
    const result = inventoryService.validateReceipt(req.params.id, req.user.name);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/receipts/:id/status', requireRole('admin'), (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['READY', 'WAITING', 'CANCELED'].includes(status)) {
      return res.status(400).json({ error: 'Receipt status must be READY, WAITING, or CANCELED.' });
    }
    const result = db.prepare(`
      UPDATE receipts SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status NOT IN ('DONE', 'CANCELED')
    `).run(status, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'An open receipt was not found.' });
    return res.json({ id: Number(req.params.id), status });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// DELIVERIES APIS
// ==========================================
router.get('/deliveries', (req, res) => {
  try {
    const query = req.user.role === 'admin' ? `
      SELECT d.*, COUNT(di.id) as item_count, COALESCE(SUM(di.quantity), 0) as total_quantity
      FROM deliveries d
      LEFT JOIN delivery_items di ON d.id = di.delivery_id
      GROUP BY d.id
      ORDER BY d.id DESC
    ` : `
      SELECT d.*, COUNT(di.id) as item_count, COALESCE(SUM(di.quantity), 0) as total_quantity
      FROM deliveries d
      LEFT JOIN delivery_items di ON d.id = di.delivery_id
      WHERE d.assigned_user_id = ?
      GROUP BY d.id
      ORDER BY d.id DESC
    `;
    const deliveries = req.user.role === 'admin'
      ? db.prepare(query).all()
      : db.prepare(query).all(req.user.id);
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/deliveries', (req, res) => {
  try {
    const { destination, date, source_warehouse_id = 'WH-01', source_location_id = 'LOC-MAIN-01', reference, notes, items = [] } = req.body;
    if (!destination || !date || items.length === 0) {
      return res.status(400).json({ error: 'Destination, date, and at least one line item are required.' });
    }
    if (req.user.role === 'admin' && req.body.assigned_user_id) {
      const assignedStaff = db.prepare("SELECT warehouse_id FROM users WHERE id = ? AND role = 'staff' AND is_active = 1").get(req.body.assigned_user_id);
      if (!assignedStaff || assignedStaff.warehouse_id !== source_warehouse_id) {
        return res.status(400).json({ error: 'Assigned delivery staff must be active and assigned to the source warehouse.' });
      }
    }
    if (req.user.role === 'staff' && source_warehouse_id !== req.user.warehouseId) {
      return res.status(403).json({ error: 'You can only create deliveries for your assigned warehouse.' });
    }
    if (req.user.role === 'staff' && !db.prepare(`
      SELECT 1 FROM inventory WHERE warehouse_id = ? AND location_id = ? LIMIT 1
    `).get(source_warehouse_id, source_location_id)) {
      return res.status(400).json({ error: 'The delivery location is not in your assigned warehouse.' });
    }

    const deliveryNumber = `DEL-${Date.now().toString().slice(-6)}`;

    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO deliveries (delivery_number, destination, date, source_warehouse_id, source_location_id, status, reference, notes, assigned_user_id, created_by)
        VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?)
      `).run(
        deliveryNumber,
        destination,
        date,
        source_warehouse_id,
        source_location_id,
        reference,
        notes,
        req.user.role === 'staff' ? req.user.id : (req.body.assigned_user_id || null),
        req.user.name
      );

      const deliveryId = info.lastInsertRowid;

      for (const item of items) {
        if (!item.product_id || Number(item.quantity) <= 0) {
          throw new Error('Valid product and positive quantity required for each item.');
        }
        db.prepare(`
          INSERT INTO delivery_items (delivery_id, product_id, quantity, unit)
          VALUES (?, ?, ?, ?)
        `).run(deliveryId, item.product_id, item.quantity, item.unit || 'units');
      }

      return deliveryId;
    });

    const deliveryId = transaction();
    res.status(201).json({ id: deliveryId, deliveryNumber, message: 'Draft delivery order created.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/deliveries/:id/validate', requireAssigned('deliveries'), (req, res) => {
  try {
    if (req.user.role === 'staff') {
      const delivery = db.prepare('SELECT status FROM deliveries WHERE id = ?').get(req.params.id);
      if (!delivery || !['READY', 'WAITING'].includes(delivery.status)) {
        return res.status(403).json({ error: 'Only assigned deliveries marked READY or WAITING can be validated by staff.' });
      }
    }
    const result = inventoryService.validateDelivery(req.params.id, req.user.name);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/deliveries/:id/status', requireRole('admin'), (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['READY', 'WAITING', 'CANCELED'].includes(status)) {
      return res.status(400).json({ error: 'Delivery status must be READY, WAITING, or CANCELED.' });
    }
    const result = db.prepare(`
      UPDATE deliveries SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status NOT IN ('DONE', 'CANCELED')
    `).run(status, req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'An open delivery was not found.' });
    return res.json({ id: Number(req.params.id), status });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// ADJUSTMENTS & PHYSICAL COUNT APIS
// ==========================================
router.get('/adjustments', requireRole('admin'), (req, res) => {
  try {
    const adjustments = db.prepare(`
      SELECT a.*, p.name as product_name, p.sku, p.uom
      FROM adjustments a
      JOIN products p ON a.product_id = p.id
      ORDER BY a.id DESC
    `).all();
    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/adjustments', requireRole('admin'), (req, res) => {
  try {
    const { product_id, location_id = 'LOC-MAIN-01', warehouse_id = 'WH-01', physical_quantity, reason } = req.body;
    if (!product_id || physical_quantity === undefined || !reason) {
      return res.status(400).json({ error: 'Product, physical quantity, and reason are required.' });
    }
    if (Number(physical_quantity) < 0) {
      return res.status(400).json({ error: 'Physical quantity cannot be negative.' });
    }

    const systemQuantity = inventoryService.getProductStock(product_id, location_id);
    const variance = Number(physical_quantity) - systemQuantity;
    const adjNumber = `ADJ-${Date.now().toString().slice(-6)}`;

    const info = db.prepare(`
      INSERT INTO adjustments (adjustment_number, product_id, location_id, warehouse_id, system_quantity, physical_quantity, variance, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
    `).run(adjNumber, product_id, location_id, warehouse_id, systemQuantity, physical_quantity, variance, reason);

    const adjustmentId = info.lastInsertRowid;
    const result = inventoryService.completeAdjustment(adjustmentId);

    res.status(201).json({ id: adjustmentId, adjustmentNumber: adjNumber, variance, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// OPENING STOCK APIS
// ==========================================
router.get('/opening-stock', requireRole('admin'), (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT o.*, p.name as product_name, p.sku
      FROM opening_stock o
      JOIN products p ON o.product_id = p.id
      ORDER BY o.id DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/opening-stock', requireRole('admin'), (req, res) => {
  try {
    const result = inventoryService.createOpeningStock(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// MOVEMENTS & LEDGER APIS
// ==========================================
router.get('/movements', requireRole('admin'), (req, res) => {
  try {
    const movements = db.prepare(`
      SELECT m.*, p.name as product_name, p.uom
      FROM stock_movements m
      JOIN products p ON m.product_id = p.id
      ORDER BY m.id DESC
    `).all();
    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ledger', requireRole('admin'), (req, res) => {
  try {
    const entries = ledgerService.getLedgerEntries(req.query);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// INTELLIGENCE & ANALYTICS APIS
// ==========================================
router.get('/intelligence/anomalies', requireRole('admin'), (req, res) => {
  try {
    const anomalies = intelligenceService.detectAnomalies();
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/intelligence/forecast', requireRole('admin'), (req, res) => {
  try {
    const forecasts = intelligenceService.getForecasts();
    res.json(forecasts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/intelligence/explanations/:productId', requireRole('admin'), (req, res) => {
  try {
    const explanation = ledgerService.explainStockChanges(req.params.productId);
    res.json(explanation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/intelligence/location', requireRole('admin'), (req, res) => {
  try {
    const locIntel = intelligenceService.getLocationIntelligence();
    res.json(locIntel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stock-detective/query', requireRole('admin'), (req, res) => {
  try {
    const { query } = req.body;
    const response = intelligenceService.processStockDetectiveQuery(query);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
