const db = require('../config/db');
const inventoryService = require('../services/inventoryService');
const ledgerService = require('../services/ledgerService');
const intelligenceService = require('../services/intelligenceService');

function runInventoryTests() {
  console.log('🧪 Starting Inventory Module Automated Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();

    // Test 1: Products seeded correctly
    assert(db.prepare('SELECT COUNT(*) as c FROM products').get().c >= 10, 'Products seeded correctly');

    // Test 2: Receipt increases stock & creates ledger entry
    const initialSteelStock = inventoryService.getTotalProductStock(1);
    const recNumber = `TST-REC-${timestamp}`;
    const recStmt = db.prepare(`
      INSERT INTO receipts (receipt_number, supplier, date, warehouse_id, location_id, status)
      VALUES (?, 'Test Supplier', '2026-09-26', 'WH-01', 'LOC-MAIN-01', 'DRAFT')
    `);
    const recId = recStmt.run(recNumber).lastInsertRowid;
    db.prepare(`INSERT INTO receipt_items (receipt_id, product_id, quantity, unit) VALUES (?, 1, 50, 'kg')`).run(recId);

    // Draft receipt MUST NOT change stock
    assert(inventoryService.getTotalProductStock(1) === initialSteelStock, 'Draft receipt does not change stock before validation');

    // Validated receipt MUST increase stock
    inventoryService.validateReceipt(recId);
    assert(inventoryService.getTotalProductStock(1) === initialSteelStock + 50, 'Validated receipt increases inventory quantity by 50');

    // Test 3: Delivery decreases stock
    const delNumber = `TST-DEL-${timestamp}`;
    const delStmt = db.prepare(`
      INSERT INTO deliveries (delivery_number, destination, date, source_warehouse_id, source_location_id, status)
      VALUES (?, 'Test Client', '2026-09-26', 'WH-01', 'LOC-MAIN-01', 'DRAFT')
    `);
    const delId = delStmt.run(delNumber).lastInsertRowid;
    db.prepare(`INSERT INTO delivery_items (delivery_id, product_id, quantity, unit) VALUES (?, 1, 20, 'kg')`).run(delId);

    inventoryService.validateDelivery(delId);
    assert(inventoryService.getTotalProductStock(1) === initialSteelStock + 30, 'Validated delivery decreases inventory quantity by 20');

    // Test 4: Insufficient stock throws error and prevents negative inventory
    let threwError = false;
    try {
      const overDelNumber = `TST-OVER-${timestamp}`;
      const overDelStmt = db.prepare(`
        INSERT INTO deliveries (delivery_number, destination, date, source_warehouse_id, source_location_id, status)
        VALUES (?, 'Test Client', '2026-09-26', 'WH-01', 'LOC-MAIN-01', 'DRAFT')
      `);
      const overDelId = overDelStmt.run(overDelNumber).lastInsertRowid;
      db.prepare(`INSERT INTO delivery_items (delivery_id, product_id, quantity, unit) VALUES (?, 1, 99999, 'kg')`).run(overDelId);
      inventoryService.validateDelivery(overDelId);
    } catch (err) {
      threwError = true;
    }
    assert(threwError, 'Over-delivery attempt throws error and prevents negative stock');

    // Test 5: Adjustment updates stock to physical count
    const adjNumber = `TST-ADJ-${timestamp}`;
    const adjStmt = db.prepare(`
      INSERT INTO adjustments (adjustment_number, product_id, location_id, warehouse_id, system_quantity, physical_quantity, variance, reason, status)
      VALUES (?, 1, 'LOC-MAIN-01', 'WH-01', 100, 77, -23, 'Test count adjustment', 'DRAFT')
    `);
    const adjId = adjStmt.run(adjNumber).lastInsertRowid;
    inventoryService.completeAdjustment(adjId);
    assert(inventoryService.getProductStock(1, 'LOC-MAIN-01') === 77, 'Adjustment sets inventory stock equal to physical count (77)');

    // Test 6: Explainable stock trace produces valid timeline
    const explanation = ledgerService.explainStockChanges(1);
    assert(explanation.timeline.length > 0, 'Ledger trace returns chronological timeline events');

    // Test 7: Stock Detective processes NL query without error
    const detectiveRes = intelligenceService.processStockDetectiveQuery('Why did steel stock change?');
    assert(detectiveRes.answer && detectiveRes.answer.includes('Steel Rods'), 'Stock Detective answers product query using DB records');

    console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runInventoryTests();
