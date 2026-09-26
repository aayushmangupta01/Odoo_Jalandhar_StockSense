# StockSense — Inventory Integration & Collaboration Contract

This document specifies the integration boundaries and API contracts between the **Inventory Management Module** and the **Dashboard** and **Warehouse Management** modules.

---

## 1. Dashboard Integration Contracts

The Dashboard teammate can consume these high-level Inventory APIs to display real-time inventory statistics without needing direct access to raw ledger tables:

### `GET /api/inventory/summary`
Returns high-level inventory counters and pending operation counts.

**Response (200 OK):**
```json
{
  "totalProducts": 10,
  "totalStock": 892,
  "lowStockItems": 2,
  "outOfStockItems": 0,
  "pendingReceipts": 1,
  "pendingDeliveries": 1
}
```

### `GET /api/inventory/low-stock`
Returns all products currently at or below their configured reorder level.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Steel Rods 12mm",
    "sku": "STL-001",
    "uom": "kg",
    "reorder_level": 60,
    "current_stock": 35
  }
]
```

### `GET /api/inventory/alerts`
Returns active (unresolved) inventory stock alerts.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "product_name": "Steel Rods 12mm",
    "sku": "STL-001",
    "alert_type": "LOW_STOCK",
    "message": "Product Steel Rods 12mm (SKU: STL-001) is below reorder level (35 / 60 kg).",
    "is_resolved": 0,
    "created_at": "2026-09-26 12:45:00"
  }
]
```

---

## 2. Warehouse Integration Contracts

The Warehouse teammate owns Warehouse CRUD, Godown, Rack, and Bin management screens. The Inventory module consumes location metadata using standard identifiers:

### Location Data Model Reference
- `warehouse_id` (string, e.g. `'WH-01'`)
- `location_id` (string, e.g. `'LOC-MAIN-01'`, `'LOC-RACK-B2'`)
- `godown_id` (optional string)
- `rack_id` (optional string)
- `bin_id` (optional string)

### Integration Assumptions
1. Inventory quantity state is stored per `(product_id, location_id)` composite key in the `inventory` database table.
2. Stock movements log `source_location_id` and `dest_location_id`.
3. Inventory does NOT render or manage Warehouse UI CRUD screens.

---

## 3. Database Entity Map (Inventory Scope)

- `products` (Product Master, SKU, UOM, Reorder Level, Safety Stock)
- `categories` (Item Classifications)
- `inventory` (Authoritative Stock by Product + Location)
- `receipts` & `receipt_items` (Goods Inward Workflow)
- `deliveries` & `delivery_items` (Goods Outward Workflow)
- `adjustments` (Physical Stock Reconciliation)
- `opening_stock` (Stock Baseline Setup)
- `stock_movements` (Operational Log Stream)
- `stock_ledger` (Immutable Audit Trail)
- `inventory_alerts` & `inventory_anomalies` & `inventory_forecasts` (Intelligence Layer)
