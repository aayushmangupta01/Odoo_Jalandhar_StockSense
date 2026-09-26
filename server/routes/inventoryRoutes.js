const express = require('express');
const router = express.Router();
const db = require('../config/db');
const inventoryService = require('../services/inventoryService');
const ledgerService = require('../services/ledgerService');
const intelligenceService = require('../services/intelligenceService');

// ==========================================
// DASHBOARD INTEGRATION CONTRACT APIS
// ==========================================
router.get('/summary', (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE status = "ACTIVE"').get().count;
    const totalStockRow = db.prepare('SELECT SUM(quantity) as total FROM inventory').get();
    const totalStock = totalStockRow && totalStockRow.total !== null ? totalStockRow.total : 0;

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

    const pendingReceipts = db.prepare("SELECT COUNT(*) as count FROM receipts WHERE status != 'DONE' AND status != 'CANCELED'").get().count;
    const pendingDeliveries = db.prepare("SELECT COUNT(*) as count FROM deliveries WHERE status != 'DONE' AND status != 'CANCELED'").get().count;

    res.json({
      totalProducts,
      totalStock,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/low-stock', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.id, p.name, p.sku, p.uom, p.reorder_level, COALESCE(SUM(i.quantity), 0) as current_stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.status = 'ACTIVE'
      GROUP BY p.id
      HAVING current_stock <= p.reorder_level
    `).all();
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
      ORDER BY a.created_at DESC
    `).all();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      GROUP BY p.id
      ORDER BY p.id DESC
    `).all();
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
      WHERE p.id = ?
      GROUP BY p.id
    `).get(req.params.id);

    if (!product) return res.status(404).json({ error: 'Product not found' });

    const locationDistribution = db.prepare(`
      SELECT location_id, warehouse_id, quantity FROM inventory WHERE product_id = ?
    `).all(req.params.id);

    const recentMovements = db.prepare(`
      SELECT * FROM stock_movements WHERE product_id = ? ORDER BY id DESC LIMIT 10
    `).all(req.params.id);

    res.json({
      product,
      locationDistribution,
      recentMovements,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', (req, res) => {
  try {
    const {
      name, sku, barcode, category_id, brand, uom = 'units', product_type = 'STORABLE',
      initial_stock = 0, reorder_level = 10, safety_stock = 5, min_stock = 5, max_stock = 1000,
      track_batch = 0, track_lot = 0, track_serial = 0, track_expiry = 0
    } = req.body;

    if (!name || !sku) return res.status(400).json({ error: 'Product Name and SKU are required.' });

    const existingSKU = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (existingSKU) return res.status(400).json({ error: `SKU '${sku}' already exists.` });

    const info = db.prepare(`
      INSERT INTO products (
        name, sku, barcode, category_id, brand, uom, product_type, initial_stock,
        reorder_level, safety_stock, min_stock, max_stock, track_batch, track_lot, track_serial, track_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, sku, barcode, category_id || null, brand, uom, product_type, initial_stock,
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

router.put('/products/:id', (req, res) => {
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

router.post('/categories', (req, res) => {
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
      CASE
        WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
        WHEN i.quantity <= p.reorder_level THEN 'LOW_STOCK'
        WHEN i.quantity > p.max_stock THEN 'OVERSTOCKED'
        ELSE 'IN_STOCK'
      END as stock_status
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY i.quantity ASC
    `).all();
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
    const receipts = db.prepare(`
      SELECT r.*, COUNT(ri.id) as item_count, COALESCE(SUM(ri.quantity), 0) as total_quantity
      FROM receipts r
      LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
      GROUP BY r.id
      ORDER BY r.id DESC
    `).all();
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/receipts/:id', (req, res) => {
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

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO receipts (receipt_number, supplier, date, warehouse_id, location_id, status, notes, reference)
        VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?)
      `).run(receiptNumber, supplier, date, warehouse_id, location_id, notes, reference);

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

router.post('/receipts/:id/validate', (req, res) => {
  try {
    const result = inventoryService.validateReceipt(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// DELIVERIES APIS
// ==========================================
router.get('/deliveries', (req, res) => {
  try {
    const deliveries = db.prepare(`
      SELECT d.*, COUNT(di.id) as item_count, COALESCE(SUM(di.quantity), 0) as total_quantity
      FROM deliveries d
      LEFT JOIN delivery_items di ON d.id = di.delivery_id
      GROUP BY d.id
      ORDER BY d.id DESC
    `).all();
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

    const deliveryNumber = `DEL-${Date.now().toString().slice(-6)}`;

    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO deliveries (delivery_number, destination, date, source_warehouse_id, source_location_id, status, reference, notes)
        VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?)
      `).run(deliveryNumber, destination, date, source_warehouse_id, source_location_id, reference, notes);

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

router.post('/deliveries/:id/validate', (req, res) => {
  try {
    const result = inventoryService.validateDelivery(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ADJUSTMENTS & PHYSICAL COUNT APIS
// ==========================================
router.get('/adjustments', (req, res) => {
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

router.post('/adjustments', (req, res) => {
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
router.get('/opening-stock', (req, res) => {
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

router.post('/opening-stock', (req, res) => {
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
router.get('/movements', (req, res) => {
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

router.get('/ledger', (req, res) => {
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
router.get('/intelligence/anomalies', (req, res) => {
  try {
    const anomalies = intelligenceService.detectAnomalies();
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/intelligence/forecast', (req, res) => {
  try {
    const forecasts = intelligenceService.getForecasts();
    res.json(forecasts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/intelligence/explanations/:productId', (req, res) => {
  try {
    const explanation = ledgerService.explainStockChanges(req.params.productId);
    res.json(explanation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/intelligence/location', (req, res) => {
  try {
    const locIntel = intelligenceService.getLocationIntelligence();
    res.json(locIntel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stock-detective/query', (req, res) => {
  try {
    const { query } = req.body;
    const response = intelligenceService.processStockDetectiveQuery(query);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
