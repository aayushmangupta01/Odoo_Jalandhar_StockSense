const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'stocksense.db');
const db = new Database(dbPath, { verbose: null });

// Enable Foreign Keys & Write-Ahead Logging for concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      barcode TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      brand TEXT,
      uom TEXT NOT NULL DEFAULT 'units',
      product_type TEXT DEFAULT 'STORABLE',
      initial_stock REAL DEFAULT 0,
      reorder_level REAL DEFAULT 10,
      safety_stock REAL DEFAULT 5,
      min_stock REAL DEFAULT 5,
      max_stock REAL DEFAULT 1000,
      track_batch INTEGER DEFAULT 0,
      track_lot INTEGER DEFAULT 0,
      track_serial INTEGER DEFAULT 0,
      track_expiry INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      location_id TEXT NOT NULL DEFAULT 'LOC-MAIN-01',
      warehouse_id TEXT NOT NULL DEFAULT 'WH-01',
      quantity REAL NOT NULL DEFAULT 0,
      reserved_quantity REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, location_id)
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT NOT NULL UNIQUE,
      supplier TEXT NOT NULL,
      date TEXT NOT NULL,
      warehouse_id TEXT NOT NULL DEFAULT 'WH-01',
      location_id TEXT NOT NULL DEFAULT 'LOC-MAIN-01',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      notes TEXT,
      reference TEXT,
      created_by TEXT DEFAULT 'Inventory Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS receipt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'units',
      batch_number TEXT,
      serial_number TEXT,
      expiry_date TEXT,
      unit_price REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_number TEXT NOT NULL UNIQUE,
      destination TEXT NOT NULL,
      date TEXT NOT NULL,
      source_warehouse_id TEXT NOT NULL DEFAULT 'WH-01',
      source_location_id TEXT NOT NULL DEFAULT 'LOC-MAIN-01',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      reference TEXT,
      notes TEXT,
      created_by TEXT DEFAULT 'Inventory Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'units'
    );

    CREATE TABLE IF NOT EXISTS adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adjustment_number TEXT NOT NULL UNIQUE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      location_id TEXT NOT NULL DEFAULT 'LOC-MAIN-01',
      warehouse_id TEXT NOT NULL DEFAULT 'WH-01',
      system_quantity REAL NOT NULL,
      physical_quantity REAL NOT NULL,
      variance REAL NOT NULL,
      reason TEXT NOT NULL,
      user_id TEXT DEFAULT 'Inventory Admin',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opening_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT NOT NULL UNIQUE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      location_id TEXT NOT NULL DEFAULT 'LOC-MAIN-01',
      warehouse_id TEXT NOT NULL DEFAULT 'WH-01',
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'units',
      batch_number TEXT,
      serial_number TEXT,
      expiry_date TEXT,
      rate REAL DEFAULT 0,
      opening_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movement_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      product_id INTEGER NOT NULL REFERENCES products(id),
      sku TEXT NOT NULL,
      operation TEXT NOT NULL,
      quantity REAL NOT NULL,
      before_quantity REAL NOT NULL,
      after_quantity REAL NOT NULL,
      source_location_id TEXT,
      dest_location_id TEXT,
      user_id TEXT DEFAULT 'Inventory Admin',
      reference TEXT,
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      product_id INTEGER NOT NULL REFERENCES products(id),
      sku TEXT NOT NULL,
      operation TEXT NOT NULL,
      quantity_change REAL NOT NULL,
      previous_quantity REAL NOT NULL,
      new_quantity REAL NOT NULL,
      source_location TEXT,
      dest_location TEXT,
      reference TEXT,
      user TEXT DEFAULT 'Inventory Admin',
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      alert_type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_resolved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      operation TEXT NOT NULL,
      deviation_score REAL NOT NULL,
      severity TEXT NOT NULL DEFAULT 'UNUSUAL',
      title TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_forecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      current_stock REAL NOT NULL,
      avg_daily_consumption REAL NOT NULL,
      coverage_days REAL NOT NULL,
      shortage_risk_date TEXT,
      recommendation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initDatabase();

module.exports = db;
