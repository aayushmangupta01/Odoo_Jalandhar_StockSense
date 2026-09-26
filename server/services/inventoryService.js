const db = require('../config/db');

class InventoryService {
  /**
   * Central stock retriever for product across location
   */
  getProductStock(productId, locationId = 'LOC-MAIN-01') {
    const row = db.prepare(`
      SELECT quantity FROM inventory WHERE product_id = ? AND location_id = ?
    `).get(productId, locationId);
    return row ? row.quantity : 0;
  }

  /**
   * Total stock across all locations for a product
   */
  getTotalProductStock(productId) {
    const row = db.prepare(`
      SELECT SUM(quantity) as total FROM inventory WHERE product_id = ?
    `).get(productId);
    return row && row.total !== null ? row.total : 0;
  }

  /**
   * Evaluate Low-Stock / Out-Of-Stock Alerts for a product
   */
  evaluateAlerts(productId) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return;

    const totalStock = this.getTotalProductStock(productId);

    if (totalStock === 0) {
      db.prepare(`
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (?, 'OUT_OF_STOCK', ?)
      `).run(productId, `Product ${product.name} (SKU: ${product.sku}) is completely OUT OF STOCK!`);
    } else if (totalStock <= product.reorder_level) {
      db.prepare(`
        INSERT INTO inventory_alerts (product_id, alert_type, message)
        VALUES (?, 'LOW_STOCK', ?)
      `).run(productId, `Product ${product.name} (SKU: ${product.sku}) is below reorder level (${totalStock} / ${product.reorder_level} ${product.uom}).`);
    } else {
      db.prepare(`UPDATE inventory_alerts SET is_resolved = 1 WHERE product_id = ?`).run(productId);
    }
  }

  /**
   * Validate Receipt (Incoming Stock) - Atomic Transaction
   */
  validateReceipt(receiptId, performedBy = 'Inventory Admin') {
    const transaction = db.transaction(() => {
      const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(receiptId);
      if (!receipt) throw new Error('Receipt not found');
      if (receipt.status === 'DONE') throw new Error('Receipt has already been validated and processed.');
      if (receipt.status === 'CANCELED') throw new Error('Cannot validate a canceled receipt.');

      const items = db.prepare('SELECT ri.*, p.sku, p.name as product_name, p.unit_cost FROM receipt_items ri JOIN products p ON ri.product_id = p.id WHERE ri.receipt_id = ?').all(receiptId);
      if (items.length === 0) throw new Error('Receipt contains no items.');

      for (const item of items) {
        const beforeQty = this.getProductStock(item.product_id, receipt.location_id);
        const afterQty = beforeQty + item.quantity;
        if (Number(item.unit_price) > 0) {
          const totalStock = this.getTotalProductStock(item.product_id);
          const nextCost = totalStock + item.quantity > 0
            ? ((totalStock * Number(item.unit_cost || 0)) + (item.quantity * Number(item.unit_price))) / (totalStock + item.quantity)
            : Number(item.unit_price);
          db.prepare('UPDATE products SET unit_cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(nextCost, item.product_id);
        }

        // Upsert inventory
        db.prepare(`
          INSERT INTO inventory (product_id, location_id, warehouse_id, quantity)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(product_id, location_id) DO UPDATE SET
            quantity = quantity + excluded.quantity,
            updated_at = CURRENT_TIMESTAMP
        `).run(item.product_id, receipt.location_id, receipt.warehouse_id, item.quantity);

        // Record stock movement
        db.prepare(`
          INSERT INTO stock_movements (product_id, sku, operation, quantity, before_quantity, after_quantity, dest_location_id, user_id, reference, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(item.product_id, item.sku, 'RECEIPT', item.quantity, beforeQty, afterQty, receipt.location_id, performedBy, receipt.receipt_number, `Receipt from ${receipt.supplier}`);

        // Record stock ledger
        db.prepare(`
          INSERT INTO stock_ledger (product_id, sku, operation, quantity_change, previous_quantity, new_quantity, dest_location, reference, user, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(item.product_id, item.sku, 'RECEIPT', item.quantity, beforeQty, afterQty, receipt.location_id, receipt.receipt_number, performedBy, `Receipt from ${receipt.supplier}`);

        this.evaluateAlerts(item.product_id);
      }

      db.prepare(`UPDATE receipts SET status = 'DONE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(receiptId);
      return { success: true, receiptNumber: receipt.receipt_number };
    });

    return transaction();
  }

  /**
   * Validate Delivery Order (Outgoing Stock) - Atomic Transaction with Availability Check
   */
  validateDelivery(deliveryId, performedBy = 'Inventory Admin') {
    const transaction = db.transaction(() => {
      const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(deliveryId);
      if (!delivery) throw new Error('Delivery order not found');
      if (delivery.status === 'DONE') throw new Error('Delivery order has already been completed.');
      if (delivery.status === 'CANCELED') throw new Error('Cannot process a canceled delivery order.');

      const items = db.prepare('SELECT di.*, p.sku, p.name as product_name FROM delivery_items di JOIN products p ON di.product_id = p.id WHERE di.delivery_id = ?').all(deliveryId);
      if (items.length === 0) throw new Error('Delivery order contains no items.');

      // Check stock availability
      for (const item of items) {
        const availableStock = this.getProductStock(item.product_id, delivery.source_location_id);
        if (availableStock < item.quantity) {
          throw new Error(`Cannot deliver ${item.quantity} units of ${item.product_name}. Only ${availableStock} units are available at ${delivery.source_location_id}.`);
        }
      }

      for (const item of items) {
        const beforeQty = this.getProductStock(item.product_id, delivery.source_location_id);
        const afterQty = beforeQty - item.quantity;

        // Deduct inventory
        db.prepare(`
          UPDATE inventory
          SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ? AND location_id = ?
        `).run(item.quantity, item.product_id, delivery.source_location_id);

        // Record stock movement
        db.prepare(`
          INSERT INTO stock_movements (product_id, sku, operation, quantity, before_quantity, after_quantity, source_location_id, user_id, reference, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(item.product_id, item.sku, 'DELIVERY', -item.quantity, beforeQty, afterQty, delivery.source_location_id, performedBy, delivery.delivery_number, `Delivery to ${delivery.destination}`);

        // Record stock ledger
        db.prepare(`
          INSERT INTO stock_ledger (product_id, sku, operation, quantity_change, previous_quantity, new_quantity, source_location, reference, user, reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(item.product_id, item.sku, 'DELIVERY', -item.quantity, beforeQty, afterQty, delivery.source_location_id, delivery.delivery_number, performedBy, `Delivery to ${delivery.destination}`);

        this.evaluateAlerts(item.product_id);
      }

      db.prepare(`UPDATE deliveries SET status = 'DONE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(deliveryId);
      return { success: true, deliveryNumber: delivery.delivery_number };
    });

    return transaction();
  }

  /**
   * Complete Physical Stock Adjustment - Atomic Transaction
   */
  completeAdjustment(adjustmentId, performedBy = 'Inventory Admin') {
    const transaction = db.transaction(() => {
      const adj = db.prepare('SELECT a.*, p.sku, p.name as product_name FROM adjustments a JOIN products p ON a.product_id = p.id WHERE a.id = ?').get(adjustmentId);
      if (!adj) throw new Error('Adjustment record not found');
      if (adj.status === 'DONE') throw new Error('Adjustment has already been processed.');

      const beforeQty = this.getProductStock(adj.product_id, adj.location_id);
      const afterQty = adj.physical_quantity;
      const variance = afterQty - beforeQty;

      // Update inventory to physical quantity
      db.prepare(`
        INSERT INTO inventory (product_id, location_id, warehouse_id, quantity)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(product_id, location_id) DO UPDATE SET
          quantity = excluded.quantity,
          updated_at = CURRENT_TIMESTAMP
      `).run(adj.product_id, adj.location_id, adj.warehouse_id, afterQty);

      // Record movement
      db.prepare(`
        INSERT INTO stock_movements (product_id, sku, operation, quantity, before_quantity, after_quantity, source_location_id, user_id, reference, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(adj.product_id, adj.sku, 'ADJUSTMENT', variance, beforeQty, afterQty, adj.location_id, performedBy, adj.adjustment_number, adj.reason);

      // Record ledger
      db.prepare(`
        INSERT INTO stock_ledger (product_id, sku, operation, quantity_change, previous_quantity, new_quantity, source_location, reference, user, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(adj.product_id, adj.sku, 'ADJUSTMENT', variance, beforeQty, afterQty, adj.location_id, performedBy, adj.adjustment_number, adj.reason);

      db.prepare(`UPDATE adjustments SET status = 'DONE' WHERE id = ?`).run(adjustmentId);

      this.evaluateAlerts(adj.product_id);
      return { success: true, adjustmentNumber: adj.adjustment_number, variance };
    });

    return transaction();
  }

  /**
   * Process Opening Stock Initialization
   */
  createOpeningStock(data) {
    const transaction = db.transaction(() => {
      const { reference, productId, locationId = 'LOC-MAIN-01', warehouseId = 'WH-01', quantity, unit, batchNumber, serialNumber, expiryDate, rate, openingDate } = data;

      const product = db.prepare('SELECT sku FROM products WHERE id = ?').get(productId);
      if (!product) throw new Error('Product not found');

      const beforeQty = this.getProductStock(productId, locationId);
      const afterQty = beforeQty + Number(quantity);

      db.prepare(`
        INSERT INTO opening_stock (reference, product_id, location_id, warehouse_id, quantity, unit, batch_number, serial_number, expiry_date, rate, opening_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(reference, productId, locationId, warehouseId, quantity, unit, batchNumber, serialNumber, expiryDate, rate, openingDate);

      db.prepare(`
        INSERT INTO inventory (product_id, location_id, warehouse_id, quantity)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(product_id, location_id) DO UPDATE SET
          quantity = quantity + excluded.quantity,
          updated_at = CURRENT_TIMESTAMP
      `).run(productId, locationId, warehouseId, quantity);

      db.prepare(`
        INSERT INTO stock_movements (product_id, sku, operation, quantity, before_quantity, after_quantity, dest_location_id, reference, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(productId, product.sku, 'OPENING_STOCK', quantity, beforeQty, afterQty, locationId, reference, 'Initial opening stock setup');

      db.prepare(`
        INSERT INTO stock_ledger (product_id, sku, operation, quantity_change, previous_quantity, new_quantity, dest_location, reference, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(productId, product.sku, 'OPENING_STOCK', quantity, beforeQty, afterQty, locationId, reference, 'Initial opening stock setup');

      this.evaluateAlerts(productId);
      return { success: true, reference };
    });

    return transaction();
  }
}

module.exports = new InventoryService();
