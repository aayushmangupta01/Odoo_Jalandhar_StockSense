# StockSense --- Intelligent Inventory Management System

> **Hackathon Edition**

> StockSense is a modular Inventory Management System that goes beyond
> basic stock CRUD by adding **inventory intelligence, anomaly
> detection, forecasting, explainable stock movements, and
> natural-language inventory analysis**.

------------------------------------------------------------------------

## ⚡ Quickstart & Setup Guide (How to Run)

### 📋 System Prerequisites
- **Node.js**: `v18.0.0` or higher (Recommended: `v20` or `v22`). Check with `node -v`.
- **npm**: `v9.0.0` or higher. Check with `npm -v`.
- **Git**: Installed on system.

---

### 🚀 1-Step Automatic Setup
Clone the repository and run the setup command from the project root:

```bash
# 1. Clone repository
git clone https://github.com/aayushmangupta01/Odoo_Jalandhar_StockSense.git
cd Odoo_Jalandhar_StockSense

# 2. Run automated setup (Installs client & server packages + seeds database)
npm run setup

# 3. Start application (Launches both Backend Server & Vite Frontend concurrently)
npm run dev
```

The application will automatically start:
- 🌐 **Frontend (Vite + React)**: `http://localhost:3000/inventory/products`
- ⚡ **Backend API (Express + SQLite)**: `http://localhost:5000`

---

### 💻 Alternative 2-Terminal Manual Setup

If you prefer running frontend and backend in separate terminal windows:

#### Terminal 1: Backend Server (Express + SQLite)
```bash
cd server
npm install
npm run seed     # Populates realistic demo categories, products & transaction ledgers
npm run dev      # Runs Express server on http://localhost:5000
```

#### Terminal 2: Frontend Client (React + Vite + Tailwind)
```bash
cd client
npm install
npm run dev      # Runs Vite dev server on http://localhost:3000
```

---

### 🧪 Running Automated Tests
To run the automated inventory integration test suite:

```bash
npm run test     # Runs 8/8 automated test assertions
```

---

### 🛠️ Dependencies Breakdown

#### Monorepo Root (`package.json`):
- `concurrently` (^9.1.2): Runs client and server dev scripts in parallel.

#### Backend (`server/package.json`):
- `express` (^5.2.1): REST API web framework.
- `better-sqlite3` (^13.0.3): High-performance, zero-config SQLite database engine.
- `cors` (^2.8.6): Enables cross-origin request handling.
- `dotenv` (^18.0.4): Environment variable loader.
- `jsonwebtoken` (^9.0.3) & `bcrypt` (^6.0.0): Authentication utilities.
- `nodemon` (^3.1.14): Auto-reloading development server.

#### Frontend (`client/package.json`):
- `react` (^19.3.0) & `react-dom` (^19.3.0): UI library.
- `react-router-dom` (^7.18.4): Client-side routing.
- `axios` (^1.20.0): HTTP client for API consumption.
- `recharts` (^3.10.1): Interactive data visualization charts.
- `lucide-react` (^1.48.0): Icon set.
- `tailwindcss` (^4.3.3) & `@tailwindcss/vite` (^4.3.3): Utility-first styling engine.
- `vite` (^8.3.1): Next-gen frontend toolchain.

---

### ❓ Troubleshooting & Frequently Asked Questions

#### 1. `EADDRINUSE: port 5000 or 3000 already in use`
Kill existing processes using the ports:
- **macOS/Linux**: `lsof -i :5000` then `kill -9 <PID>`
- **Windows**: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`

#### 2. Reset Database to Clean Demo State
If test data gets cluttered, reset the database to clean demo state anytime with:
```bash
npm run seed
```

------------------------------------------------------------------------

## 1. Problem Statement

Businesses often depend on manual registers, Excel sheets, and
disconnected inventory records. This makes it difficult to maintain
accurate stock, understand why quantities changed, identify unusual
activity, and anticipate future shortages.

The core problem statement requires a centralized system for products,
receipts, deliveries, internal transfers, adjustments, stock alerts,
multi-warehouse inventory, SKU search, and stock movement history.
fileciteturn0file0L2-L24 fileciteturn0file0L43-L87

### StockSense's approach

Instead of stopping at:

> **"How much stock do we have?"**

StockSense aims to answer:

> **"What changed, why did it change, what looks unusual, what may
> happen next, and what action could be considered?"**

------------------------------------------------------------------------

# 2. Product Vision

``` text
TRADITIONAL INVENTORY
        │
        ├── Products
        ├── Receipts
        ├── Deliveries
        ├── Transfers
        └── Adjustments
                 │
                 ▼
             STOCKSENSE
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
    TRACEABILITY INTELLIGENCE FORECASTING
        │        │        │
        └────────┼────────┘
                 ▼
        ACTIONABLE INVENTORY INSIGHTS
```

------------------------------------------------------------------------

# 3. Target Users

## Inventory Manager

-   Manage products and stock
-   Monitor inventory health
-   Manage incoming/outgoing operations
-   Review stock movements
-   Investigate unusual inventory activity
-   Monitor forecasts and alerts

## Warehouse Staff

-   Pick and pack products
-   Perform internal transfers
-   Count physical inventory
-   Process receipts and deliveries
-   View location-wise stock

The source problem statement identifies **Inventory Managers** and
**Warehouse Staff** as the target users. fileciteturn0file0L4-L10

------------------------------------------------------------------------

# 4. Core Functional Requirements

## FR-01 Authentication

The system shall support:

-   Signup
-   Login
-   OTP-based password reset
-   Secure logout
-   Dashboard redirection after successful authentication

### Input

``` text
Name
Email / Username
Password
OTP
```

### Output

``` text
Successful authentication
        ↓
Inventory Dashboard
```

------------------------------------------------------------------------

# 5. Dashboard

## FR-02 Inventory Dashboard

The dashboard shall display:

-   Total Products in Stock
-   Low Stock Items
-   Out-of-Stock Items
-   Pending Receipts
-   Pending Deliveries
-   Scheduled Internal Transfers

### Dynamic Filters

-   Document type
    -   Receipt
    -   Delivery
    -   Internal Transfer
    -   Adjustment
-   Status
    -   Draft
    -   Waiting
    -   Ready
    -   Done
    -   Canceled
-   Warehouse / Location
-   Product Category

These dashboard requirements are directly aligned with the supplied PS.
fileciteturn0file0L11-L24

------------------------------------------------------------------------

# 6. Product Management

## FR-03 Product Creation & Management

Each product should support:

  Field             Description
  ----------------- ----------------------------
  Product Name      Human-readable name
  SKU / Code        Unique product identifier
  Category          Product classification
  Unit of Measure   kg, units, boxes, etc.
  Initial Stock     Optional starting quantity

The system shall support product updates and location-wise stock
visibility. fileciteturn0file0L26-L31

------------------------------------------------------------------------

# 7. Smart Search & Filtering

## FR-04 Intelligent Inventory Search

Users shall be able to search by:

-   SKU
-   Product name
-   Category
-   Warehouse
-   Location

### Proposed enhancement

Search should support natural-language queries such as:

``` text
"Show low-stock steel products"

"Which products are below reorder level?"

"Show all stock movements for STL-001"
```

The natural-language layer is a proposed hackathon enhancement, while
SKU search and smart filters are part of the supplied PS.
fileciteturn0file0L84-L87

------------------------------------------------------------------------

# 8. Receipts

## FR-05 Incoming Stock

Used when goods arrive from vendors.

### Workflow

``` text
Create Receipt
      ↓
Select Supplier
      ↓
Add Products
      ↓
Enter Quantity
      ↓
Validate
      ↓
Stock Increases
      ↓
Ledger Entry
```

### Input

``` text
Supplier
Product
Quantity
Warehouse / Location
```

### Output

``` text
Updated Stock
Receipt Status
Ledger Entry
Dashboard Update
```

The source PS specifies that validating a receipt automatically
increases stock. fileciteturn0file0L51-L59

------------------------------------------------------------------------

# 9. Delivery Orders

## FR-06 Outgoing Stock

Used when stock leaves the warehouse.

### Workflow

``` text
Delivery Order
      ↓
Pick
      ↓
Pack
      ↓
Validate
      ↓
Stock Decreases
      ↓
Ledger Entry
```

### Input

``` text
Product
Quantity
Source Location
Delivery Reference
```

### Output

``` text
Updated Stock
Delivery Status
Ledger Entry
```

The PS specifies that validating a delivery decreases stock
automatically. fileciteturn0file0L61-L68

------------------------------------------------------------------------

# 10. Internal Transfers

## FR-07 Location-to-Location Movement

Supported examples:

``` text
Main Warehouse → Production Floor
Rack A → Rack B
Warehouse 1 → Warehouse 2
```

### Critical rule

Internal transfers change **location**, not total inventory.

``` text
Source Location
       - Quantity
           │
           ▼
Destination Location
       + Quantity
```

### Output

``` text
Source Location Updated
Destination Location Updated
Total Stock Preserved
Ledger Entry Created
```

The supplied PS explicitly requires internal movements to be logged in
the ledger. fileciteturn0file0L69-L75

------------------------------------------------------------------------

# 11. Stock Adjustments

## FR-08 Physical Reconciliation

Used when recorded stock differs from physical stock.

### Workflow

``` text
Select Product + Location
          ↓
Enter Physical Count
          ↓
Compare Recorded Stock
          ↓
Calculate Difference
          ↓
Update Inventory
          ↓
Create Ledger Entry
```

### Example

``` text
Recorded = 100 kg
Physical = 97 kg

Adjustment = -3 kg
Final Stock = 97 kg
```

This directly follows the supplied adjustment workflow.
fileciteturn0file0L76-L83

------------------------------------------------------------------------

# 12. Stock Ledger

## FR-09 Complete Traceability

Every stock-changing operation must create a ledger event.

### Ledger Fields

``` text
Timestamp
Operation Type
Product
Quantity
Source Location
Destination Location
Before Quantity
After Quantity
Reference
User
Reason
```

### Supported operations

``` text
RECEIPT
DELIVERY
INTERNAL_TRANSFER
ADJUSTMENT
```

The stock ledger is the foundation for the proposed intelligence
features.

------------------------------------------------------------------------

# 13. 🚨 Inventory Anomaly Detection

## FR-10 Unusual Activity Detection

This is one of the main hackathon differentiators.

Instead of simply showing stock changes, StockSense identifies
potentially unusual movements.

### Example

``` text
STEEL RODS

Normal Daily Movement
10–20 kg

Today's Movement
74 kg

Deviation
4.2× Normal

⚠️ UNUSUAL INVENTORY ACTIVITY
```

### Possible detection approaches

-   Moving average
-   Z-score
-   Statistical thresholding
-   Isolation Forest

### Output

``` text
Anomaly Detected
      ↓
Affected Product
      ↓
Affected Operation
      ↓
Deviation
      ↓
Explainable Reason
```

> The system should describe activity as **unusual/high-risk**, not
> automatically label it as fraud.

------------------------------------------------------------------------

# 14. 🔮 Stock Depletion Forecast

## FR-11 Inventory Forecasting

Instead of only displaying:

``` text
LOW STOCK
```

StockSense can estimate when current stock may reach a critical level.

### Example

``` text
STEEL RODS

Current Stock       120 kg
Average Usage        18 kg/day

Estimated Depletion
≈ 6.7 days

Expected Risk Date
03 October

⚠️ SHORTAGE RISK
```

### Inputs

``` text
Current Stock
Historical Consumption
Reorder Threshold
Time Window
```

### Outputs

``` text
Consumption Rate
Estimated Days Remaining
Projected Stock
Potential Shortage Date
```

Forecasts are estimates and should be presented with appropriate
uncertainty rather than as guaranteed outcomes.

------------------------------------------------------------------------

# 15. 🧠 Stock Detective --- Natural Language Inventory Assistant

## FR-12 Ask StockSense

Users can ask inventory questions using natural language.

### Example Queries

``` text
"Why did steel inventory decrease yesterday?"

"Which products are at risk of stockout?"

"Where is most of our steel stored?"

"Show unusual inventory movements."

"Which warehouse needs attention?"
```

### Example Response

``` text
STEEL INVENTORY ANALYSIS

Starting Stock       240 kg
Ending Stock         177 kg

Net Decrease          63 kg

Delivery              -40 kg
Internal Consumption  -20 kg
Adjustment             -3 kg

Primary Contributor:
Delivery Operations
```

### Core principle

The assistant should answer using actual inventory records and ledger
events rather than generating unsupported explanations.

------------------------------------------------------------------------

# 16. 💡 "Why Did My Stock Change?"

## FR-13 Explainable Inventory

Every product can have a **Why?** action.

### Example

``` text
CURRENT STOCK
77 kg

WHY 77 KG?

100 kg
  │
  ├── +100 kg Receipt
  │
  ├── -40 kg Internal Transfer
  │
  ├── -20 kg Delivery
  │
  └──  -3 kg Adjustment
  │
  ▼
77 kg
```

### User gets

``` text
What changed?
Why it changed?
When it changed?
Which operation caused it?
Which location was involved?
```

This converts the stock ledger into a human-readable explanation layer.

------------------------------------------------------------------------

# 17. 📍 Location Intelligence

## FR-14 Inventory Distribution Analysis

StockSense should visualize how a product is distributed across
locations.

### Example

``` text
STEEL RODS

Warehouse A       120 kg
Production Rack    30 kg
Warehouse B        50 kg
------------------------
Total             200 kg
```

### Additional insights

``` text
Highest stock location
Lowest stock location
Location imbalance
Recent transfer activity
```

This extends the PS's multi-warehouse requirement into an analytical
view. fileciteturn0file0L84-L87

------------------------------------------------------------------------

# 18. ⚡ Smart Transfer Recommendation

## FR-15 Inventory Redistribution Suggestions

StockSense can detect potential location imbalance.

### Example

``` text
WAREHOUSE A
Steel = 180 kg

WAREHOUSE B
Steel = 12 kg

Expected Usage B
20 kg/day
```

System:

``` text
⚠️ LOCATION IMBALANCE

Warehouse B may face shortage.

Suggested transfer:
40 kg

Warehouse A → Warehouse B
```

The recommendation should remain **human-approved**.

The system suggests; the user decides.

------------------------------------------------------------------------

# 19. 🔐 High-Risk Adjustment Detection

## FR-16 Suspicious Inventory Activity

Large or unusual manual adjustments can be highlighted for review.

### Example

``` text
🚨 HIGH-RISK ADJUSTMENT

Product:
Steel Rods

Adjustment:
-80 kg

Normal adjustment range:
0–10 kg

Factors:
✓ Unusually large quantity
✓ Unusual timing
✓ Significant stock impact

STATUS:
REQUIRES REVIEW
```

This should be presented as a **risk signal**, not proof of fraud.

------------------------------------------------------------------------

# 20. Low Stock Alerts

## FR-17 Reorder Monitoring

The system shall support reorder rules and low-stock alerts.

### Logic

``` text
Current Stock
      ↓
Compare Reorder Threshold
      ↓
Below Threshold?
   /          \
 YES           NO
 ↓              ↓
Alert          Normal
```

The original PS explicitly requires alerts for low stock and reordering
rules. fileciteturn0file0L26-L31 fileciteturn0file0L84-L87

------------------------------------------------------------------------

# 21. Inventory State Model

Operations shall support controlled states:

``` text
DRAFT
  ↓
WAITING
  ↓
READY
  ↓
DONE

        ↘
       CANCELED
```

Dashboard filtering must support these statuses.

------------------------------------------------------------------------

# 22. Inventory Integrity Rules

## Rule 1 --- Receipt

``` text
New Stock = Old Stock + Received Quantity
```

## Rule 2 --- Delivery

``` text
New Stock = Old Stock - Delivered Quantity
```

## Rule 3 --- Internal Transfer

``` text
Total Stock Before = Total Stock After
```

## Rule 4 --- Adjustment

``` text
New Stock = Physical Count
```

## Rule 5 --- Ledger

``` text
Every stock mutation → Ledger Event
```

------------------------------------------------------------------------

# 23. Input → Processing → Output

## Receipt

``` text
INPUT
Supplier + Product + Quantity + Location
        ↓
PROCESS
Receipt Validation
        ↓
OUTPUT
Stock Increase + Ledger Event
```

## Delivery

``` text
INPUT
Product + Quantity + Source
        ↓
PROCESS
Pick → Pack → Validate
        ↓
OUTPUT
Stock Decrease + Ledger Event
```

## Transfer

``` text
INPUT
Product + Quantity + Source + Destination
        ↓
PROCESS
Transfer Validation
        ↓
OUTPUT
Location Update + Ledger Event
```

## Adjustment

``` text
INPUT
Product + Location + Physical Count
        ↓
PROCESS
Recorded vs Physical Comparison
        ↓
OUTPUT
Adjusted Stock + Difference + Ledger Event
```

## Intelligence

``` text
INPUT
Inventory + Historical Operations + Ledger
        ↓
PROCESS
Analytics / Detection / Forecasting
        ↓
OUTPUT
Anomaly + Forecast + Explanation + Recommendation
```

------------------------------------------------------------------------

# 24. Non-Functional Requirements

## NFR-01 Usability

-   Simple warehouse-friendly interface
-   Minimal unnecessary clicks
-   Clear status indicators
-   Search-first workflows
-   Explainable alerts

## NFR-02 Performance

The application should provide responsive:

-   Product search
-   Dashboard loading
-   Stock lookup
-   Ledger retrieval
-   Receipt processing
-   Delivery processing
-   Transfer processing
-   Adjustment processing

## NFR-03 Reliability

Inventory updates should be atomic.

``` text
Validate
   ↓
Update Inventory
   ↓
Write Ledger
   ↓
Commit
```

A failed operation should not leave partially updated stock.

## NFR-04 Data Integrity

The system shall preserve:

-   SKU uniqueness
-   Quantity consistency
-   Location consistency
-   Ledger consistency
-   Operation history

## NFR-05 Security

-   Authenticated access
-   Password protection
-   OTP password reset
-   Protected inventory operations
-   Secure API communication
-   Appropriate authorization for sensitive actions

## NFR-06 Scalability

The architecture should support:

-   More products
-   More warehouses
-   More users
-   More transactions
-   Larger ledgers
-   More analytical data

## NFR-07 Maintainability

Modules should remain independently maintainable:

``` text
Authentication
Products
Inventory
Operations
Ledger
Alerts
Analytics
Forecasting
AI Assistant
```

## NFR-08 Auditability

All inventory-changing actions should remain traceable.

## NFR-09 Explainability

AI-driven outputs should provide:

``` text
Prediction / Alert
      ↓
Reason
      ↓
Supporting Data
```

The system should avoid unexplained black-box recommendations.

------------------------------------------------------------------------

# 25. Suggested Technical Intelligence Layer

``` text
                  STOCKSENSE
                      │
        ┌─────────────┴─────────────┐
        │                           │
   CORE IMS                    INTELLIGENCE
        │                           │
        ├── Products                ├── Anomaly Detection
        ├── Receipts                ├── Forecasting
        ├── Deliveries              ├── Stock Detective
        ├── Transfers               ├── Explainable Changes
        ├── Adjustments             ├── Location Intelligence
        └── Ledger                  └── Smart Recommendations
```

### Possible technologies

``` text
Frontend
React / Next.js

Backend
FastAPI / Flask / Node.js

Database
PostgreSQL / MongoDB

Analytics
Python
Pandas
NumPy

ML
Scikit-learn

Visualization
Recharts / Plotly / Chart.js

AI Assistant
LLM + controlled inventory query layer
```

Technology choices can be adapted to the team's existing stack.

------------------------------------------------------------------------

# 26. Hackathon Demo Flow

Do **not** demonstrate features randomly.

Tell one continuous story.

### Scene 1 --- Create Product

``` text
Steel Rods
SKU: STL-001
Initial Stock: 0 kg
```

### Scene 2 --- Receive

``` text
+100 kg
```

Dashboard:

``` text
Stock = 100 kg
```

### Scene 3 --- Transfer

``` text
Main Store → Production Rack
40 kg
```

Dashboard:

``` text
Main Store = 60 kg
Production = 40 kg
Total = 100 kg
```

### Scene 4 --- Delivery

``` text
-20 kg
```

Total:

``` text
80 kg
```

### Scene 5 --- Adjustment

Physical count:

``` text
77 kg
```

System:

``` text
Recorded = 80
Physical = 77

Adjustment = -3
```

### Scene 6 --- Explain

Click:

> **WHY 77 KG?**

Show the complete timeline.

### Scene 7 --- Intelligence

Trigger unusual activity / historical data:

``` text
⚠️ Unusual Movement Detected
```

### Scene 8 --- Forecast

``` text
Estimated depletion:
6.7 days
```

### Scene 9 --- Ask StockSense

Ask:

> **"Why is steel stock decreasing?"**

Show a grounded answer from the ledger.

### Scene 10 --- Recommendation

``` text
⚠️ Warehouse B may face shortage.

Suggested redistribution:
40 kg
```

This gives judges one connected story instead of nine disconnected
screens.

------------------------------------------------------------------------

# 27. Acceptance Criteria

### Core PS

-   [ ] Signup/login works
-   [ ] OTP password reset works
-   [ ] Dashboard works
-   [ ] Dashboard KPIs are displayed
-   [ ] Dynamic filters work
-   [ ] Products can be created/updated
-   [ ] SKU search works
-   [ ] Categories work
-   [ ] Reorder rules work
-   [ ] Receipts work
-   [ ] Deliveries work
-   [ ] Internal transfers work
-   [ ] Stock adjustments work
-   [ ] Multi-location inventory works
-   [ ] Low-stock alerts work
-   [ ] Stock ledger records movements
-   [ ] Operation statuses work
-   [ ] Profile/logout works

### Hackathon Differentiation

-   [ ] Inventory anomaly detection
-   [ ] Stock depletion forecasting
-   [ ] Natural-language Stock Detective
-   [ ] "Why did my stock change?" explanation
-   [ ] Location intelligence
-   [ ] Smart transfer recommendations
-   [ ] High-risk adjustment detection
-   [ ] Explainable intelligence outputs

------------------------------------------------------------------------

# 28. Key Demo Metrics

## Inventory Accuracy

``` text
Inventory Accuracy =
Correct Recorded Stock
---------------------- × 100
Verified Physical Stock
```

## Stock Variance

``` text
Variance =
Physical Quantity - Recorded Quantity
```

## Traceability

``` text
Traceability =
Operations with Ledger Entries
------------------------------ × 100
Total Stock-changing Operations
```

## Forecast Error

If forecasting is implemented:

``` text
Forecast Error =
|Predicted Consumption - Actual Consumption|
```

## Anomaly Detection

Evaluate against a labeled/demo dataset using appropriate classification
metrics if ground-truth anomaly labels are available.

------------------------------------------------------------------------

# 29. What Makes StockSense Different?

A conventional inventory system answers:

> **"What is the current stock?"**

StockSense aims to answer five additional questions:

``` text
1. WHAT changed?
       ↓
2. WHY did it change?
       ↓
3. WAS the change unusual?
       ↓
4. WHAT may happen next?
       ↓
5. WHAT action could be considered?
```

This creates a progression:

``` text
Inventory Management
        ↓
Inventory Visibility
        ↓
Inventory Intelligence
        ↓
Decision Support
```

------------------------------------------------------------------------

# 30. Hackathon Pitch

> **"Most inventory systems tell you what stock you have. StockSense
> tells you what changed, why it changed, what looks unusual, what may
> happen next, and what action could be considered --- while keeping
> every decision traceable to the underlying inventory data."**

------------------------------------------------------------------------

# 31. Requirement Boundary

### Directly derived from the supplied PS

-   Authentication
-   Dashboard
-   Products
-   Categories
-   Reordering
-   Receipts
-   Deliveries
-   Internal transfers
-   Stock adjustments
-   Move history
-   Low-stock alerts
-   Multi-warehouse support
-   SKU search
-   Stock ledger
-   Inventory operation statuses

These requirements are stated in the supplied StockSense problem
statement. fileciteturn0file0L26-L43 fileciteturn0file0L51-L87

### Proposed hackathon enhancements

-   Inventory anomaly detection
-   Stock depletion forecasting
-   Natural-language Stock Detective
-   Explainable stock changes
-   Location intelligence
-   Smart transfer recommendations
-   High-risk adjustment detection

These enhancements are intentionally separated from the original PS so
judges can clearly see what the team has added beyond the baseline
requirements.

------------------------------------------------------------------------

# 32. Final Product Philosophy

``` text
             STOCKSENSE
                 │
                 ▼
        ┌─────────────────┐
        │  TRUSTED STOCK  │
        └────────┬────────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
    TRACEABLE  EXPLAINED  PREDICTIVE
        │        │        │
        └────────┼────────┘
                 ▼
          BETTER DECISIONS
```

> **StockSense --- Don't just count inventory. Understand it.**
