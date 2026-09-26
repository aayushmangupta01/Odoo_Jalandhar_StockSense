import { useMemo, useState } from "react";
import "./dashboard.css";

const stats = [
    {
        title: "Total Products in Stock",
        value: "1,248",
        change: "+8.2%",
        note: "vs last month",
        icon: "▦",
        type: "blue",
    },
    {
        title: "Low Stock Items",
        value: "37",
        change: "+5",
        note: "need attention",
        icon: "!",
        type: "amber",
    },
    {
        title: "Out-of-Stock Items",
        value: "75",
        change: "-3",
        note: "vs last week",
        icon: "×",
        type: "red",
    },
    {
        title: "Pending Receipts",
        value: "18",
        change: "6 today",
        note: "incoming",
        icon: "↓",
        type: "blue",
    },
    {
        title: "Pending Deliveries",
        value: "24",
        change: "9 today",
        note: "outgoing",
        icon: "↑",
        type: "blue",
    },
    {
        title: "Scheduled Internal Transfers",
        value: "12",
        change: "4 today",
        note: "internal",
        icon: "⇄",
        type: "blue",
    },
];

const movements = [
    {
        reference: "IN/2026/00481",
        product: "Laptop Dell Latitude",
        operation: "Receipt",
        warehouse: "Main Warehouse",
        category: "Computers",
        quantity: "+25",
        status: "Done",
        time: "10 min ago",
    },
    {
        reference: "OUT/2026/00392",
        product: "Wireless Keyboard",
        operation: "Delivery",
        warehouse: "Main Warehouse",
        category: "Accessories",
        quantity: "-40",
        status: "Done",
        time: "28 min ago",
    },
    {
        reference: "INT/2026/00128",
        product: "USB-C Hub",
        operation: "Internal Transfer",
        warehouse: "WH-A → WH-B",
        category: "Accessories",
        quantity: "60",
        status: "Ready",
        time: "1 hour ago",
    },
    {
        reference: "IN/2026/00480",
        product: "27-inch Monitor",
        operation: "Receipt",
        warehouse: "Electronics",
        category: "Electronics",
        quantity: "+15",
        status: "Waiting",
        time: "2 hours ago",
    },
    {
        reference: "OUT/2026/00391",
        product: "Mechanical Keyboard",
        operation: "Delivery",
        warehouse: "Main Warehouse",
        category: "Accessories",
        quantity: "-18",
        status: "Done",
        time: "3 hours ago",
    },
    {
        reference: "ADJ/2026/00074",
        product: "Steel Rods",
        operation: "Adjustment",
        warehouse: "Warehouse B",
        category: "Industrial",
        quantity: "-74",
        status: "Done",
        time: "4 hours ago",
    },
];

const alerts = [
    {
        product: "Wireless Mouse",
        sku: "WM-2048",
        stock: 8,
        minimum: 25,
        severity: "Critical",
    },
    {
        product: "USB-C Hub",
        sku: "UCH-1092",
        stock: 12,
        minimum: 30,
        severity: "Critical",
    },
    {
        product: "HDMI Cable 2m",
        sku: "HDMI-220",
        stock: 19,
        minimum: 35,
        severity: "Low",
    },
    {
        product: "Laptop Stand",
        sku: "LS-481",
        stock: 23,
        minimum: 40,
        severity: "Low",
    },
];

const filterOptions = {
    document: [
        "All Documents",
        "Receipt",
        "Delivery",
        "Internal Transfer",
        "Adjustment",
    ],
    status: [
        "All Statuses",
        "Draft",
        "Waiting",
        "Ready",
        "Done",
        "Canceled",
    ],
    warehouse: [
        "All Warehouses",
        "Main Warehouse",
        "Electronics",
        "WH-A → WH-B",
        "Warehouse B",
    ],
    category: [
        "All Categories",
        "Electronics",
        "Computers",
        "Accessories",
        "Office Supplies",
        "Industrial",
    ],
};

function StatCard({ item }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${item.type}`}>
                {item.icon}
            </div>

            <div className="stat-content">
                <span className="stat-title">
                    {item.title}
                </span>

                <strong>{item.value}</strong>

                <div className="stat-meta">
                    <span
                        className={
                            item.type === "amber" ||
                            item.type === "red"
                                ? "warning-text"
                                : "positive-text"
                        }
                    >
                        {item.change}
                    </span>

                    <span>{item.note}</span>
                </div>
            </div>
        </div>
    );
}

function Dashboard() {
    const [search, setSearch] = useState("");

    const [draftFilters, setDraftFilters] = useState({
        document: "All Documents",
        status: "All Statuses",
        warehouse: "All Warehouses",
        category: "All Categories",
    });

    const [filters, setFilters] = useState(draftFilters);

    const filteredMovements = useMemo(() => {
        const query = search.trim().toLowerCase();

        return movements.filter((item) => {
            const matchesSearch =
                !query ||
                [
                    item.reference,
                    item.product,
                    item.operation,
                    item.warehouse,
                    item.category,
                    item.status,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(query);

            const matchesDocument =
                filters.document === "All Documents" ||
                item.operation === filters.document;

            const matchesStatus =
                filters.status === "All Statuses" ||
                item.status === filters.status;

            const matchesWarehouse =
                filters.warehouse === "All Warehouses" ||
                item.warehouse === filters.warehouse;

            const matchesCategory =
                filters.category === "All Categories" ||
                item.category === filters.category;

            return (
                matchesSearch &&
                matchesDocument &&
                matchesStatus &&
                matchesWarehouse &&
                matchesCategory
            );
        });
    }, [search, filters]);

    const updateDraft = (key, value) => {
        setDraftFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const applyFilters = () => {
        setFilters(draftFilters);
    };

    const resetFilters = () => {
        const reset = {
            document: "All Documents",
            status: "All Statuses",
            warehouse: "All Warehouses",
            category: "All Categories",
        };

        setDraftFilters(reset);
        setFilters(reset);
    };

    return (
        <div className="dashboard-shell">

            {/* SIDEBAR */}

            <aside className="sidebar">

                <div className="brand">
                    <div className="brand-mark">
                        S
                    </div>

                    <div>
                        <h2>StockSense</h2>
                        <span>
                            Inventory Intelligence
                        </span>
                    </div>
                </div>

                <div className="menu-section">

                    <p className="menu-label">
                        MAIN
                    </p>

                    <a
                        className="menu-item active"
                        href="#dashboard"
                    >
                        <span>▦</span>
                        Dashboard
                    </a>

                    <a
                        className="menu-item"
                        href="#products"
                    >
                        <span>□</span>
                        Products
                    </a>

                    <a
                        className="menu-item"
                        href="#operations"
                    >
                        <span>⇄</span>
                        Operations
                    </a>

                    <a
                        className="menu-item"
                        href="#warehouse"
                    >
                        <span>⌂</span>
                        Warehouse
                    </a>

                </div>

                <div className="menu-section">

                    <p className="menu-label">
                        ANALYTICS
                    </p>

                    <a
                        className="menu-item"
                        href="#reports"
                    >
                        <span>▥</span>
                        Reports
                    </a>

                    <a
                        className="menu-item"
                        href="#ledger"
                    >
                        <span>◌</span>
                        Stock Ledger
                    </a>

                    <a
                        className="menu-item"
                        href="#ai-insights"
                    >
                        <span>✦</span>
                        AI Insights
                    </a>

                </div>

                <div className="menu-section">

                    <p className="menu-label">
                        SYSTEM
                    </p>

                    <a
                        className="menu-item"
                        href="#settings"
                    >
                        <span>⚙</span>
                        Settings
                    </a>

                </div>

                <div className="sidebar-bottom">

                    <div className="help-card">

                        <div className="help-icon">
                            ?
                        </div>

                        <div>
                            <strong>
                                Need help?
                            </strong>

                            <span>
                                View documentation
                            </span>
                        </div>

                    </div>

                    <div className="user-mini">

                        <div className="avatar">
                            KS
                        </div>

                        <div>
                            <strong>
                                Krish Saini
                            </strong>

                            <span>
                                Administrator
                            </span>
                        </div>

                        <span className="dots">
                            •••
                        </span>

                    </div>

                </div>

            </aside>

            {/* MAIN */}

            <main className="main-content">

                {/* TOPBAR */}

                <header className="topbar">

                    <div className="search-box">

                        <span>
                            ⌕
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search products, operations, references..."
                        />

                        <kbd>
                            Ctrl K
                        </kbd>

                    </div>

                    <div className="topbar-actions">

                        <button
                            className="icon-button"
                            title="Notifications"
                        >
                            ♧
                            <span className="notification-dot"></span>
                        </button>

                        <div className="topbar-divider"></div>

                        <div className="topbar-user">

                            <div className="avatar">
                                KS
                            </div>

                            <div>
                                <strong>
                                    Krish Saini
                                </strong>

                                <span>
                                    Administrator
                                </span>
                            </div>

                            <span>
                                ⌄
                            </span>

                        </div>

                    </div>

                </header>

                <div
                    className="page-container"
                    id="dashboard"
                >

                    {/* PAGE HEADER */}

                    <section className="page-header">

                        <div>

                            <div className="breadcrumb">
                                Home
                                <span>/</span>
                                Dashboard
                            </div>

                            <h1>
                                Inventory Overview
                            </h1>

                            <p>
                                Real-time stock management,
                                warehouse performance and
                                inventory intelligence.
                            </p>

                        </div>

                        <div className="header-actions">

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    window.location.reload()
                                }
                            >
                                ↻ Refresh
                            </button>

                            <button className="primary-button">
                                + New Operation
                            </button>

                        </div>

                    </section>

                    {/* KPI CARDS */}

                    <section className="stats-grid">

                        {stats.map((item) => (
                            <StatCard
                                key={item.title}
                                item={item}
                            />
                        ))}

                    </section>

                    {/* FILTERS */}

                    <section className="filter-card">

                        <div className="filter-heading">

                            <div>

                                <strong>
                                    Inventory Filters
                                </strong>

                                <span>
                                    Filter receipts, deliveries,
                                    transfers and adjustments
                                </span>

                            </div>

                            <button
                                className="reset-button"
                                onClick={resetFilters}
                            >
                                Reset
                            </button>

                        </div>

                        <div className="filters">

                            <label>

                                <span>
                                    Document Type
                                </span>

                                <select
                                    value={draftFilters.document}
                                    onChange={(e) =>
                                        updateDraft(
                                            "document",
                                            e.target.value
                                        )
                                    }
                                >
                                    {filterOptions.document.map(
                                        (item) => (
                                            <option
                                                key={item}
                                            >
                                                {item}
                                            </option>
                                        )
                                    )}
                                </select>

                            </label>

                            <label>

                                <span>
                                    Status
                                </span>

                                <select
                                    value={draftFilters.status}
                                    onChange={(e) =>
                                        updateDraft(
                                            "status",
                                            e.target.value
                                        )
                                    }
                                >
                                    {filterOptions.status.map(
                                        (item) => (
                                            <option
                                                key={item}
                                            >
                                                {item}
                                            </option>
                                        )
                                    )}
                                </select>

                            </label>

                            <label>

                                <span>
                                    Warehouse / Location
                                </span>

                                <select
                                    value={draftFilters.warehouse}
                                    onChange={(e) =>
                                        updateDraft(
                                            "warehouse",
                                            e.target.value
                                        )
                                    }
                                >
                                    {filterOptions.warehouse.map(
                                        (item) => (
                                            <option
                                                key={item}
                                            >
                                                {item}
                                            </option>
                                        )
                                    )}
                                </select>

                            </label>

                            <label>

                                <span>
                                    Product Category
                                </span>

                                <select
                                    value={draftFilters.category}
                                    onChange={(e) =>
                                        updateDraft(
                                            "category",
                                            e.target.value
                                        )
                                    }
                                >
                                    {filterOptions.category.map(
                                        (item) => (
                                            <option
                                                key={item}
                                            >
                                                {item}
                                            </option>
                                        )
                                    )}
                                </select>

                            </label>

                            <button
                                className="apply-button"
                                onClick={applyFilters}
                            >
                                Apply Filters
                            </button>

                        </div>

                    </section>

                    {/* ANALYTICS */}

                    <section className="analytics-grid">

                        <div className="panel category-panel">

                            <div className="panel-header">

                                <div>
                                    <h3>
                                        Stock Level by Category
                                    </h3>

                                    <p>
                                        Current inventory distribution
                                    </p>
                                </div>

                                <button className="more-button">
                                    •••
                                </button>

                            </div>

                            <div className="bar-chart">

                                {[
                                    ["Electronics", "420", "88%"],
                                    ["Computers", "365", "76%"],
                                    ["Accessories", "292", "61%"],
                                    ["Office Supplies", "171", "36%"],
                                ].map(
                                    ([name, value, width]) => (
                                        <div
                                            className="bar-item"
                                            key={name}
                                        >

                                            <div className="bar-label">

                                                <span>
                                                    {name}
                                                </span>

                                                <strong>
                                                    {value}
                                                </strong>

                                            </div>

                                            <div className="bar-track">

                                                <div
                                                    className="bar-fill"
                                                    style={{
                                                        width,
                                                    }}
                                                ></div>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                        </div>

                        <div className="panel health-panel">

                            <div className="panel-header">

                                <div>
                                    <h3>
                                        Inventory Health
                                    </h3>

                                    <p>
                                        Stock availability status
                                    </p>
                                </div>

                                <button className="more-button">
                                    •••
                                </button>

                            </div>

                            <div className="health-content">

                                <div className="donut">

                                    <div className="donut-center">

                                        <strong>
                                            91%
                                        </strong>

                                        <span>
                                            Healthy
                                        </span>

                                    </div>

                                </div>

                                <div className="health-list">

                                    <div>
                                        <span>
                                            <i className="dot healthy"></i>
                                            Healthy
                                        </span>

                                        <strong>
                                            1,136
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            <i className="dot low"></i>
                                            Low Stock
                                        </span>

                                        <strong>
                                            37
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            <i className="dot out"></i>
                                            Out of Stock
                                        </span>

                                        <strong>
                                            75
                                        </strong>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="panel warehouse-panel">

                            <div className="panel-header">

                                <div>
                                    <h3>
                                        Stock by Warehouse
                                    </h3>

                                    <p>
                                        Inventory distribution by location
                                    </p>
                                </div>

                                <button className="more-button">
                                    •••
                                </button>

                            </div>

                            <div className="warehouse-list">

                                {[
                                    [
                                        "WH",
                                        "Main Warehouse",
                                        "Jalandhar",
                                        "642",
                                        "51.4%",
                                    ],
                                    [
                                        "EL",
                                        "Electronics",
                                        "Jalandhar",
                                        "381",
                                        "30.5%",
                                    ],
                                    [
                                        "WH",
                                        "Warehouse B",
                                        "Phagwara",
                                        "225",
                                        "18.1%",
                                    ],
                                ].map(
                                    ([
                                        icon,
                                        name,
                                        place,
                                        value,
                                        percent,
                                    ]) => (
                                        <div
                                            className="warehouse-row"
                                            key={name}
                                        >

                                            <div className="warehouse-name">

                                                <div className="warehouse-icon">
                                                    {icon}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {name}
                                                    </strong>

                                                    <span>
                                                        {place}
                                                    </span>
                                                </div>

                                            </div>

                                            <div className="warehouse-value">

                                                <strong>
                                                    {value}
                                                </strong>

                                                <span>
                                                    {percent}
                                                </span>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>

                        </div>

                    </section>

                    {/* STOCK INTELLIGENCE */}

                    <section
                        className="panel intelligence-panel"
                        id="ai-insights"
                    >

                        <div className="panel-header">

                            <div>
                                <h3>
                                    Stock Intelligence
                                </h3>

                                <p>
                                    Demo AI insights designed
                                    for StockSense
                                </p>
                            </div>

                            <span className="ai-badge">
                                ✦ AI ASSISTED
                            </span>

                        </div>

                        <div className="intelligence-grid">

                            <div className="insight-card danger-insight">

                                <div className="insight-icon">
                                    !
                                </div>

                                <div>

                                    <span className="insight-label">
                                        Unusual Movement
                                    </span>

                                    <h4>
                                        Steel Rods moved
                                        4.2× above normal
                                    </h4>

                                    <p>
                                        74 kg moved today versus
                                        a normal daily movement
                                        of 10–20 kg.
                                    </p>

                                    <button>
                                        Explain movement →
                                    </button>

                                </div>

                            </div>

                            <div className="insight-card">

                                <div className="insight-icon">
                                    ◷
                                </div>

                                <div>

                                    <span className="insight-label">
                                        Depletion Forecast
                                    </span>

                                    <h4>
                                        Steel stock may
                                        deplete in 6.7 days
                                    </h4>

                                    <p>
                                        Current stock: 120 kg.
                                        Average usage:
                                        18 kg/day.
                                    </p>

                                    <button>
                                        View forecast →
                                    </button>

                                </div>

                            </div>

                            <div className="insight-card">

                                <div className="insight-icon">
                                    ⌂
                                </div>

                                <div>

                                    <span className="insight-label">
                                        Location Imbalance
                                    </span>

                                    <h4>
                                        Warehouse B has
                                        only 12 kg
                                    </h4>

                                    <p>
                                        Warehouse A has
                                        180 kg available
                                        for the same product.
                                    </p>

                                    <button>
                                        Suggest redistribution →
                                    </button>

                                </div>

                            </div>

                            <div className="insight-card">

                                <div className="insight-icon">
                                    ↔
                                </div>

                                <div>

                                    <span className="insight-label">
                                        Smart Transfer
                                    </span>

                                    <h4>
                                        Recommended transfer:
                                        40 kg
                                    </h4>

                                    <p>
                                        Redistribution can
                                        reduce shortage risk
                                        without creating
                                        another deficit.
                                    </p>

                                    <button>
                                        Create recommendation →
                                    </button>

                                </div>

                            </div>

                        </div>

                    </section>

                    {/* MOVEMENTS + ALERTS */}

                    <section className="bottom-grid">

                        <div className="panel movements-panel">

                            <div className="panel-header">

                                <div>

                                    <h3>
                                        Recent Stock Movements
                                    </h3>

                                    <p>
                                        {filteredMovements.length} operation
                                        {filteredMovements.length !== 1
                                            ? "s"
                                            : ""}{" "}
                                        shown
                                    </p>

                                </div>

                                <button className="view-all">
                                    View all →
                                </button>

                            </div>

                            <div className="table-wrapper">

                                <table>

                                    <thead>

                                        <tr>
                                            <th>REFERENCE</th>
                                            <th>PRODUCT</th>
                                            <th>OPERATION</th>
                                            <th>WAREHOUSE</th>
                                            <th>QTY</th>
                                            <th>STATUS</th>
                                            <th>TIME</th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {filteredMovements.length ? (
                                            filteredMovements.map(
                                                (movement) => (
                                                    <tr
                                                        key={
                                                            movement.reference
                                                        }
                                                    >

                                                        <td>
                                                            <strong className="reference">
                                                                {
                                                                    movement.reference
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {
                                                                movement.product
                                                            }
                                                        </td>

                                                        <td>
                                                            <span className="operation">
                                                                {
                                                                    movement.operation
                                                                }
                                                            </span>
                                                        </td>

                                                        <td>
                                                            {
                                                                movement.warehouse
                                                            }
                                                        </td>

                                                        <td>

                                                            <strong
                                                                className={
                                                                    movement.quantity.startsWith(
                                                                        "+"
                                                                    )
                                                                        ? "qty-positive"
                                                                        : movement.quantity.startsWith(
                                                                              "-"
                                                                          )
                                                                        ? "qty-negative"
                                                                        : ""
                                                                }
                                                            >
                                                                {
                                                                    movement.quantity
                                                                }
                                                            </strong>

                                                        </td>

                                                        <td>

                                                            <span
                                                                className={`status ${movement.status.toLowerCase()}`}
                                                            >
                                                                {
                                                                    movement.status
                                                                }
                                                            </span>

                                                        </td>

                                                        <td className="time">
                                                            {
                                                                movement.time
                                                            }
                                                        </td>

                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="empty-state"
                                                >
                                                    No operations match
                                                    the selected filters.
                                                </td>
                                            </tr>
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                        <div className="panel alerts-panel">

                            <div className="panel-header">

                                <div>

                                    <h3>
                                        Low Stock Alerts
                                    </h3>

                                    <p>
                                        Products requiring attention
                                    </p>

                                </div>

                                <span className="alert-count">
                                    {alerts.length}
                                </span>

                            </div>

                            <div className="alerts-list">

                                {alerts.map((alert) => (
                                    <div
                                        className="alert-item"
                                        key={alert.sku}
                                    >

                                        <div className="alert-product">

                                            <div className="product-icon">
                                                □
                                            </div>

                                            <div>

                                                <strong>
                                                    {alert.product}
                                                </strong>

                                                <span>
                                                    {alert.sku}
                                                </span>

                                            </div>

                                        </div>

                                        <div className="stock-info">

                                            <strong>
                                                {alert.stock}
                                            </strong>

                                            <span>
                                                / {alert.minimum}
                                            </span>

                                        </div>

                                        <span
                                            className={`severity ${alert.severity.toLowerCase()}`}
                                        >
                                            {alert.severity}
                                        </span>

                                    </div>
                                ))}

                            </div>

                            <button className="alerts-button">
                                View all alerts →
                            </button>

                        </div>

                    </section>

                    <footer className="dashboard-footer">

                        <span>
                            StockSense Inventory Management
                        </span>

                        <span>
                            Dashboard demo data · Backend integration pending
                        </span>

                    </footer>

                </div>

            </main>

        </div>
    );
}

export default Dashboard;
