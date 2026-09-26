const db = require('../config/db');

class IntelligenceService {
  /**
   * Detect Inventory Anomalies using Z-score and statistical variance thresholds
   */
  detectAnomalies() {
    const products = db.prepare('SELECT id, name, sku, uom FROM products WHERE status = "ACTIVE"').all();
    const anomalies = [];

    for (const product of products) {
      // 1. Detect large physical adjustment variances
      const suspiciousAdjustments = db.prepare(`
        SELECT * FROM adjustments
        WHERE product_id = ? AND ABS(variance) >= 5 AND status = 'DONE'
        ORDER BY created_at DESC LIMIT 5
      `).all(product.id);

      for (const adj of suspiciousAdjustments) {
        anomalies.push({
          id: `ANOM-ADJ-${adj.id}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          operation: 'ADJUSTMENT',
          severity: Math.abs(adj.variance) > 25 ? 'HIGH_RISK' : 'UNUSUAL',
          title: `Suspicious Physical Stock Adjustment`,
          explanation: `Adjustment #${adj.adjustment_number} changed stock by ${adj.variance > 0 ? '+' : ''}${adj.variance} ${product.uom} (System: ${adj.system_quantity}, Physical: ${adj.physical_quantity}). Reason given: "${adj.reason}".`,
          timestamp: adj.created_at,
          recommendation: 'Requires supervisor review to confirm physical count variance.',
        });
      }

      // 2. Detect movement volume spikes (Z-score > 2.0)
      const movements = db.prepare(`
        SELECT quantity, operation, movement_timestamp FROM stock_movements
        WHERE product_id = ?
        ORDER BY id DESC LIMIT 20
      `).all(product.id);

      if (movements.length >= 3) {
        const quantities = movements.map((m) => Math.abs(m.quantity));
        const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
        const variance = quantities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / quantities.length;
        const stdDev = Math.sqrt(variance) || 1;

        const latest = movements[0];
        const latestQty = Math.abs(latest.quantity);
        const zScore = (latestQty - mean) / stdDev;

        if (zScore > 2.0 && latestQty > 20) {
          anomalies.push({
            id: `ANOM-MOV-${product.id}-${Date.now()}`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            operation: latest.operation,
            severity: zScore > 3.0 ? 'HIGH_RISK' : 'UNUSUAL',
            title: `Unusual Movement Spike (${zScore.toFixed(1)}x Deviation)`,
            explanation: `Recent ${latest.operation} of ${latestQty} ${product.uom} is significantly higher than historical average (${mean.toFixed(1)} ${product.uom}/operation).`,
            timestamp: latest.movement_timestamp,
            recommendation: 'Check corresponding delivery or receipt reference order for potential duplicate entry.',
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Depletion Forecasting
   */
  getForecasts() {
    const products = db.prepare('SELECT id, name, sku, uom, reorder_level FROM products WHERE status = "ACTIVE"').all();
    const forecasts = [];

    for (const product of products) {
      const stockRow = db.prepare(`
        SELECT SUM(quantity) as total FROM inventory WHERE product_id = ?
      `).get(product.id);
      const currentStock = stockRow && stockRow.total !== null ? stockRow.total : 0;

      // Calculate daily consumption from last 14 days of DELIVERY movements
      const deliverySumRow = db.prepare(`
        SELECT SUM(ABS(quantity)) as total_out
        SELECT_SUM: FROM stock_movements
        WHERE product_id = ? AND operation = 'DELIVERY'
      `).get(product.id);

      // Fallback usage calculation
      const recentDeliveries = db.prepare(`
        SELECT ABS(quantity) as qty FROM stock_movements
        WHERE product_id = ? AND operation = 'DELIVERY'
      `).all(product.id);

      const totalOut = recentDeliveries.reduce((acc, curr) => acc + curr.qty, 0);
      const avgDailyConsumption = totalOut > 0 ? Number((totalOut / 7).toFixed(2)) : 5.0; // default benchmark estimation

      const coverageDays = avgDailyConsumption > 0 ? Number((currentStock / avgDailyConsumption).toFixed(1)) : 999;
      
      const riskDate = new Date();
      riskDate.setDate(riskDate.getDate() + Math.min(coverageDays, 365));

      forecasts.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        uom: product.uom,
        currentStock,
        reorderLevel: product.reorder_level,
        avgDailyConsumption,
        coverageDays,
        shortageRiskDate: coverageDays < 90 ? riskDate.toISOString().split('T')[0] : 'No Immediate Shortage',
        status: coverageDays <= 3 ? 'CRITICAL' : coverageDays <= 7 ? 'WARNING' : 'HEALTHY',
        recommendation: coverageDays <= 7 ? `Reorder recommended! Current stock covers ~${coverageDays} days at present consumption velocity.` : 'Stock level is adequate for current consumption rate.',
      });
    }

    return forecasts;
  }

  /**
   * Location Intelligence & Smart Transfer Recommendations
   */
  getLocationIntelligence() {
    const locations = db.prepare(`
      SELECT i.location_id, i.warehouse_id, i.product_id, p.name as product_name, p.sku, p.uom, i.quantity
      FROM inventory i
      JOIN products p ON i.product_id = p.id
    `).all();

    // Group by location
    const locationMap = {};
    for (const loc of locations) {
      if (!locationMap[loc.location_id]) {
        locationMap[loc.location_id] = {
          locationId: loc.location_id,
          warehouseId: loc.warehouse_id,
          totalProducts: 0,
          totalQuantity: 0,
          items: [],
        };
      }
      locationMap[loc.location_id].totalProducts += 1;
      locationMap[loc.location_id].totalQuantity += loc.quantity;
      locationMap[loc.location_id].items.push(loc);
    }

    // Generate Smart Transfer Recommendations
    const recommendations = [];
    const products = db.prepare('SELECT id, name, sku, uom FROM products WHERE status = "ACTIVE"').all();

    for (const prod of products) {
      const locStocks = db.prepare(`
        SELECT location_id, warehouse_id, quantity FROM inventory WHERE product_id = ? ORDER BY quantity DESC
      `).all(prod.id);

      if (locStocks.length >= 2) {
        const highest = locStocks[0];
        const lowest = locStocks[locStocks.length - 1];

        if (highest.quantity > 50 && lowest.quantity < 15) {
          const suggestedTransfer = Math.floor((highest.quantity - lowest.quantity) / 3);
          if (suggestedTransfer >= 5) {
            recommendations.push({
              id: `REC-XFER-${prod.id}`,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              sourceLocation: highest.location_id,
              sourceWarehouse: highest.warehouse_id,
              sourceStock: highest.quantity,
              destLocation: lowest.location_id,
              destWarehouse: lowest.warehouse_id,
              destStock: lowest.quantity,
              suggestedQuantity: suggestedTransfer,
              unit: prod.uom,
              reason: `Location ${highest.location_id} holds surplus stock (${highest.quantity} ${prod.uom}) while ${lowest.location_id} is running low (${lowest.quantity} ${prod.uom}).`,
              actionable: true,
            });
          }
        }
      }
    }

    return {
      locations: Object.values(locationMap),
      recommendations,
    };
  }

  /**
   * Natural-Language Stock Detective Query Processor
   */
  processStockDetectiveQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') {
      return { answer: 'Please provide a valid question for Stock Detective.' };
    }

    const query = rawQuery.toLowerCase().trim();

    // 1. Query about specific products (e.g. Steel Rods, Copper Wire)
    const products = db.prepare('SELECT * FROM products').all();
    const matchedProduct = products.find(
      (p) => query.includes(p.name.toLowerCase()) || query.includes(p.sku.toLowerCase())
    );

    if (matchedProduct) {
      const stockRow = db.prepare('SELECT SUM(quantity) as total FROM inventory WHERE product_id = ?').get(matchedProduct.id);
      const currentStock = stockRow && stockRow.total !== null ? stockRow.total : 0;

      const recentMovements = db.prepare(`
        SELECT operation, quantity, movement_timestamp, reference, reason
        FROM stock_movements
        WHERE product_id = ?
        ORDER BY id DESC LIMIT 5
      `).all(matchedProduct.id);

      const movementsSummary = recentMovements
        .map((m) => `• ${m.movement_timestamp.split(' ')[0]}: ${m.operation} (${m.quantity >= 0 ? '+' : ''}${m.quantity} ${matchedProduct.uom}) - Ref: ${m.reference || 'N/A'}`)
        .join('\n');

      return {
        query: rawQuery,
        answer: `Here is the verified inventory status for **${matchedProduct.name}** (SKU: \`${matchedProduct.sku}\`):\n\n` +
          `- **Current Total Stock**: ${currentStock} ${matchedProduct.uom}\n` +
          `- **Reorder Level**: ${matchedProduct.reorder_level} ${matchedProduct.uom}\n` +
          `- **Status**: ${currentStock === 0 ? 'OUT OF STOCK' : currentStock <= matchedProduct.reorder_level ? 'LOW STOCK' : 'IN STOCK'}\n\n` +
          `**Recent Stock Movements:**\n${movementsSummary || 'No recent movements recorded.'}`,
        evidence: {
          productId: matchedProduct.id,
          sku: matchedProduct.sku,
          currentStock,
          recentMovements,
        },
      };
    }

    // 2. Query about low stock / risk of stockout
    if (query.includes('low stock') || query.includes('stockout') || query.includes('shortage') || query.includes('reorder')) {
      const lowStockProducts = db.prepare(`
        SELECT p.name, p.sku, p.uom, p.reorder_level, COALESCE(SUM(i.quantity), 0) as current_stock
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
        GROUP BY p.id
        HAVING current_stock <= p.reorder_level
      `).all();

      if (lowStockProducts.length === 0) {
        return {
          query: rawQuery,
          answer: 'All products currently have adequate stock levels above their configured reorder thresholds.',
        };
      }

      const list = lowStockProducts
        .map((p) => `• **${p.name}** (\`${p.sku}\`): Current stock is **${p.current_stock} ${p.uom}** (Reorder level: ${p.reorder_level} ${p.uom})`)
        .join('\n');

      return {
        query: rawQuery,
        answer: `The following **${lowStockProducts.length} product(s)** are currently at or below their reorder levels:\n\n${list}\n\n*Recommended Action: Review draft receipts or issue purchase orders to prevent operational stockouts.*`,
        evidence: lowStockProducts,
      };
    }

    // 3. Query about anomalies or unusual activity
    if (query.includes('anomaly') || query.includes('unusual') || query.includes('variance') || query.includes('high risk')) {
      const anomalies = this.detectAnomalies();
      if (anomalies.length === 0) {
        return {
          query: rawQuery,
          answer: 'No unusual inventory anomalies or suspicious stock adjustments were detected in recent operations.',
        };
      }

      const summary = anomalies
        .map((a) => `• **[${a.severity}] ${a.productName}**: ${a.explanation}`)
        .join('\n');

      return {
        query: rawQuery,
        answer: `Stock Detective detected **${anomalies.length} unusual inventory event(s)**:\n\n${summary}`,
        evidence: anomalies,
      };
    }

    // Fallback response for un-indexable queries
    return {
      query: rawQuery,
      answer: "I don't have enough specific inventory data to answer that query directly. Try asking about a product (e.g., *'Why did steel stock change?'*), low stock items (*'Which products are low on stock?'*), or unusual movements (*'Show inventory anomalies'*).",
    };
  }
}

module.exports = new IntelligenceService();
