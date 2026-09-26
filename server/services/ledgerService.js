const db = require('../config/db');

class LedgerService {
  /**
   * Get all ledger entries with optional product / date / operation filters
   */
  getLedgerEntries(filters = {}) {
    let query = `
      SELECT l.*, p.name as product_name, p.uom
      FROM stock_ledger l
      JOIN products p ON l.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.productId) {
      query += ` AND l.product_id = ?`;
      params.push(filters.productId);
    }
    if (filters.sku) {
      query += ` AND l.sku LIKE ?`;
      params.push(`%${filters.sku}%`);
    }
    if (filters.operation) {
      query += ` AND l.operation = ?`;
      params.push(filters.operation);
    }

    query += ` ORDER BY l.ledger_timestamp DESC, l.id DESC`;

    return db.prepare(query).all(...params);
  }

  /**
   * "Why did my stock change?" chronological trace for a specific product
   */
  explainStockChanges(productId) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) throw new Error('Product not found');

    const ledgerEntries = db.prepare(`
      SELECT * FROM stock_ledger
      WHERE product_id = ?
      ORDER BY id ASC
    `).all(productId);

    const totalStockRow = db.prepare(`
      SELECT SUM(quantity) as total FROM inventory WHERE product_id = ?
    `).get(productId);
    const currentStock = totalStockRow && totalStockRow.total !== null ? totalStockRow.total : 0;

    let cumulativeQty = 0;
    const timeline = ledgerEntries.map((entry) => {
      cumulativeQty += entry.quantity_change;
      return {
        id: entry.id,
        timestamp: entry.ledger_timestamp,
        operation: entry.operation,
        quantityChange: entry.quantity_change,
        formattedChange: entry.quantity_change >= 0 ? `+${entry.quantity_change}` : `${entry.quantity_change}`,
        previousQuantity: entry.previous_quantity,
        newQuantity: entry.new_quantity,
        cumulativeQuantity: cumulativeQty,
        location: entry.dest_location || entry.source_location || 'Main Warehouse',
        reference: entry.reference,
        reason: entry.reason,
        user: entry.user,
      };
    });

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        uom: product.uom,
        currentStock,
      },
      totalEvents: timeline.length,
      explanationSummary: `Current stock of ${currentStock} ${product.uom} is calculated from ${timeline.length} verified ledger event(s).`,
      timeline,
    };
  }
}

module.exports = new LedgerService();
