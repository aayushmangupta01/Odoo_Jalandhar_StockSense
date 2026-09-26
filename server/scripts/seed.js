require('dotenv').config({ path: ['.env.local', '.env'] });

const db = require('../config/db');
const inventoryService = require('../services/inventoryService');

function seedDatabase() {
  console.log('🌱 Starting StockSense Inventory Database Seed...');

  // Enable foreign keys
  db.pragma('foreign_keys = OFF');

  // Clear existing inventory tables for clean, reproducible seed
  db.exec(`
    DELETE FROM stock_ledger;
    DELETE FROM stock_movements;
    DELETE FROM inventory_alerts;
    DELETE FROM inventory_anomalies;
    DELETE FROM inventory_forecasts;
    DELETE FROM opening_stock;
    DELETE FROM adjustments;
    DELETE FROM delivery_items;
    DELETE FROM deliveries;
    DELETE FROM receipt_items;
    DELETE FROM receipts;
    DELETE FROM inventory;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM sqlite_sequence;
  `);

  db.pragma('foreign_keys = ON');

  // 1. Seed Categories
  const categoryStmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  const categories = [
    { name: 'Raw Materials', description: 'Metals, cement, pipes, and bulk industrial inputs' },
    { name: 'Industrial Hardware', description: 'Bearings, bolts, fasteners, and mechanical fittings' },
    { name: 'Electrical Components', description: 'Copper wires, cables, switches, and transformers' },
    { name: 'Safety Equipment', description: 'Helmets, gloves, jackets, and protective gear' },
    { name: 'Office Equipment', description: 'Chairs, desks, and warehouse office supplies' },
    { name: 'Packaging', description: 'Corrugated boxes, strapping, and wrap' },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const info = categoryStmt.run(cat.name, cat.description);
    categoryMap[cat.name] = info.lastInsertRowid;
  }

  // 2. Seed Products
  const productStmt = db.prepare(`
    INSERT INTO products (
      name, sku, barcode, category_id, brand, uom, product_type,
      initial_stock, reorder_level, safety_stock, min_stock, max_stock
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productsData = [
    { name: 'Steel Rods 12mm', sku: 'STL-001', barcode: '8901001001', category: 'Raw Materials', brand: 'TATA Tiscon', uom: 'kg', initial_stock: 0, reorder_level: 60, safety_stock: 20, min_stock: 20, max_stock: 1000 },
    { name: 'Industrial Bearings 6204', sku: 'BRG-6204', barcode: '8901001002', category: 'Industrial Hardware', brand: 'SKF', uom: 'units', initial_stock: 0, reorder_level: 40, safety_stock: 15, min_stock: 15, max_stock: 500 },
    { name: 'Copper Wire 2.5mm', sku: 'CPR-250', barcode: '8901001003', category: 'Electrical Components', brand: 'Havells', uom: 'meters', initial_stock: 0, reorder_level: 100, safety_stock: 30, min_stock: 30, max_stock: 2000 },
    { name: 'Safety Helmets Yellow', sku: 'SFT-HLM-Y', barcode: '8901001004', category: 'Safety Equipment', brand: 'Karam', uom: 'units', initial_stock: 0, reorder_level: 25, safety_stock: 10, min_stock: 10, max_stock: 300 },
    { name: 'Ergonomic Office Chair', sku: 'OFC-CHR-01', barcode: '8901001005', category: 'Office Equipment', brand: 'Featherlite', uom: 'units', initial_stock: 0, reorder_level: 8, safety_stock: 3, min_stock: 3, max_stock: 50 },
    { name: 'Corrugated Packaging Boxes', sku: 'PKG-BX-L', barcode: '8901001006', category: 'Packaging', brand: 'PackRight', uom: 'boxes', initial_stock: 0, reorder_level: 200, safety_stock: 50, min_stock: 50, max_stock: 5000 },
    { name: 'Welding Electrodes E6013', sku: 'WLD-ELC-60', barcode: '8901001007', category: 'Raw Materials', brand: 'ESAB', uom: 'kg', initial_stock: 0, reorder_level: 50, safety_stock: 15, min_stock: 15, max_stock: 800 },
    { name: 'Industrial Hex Bolts M10', sku: 'BLT-M10', barcode: '8901001008', category: 'Industrial Hardware', brand: 'Unbrako', uom: 'units', initial_stock: 0, reorder_level: 400, safety_stock: 100, min_stock: 100, max_stock: 10000 },
    { name: 'PVC Pipes 4-inch', sku: 'PVC-4IN', barcode: '8901001009', category: 'Raw Materials', brand: 'Supreme', uom: 'meters', initial_stock: 0, reorder_level: 80, safety_stock: 25, min_stock: 25, max_stock: 1500 },
    { name: 'Cement Bags 50kg', sku: 'CMT-50KG', barcode: '8901001010', category: 'Raw Materials', brand: 'UltraTech', uom: 'bags', initial_stock: 0, reorder_level: 70, safety_stock: 20, min_stock: 20, max_stock: 1000 },
  ];

  const productMap = {};
  for (const p of productsData) {
    const catId = categoryMap[p.category];
    const info = productStmt.run(p.name, p.sku, p.barcode, catId, p.brand, p.uom, 'STORABLE', p.initial_stock, p.reorder_level, p.safety_stock, p.min_stock, p.max_stock);
    productMap[p.sku] = { id: info.lastInsertRowid, ...p };
  }

  // 3. Seed Opening Stock (Historical baseline)
  console.log('📦 Seeding Opening Stock...');
  inventoryService.createOpeningStock({
    reference: 'INIT-STL-001',
    productId: productMap['STL-001'].id,
    locationId: 'LOC-MAIN-01',
    warehouseId: 'WH-01',
    quantity: 150,
    unit: 'kg',
    openingDate: '2026-09-01',
  });

  inventoryService.createOpeningStock({
    reference: 'INIT-CPR-250',
    productId: productMap['CPR-250'].id,
    locationId: 'LOC-MAIN-01',
    warehouseId: 'WH-01',
    quantity: 250,
    unit: 'meters',
    openingDate: '2026-09-01',
  });

  inventoryService.createOpeningStock({
    reference: 'INIT-BRG-6204',
    productId: productMap['BRG-6204'].id,
    locationId: 'LOC-MAIN-01',
    warehouseId: 'WH-01',
    quantity: 80,
    unit: 'units',
    openingDate: '2026-09-01',
  });

  inventoryService.createOpeningStock({
    reference: 'INIT-SFT-HLM-Y',
    productId: productMap['SFT-HLM-Y'].id,
    locationId: 'LOC-MAIN-01',
    warehouseId: 'WH-01',
    quantity: 30,
    unit: 'units',
    openingDate: '2026-09-01',
  });

  inventoryService.createOpeningStock({
    reference: 'INIT-CMT-50KG',
    productId: productMap['CMT-50KG'].id,
    locationId: 'LOC-MAIN-01',
    warehouseId: 'WH-01',
    quantity: 100,
    unit: 'bags',
    openingDate: '2026-09-01',
  });

  // Location B baseline (Multi-location inventory distribution demo)
  inventoryService.createOpeningStock({
    reference: 'INIT-STL-001-LOC2',
    productId: productMap['STL-001'].id,
    locationId: 'LOC-RACK-B2',
    warehouseId: 'WH-01',
    quantity: 35,
    unit: 'kg',
    openingDate: '2026-09-01',
  });

  // 4. Seed Receipts
  console.log('🚚 Seeding Stock Receipts...');

  // Receipt 1 (Validated -> DONE)
  const rec1Stmt = db.prepare(`
    INSERT INTO receipts (receipt_number, supplier, date, warehouse_id, location_id, status, notes, reference)
    VALUES ('REC-10001', 'TATA Steel Ltd', '2026-09-10', 'WH-01', 'LOC-MAIN-01', 'DRAFT', 'High grade structural steel batch', 'PO-9821')
  `);
  const rec1Id = rec1Stmt.run().lastInsertRowid;
  db.prepare(`INSERT INTO receipt_items (receipt_id, product_id, quantity, unit, unit_price) VALUES (?, ?, 100, 'kg', 85)`).run(rec1Id, productMap['STL-001'].id);
  inventoryService.validateReceipt(rec1Id); // Stock: 150 + 100 = 250 kg

  // Receipt 2 (Validated -> DONE)
  const rec2Stmt = db.prepare(`
    INSERT INTO receipts (receipt_number, supplier, date, warehouse_id, location_id, status, notes, reference)
    VALUES ('REC-10002', 'Havells Electricals India', '2026-09-15', 'WH-01', 'LOC-MAIN-01', 'DRAFT', 'Insulated copper cables', 'PO-9844')
  `);
  const rec2Id = rec2Stmt.run().lastInsertRowid;
  db.prepare(`INSERT INTO receipt_items (receipt_id, product_id, quantity, unit, unit_price) VALUES (?, ?, 150, 'meters', 120)`).run(rec2Id, productMap['CPR-250'].id);
  inventoryService.validateReceipt(rec2Id); // Stock: 250 + 150 = 400 meters

  // Receipt 3 (DRAFT)
  const rec3Stmt = db.prepare(`
    INSERT INTO receipts (receipt_number, supplier, date, warehouse_id, location_id, status, notes, reference)
    VALUES ('REC-10003', 'SKF Bearings Mfg', '2026-09-24', 'WH-01', 'LOC-MAIN-01', 'DRAFT', 'Precision ball bearings awaiting inspection', 'PO-9910')
  `);
  const rec3Id = rec3Stmt.run().lastInsertRowid;
  db.prepare(`INSERT INTO receipt_items (receipt_id, product_id, quantity, unit, unit_price) VALUES (?, ?, 50, 'units', 340)`).run(rec3Id, productMap['BRG-6204'].id);

  // 5. Seed Deliveries
  console.log('🚛 Seeding Delivery Orders...');

  // Delivery 1 (Validated -> DONE)
  const del1Stmt = db.prepare(`
    INSERT INTO deliveries (delivery_number, destination, date, source_warehouse_id, source_location_id, status, reference, notes)
    VALUES ('DEL-20001', 'L&T Infrastructure Site Alpha', '2026-09-18', 'WH-01', 'LOC-MAIN-01', 'DRAFT', 'DO-5510', 'Dispatched via heavy truck')
  `);
  const del1Id = del1Stmt.run().lastInsertRowid;
  db.prepare(`INSERT INTO delivery_items (delivery_id, product_id, quantity, unit) VALUES (?, ?, 50, 'kg')`).run(del1Id, productMap['STL-001'].id);
  inventoryService.validateDelivery(del1Id); // Stock: 250 - 50 = 200 kg

  // Delivery 2 (Validated -> DONE)
  const del2Stmt = db.prepare(`
    INSERT INTO deliveries (delivery_number, destination, date, source_warehouse_id, source_location_id, status, reference, notes)
    VALUES ('DEL-20002', 'Delhi Metro Rail Corp Site B', '2026-09-22', 'WH-01', 'LOC-MAIN-01', 'DRAFT', 'DO-5532', 'Urgent cable wiring supply')
  `);
  const del2Id = del2Stmt.run().lastInsertRowid;
  db.prepare(`INSERT INTO delivery_items (delivery_id, product_id, quantity, unit) VALUES (?, ?, 80, 'meters')`).run(del2Id, productMap['CPR-250'].id);
  inventoryService.validateDelivery(del2Id); // Stock: 400 - 80 = 320 meters

  // 6. Seed Physical Verification & Adjustments
  console.log('⚖️ Seeding Stock Adjustments & Anomaly Triggers...');

  // Adjustment 1 (Steel Rods: 200 -> 197)
  const adj1Info = db.prepare(`
    INSERT INTO adjustments (adjustment_number, product_id, location_id, warehouse_id, system_quantity, physical_quantity, variance, reason, status)
    VALUES ('ADJ-30001', ?, 'LOC-MAIN-01', 'WH-01', 200, 197, -3, 'Surface oxidation rust trim loss during monthly physical count', 'DRAFT')
  `).run(productMap['STL-001'].id);
  inventoryService.completeAdjustment(adj1Info.lastInsertRowid); // Final stock: 197 kg

  // Adjustment 2 (Cement Bags: 100 -> 85 - High Variance Anomaly Trigger!)
  const adj2Info = db.prepare(`
    INSERT INTO adjustments (adjustment_number, product_id, location_id, warehouse_id, system_quantity, physical_quantity, variance, reason, status)
    VALUES ('ADJ-30002', ?, 'LOC-MAIN-01', 'WH-01', 100, 85, -15, 'Moisture exposure damage in warehouse corner during monsoon season', 'DRAFT')
  `).run(productMap['CMT-50KG'].id);
  inventoryService.completeAdjustment(adj2Info.lastInsertRowid); // Final stock: 85 bags

  console.log('✅ StockSense Inventory Database Seed Complete!');
  console.log(`Summary: ${categories.length} Categories, ${productsData.length} Products, Historical Receipts, Deliveries, Adjustments & Ledgers created.`);
}

seedDatabase();
