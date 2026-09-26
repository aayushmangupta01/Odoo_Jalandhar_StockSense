import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    Bell,
    Boxes,
    BrainCircuit,
    Building2,
    Package,
    RefreshCw,
    ShieldAlert,
    Sparkles,
    Truck,
    Warehouse,
    Zap,
} from 'lucide-react';

import { inventoryApi } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { DataTable } from '../../components/common/DataTable';
import { useToast } from '../../components/common/ToastContext';

const emptySummary = {
    totalProducts: 0,
    totalStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
};

function formatNumber(value) {
    return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

function getValue(object, keys, fallback = '') {
    for (const key of keys) {
        if (
            object &&
            object[key] !== undefined &&
            object[key] !== null
        ) {
            return object[key];
        }
    }

    return fallback;
}

/* -------------------------------------------------------------------------- */
/* KPI CARD                                                                   */
/* -------------------------------------------------------------------------- */

function MetricCard({ title, value, note, icon: Icon, type }) {
    const styles = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                        {note}
                    </p>
                </div>

                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${styles[type]}`}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* AI INSIGHT CARD                                                            */
/* -------------------------------------------------------------------------- */

function InsightCard({
    icon: Icon,
    title,
    heading,
    description,
    type,
    action,
}) {
    const styles = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex gap-3">
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${styles[type]}`}
                >
                    <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {title}
                    </p>

                    <h4 className="mt-1 text-sm font-semibold leading-5 text-slate-800">
                        {heading}
                    </h4>

                    <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                        {description}
                    </p>

                    {action && (
                        <button
                            type="button"
                            className="mt-2 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                            {action} →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* DASHBOARD                                                                  */
/* -------------------------------------------------------------------------- */

function Dashboard() {
    const { showToast } = useToast();

    const [summary, setSummary] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [movements, setMovements] = useState([]);

    const [anomalies, setAnomalies] = useState([]);
    const [forecasts, setForecasts] = useState([]);
    const [locations, setLocations] = useState([]);

    const [search, setSearch] = useState('');
    const [documentFilter, setDocumentFilter] = useState('All Documents');
    const [statusFilter, setStatusFilter] = useState('All Statuses');

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    /* ---------------------------------------------------------------------- */
    /* LOAD DASHBOARD                                                         */
    /* ---------------------------------------------------------------------- */

    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const results = await Promise.allSettled([
                inventoryApi.getSummary(),
                inventoryApi.getLowStock(),
                inventoryApi.getAlerts(),
                inventoryApi.getMovements(),
                inventoryApi.getAnomalies(),
                inventoryApi.getForecast(),
                inventoryApi.getLocationIntelligence(),
            ]);

            const [
                summaryResult,
                lowStockResult,
                alertsResult,
                movementsResult,
                anomalyResult,
                forecastResult,
                locationResult,
            ] = results;

            if (summaryResult.status === 'fulfilled') {
                setSummary(summaryResult.value);
            }

            if (lowStockResult.status === 'fulfilled') {
                setLowStock(
                    Array.isArray(lowStockResult.value)
                        ? lowStockResult.value
                        : []
                );
            }

            if (alertsResult.status === 'fulfilled') {
                setAlerts(
                    Array.isArray(alertsResult.value)
                        ? alertsResult.value
                        : []
                );
            }

            if (movementsResult.status === 'fulfilled') {
                setMovements(
                    Array.isArray(movementsResult.value)
                        ? movementsResult.value.slice(0, 10)
                        : []
                );
            }

            if (anomalyResult.status === 'fulfilled') {
                setAnomalies(
                    Array.isArray(anomalyResult.value)
                        ? anomalyResult.value
                        : []
                );
            }

            if (forecastResult.status === 'fulfilled') {
                setForecasts(
                    Array.isArray(forecastResult.value)
                        ? forecastResult.value
                        : []
                );
            }

            if (locationResult.status === 'fulfilled') {
                setLocations(
                    Array.isArray(locationResult.value)
                        ? locationResult.value
                        : []
                );
            }

            const failedRequests = results.filter(
                (result) => result.status === 'rejected'
            );

            if (failedRequests.length === results.length) {
                throw failedRequests[0].reason;
            }

            if (failedRequests.length > 0) {
                setErrorMessage(
                    'Some dashboard information could not be loaded.'
                );
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.message ||
                'Unable to load inventory data.';

            setErrorMessage(message);

            showToast(
                `Dashboard data could not be loaded: ${message}`,
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    /* ---------------------------------------------------------------------- */
    /* DATA                                                                    */
    /* ---------------------------------------------------------------------- */

    const metrics = summary || emptySummary;

    const metricCards = [
        {
            title: 'Total Products in Stock',
            value: metrics.totalProducts,
            note: 'Active products',
            icon: Boxes,
            type: 'blue',
        },
        {
            title: 'Total Stock',
            value: metrics.totalStock,
            note: 'Combined inventory quantity',
            icon: Package,
            type: 'green',
        },
        {
            title: 'Low Stock Items',
            value: metrics.lowStockItems,
            note: 'Need attention',
            icon: AlertTriangle,
            type: 'amber',
        },
        {
            title: 'Out-of-Stock Items',
            value: metrics.outOfStockItems,
            note: 'Currently unavailable',
            icon: ShieldAlert,
            type: 'red',
        },
        {
            title: 'Pending Receipts',
            value: metrics.pendingReceipts,
            note: 'Incoming stock',
            icon: ArrowDownLeft,
            type: 'blue',
        },
        {
            title: 'Pending Deliveries',
            value: metrics.pendingDeliveries,
            note: 'Outgoing stock',
            icon: ArrowUpRight,
            type: 'violet',
        },
    ];

    /* ---------------------------------------------------------------------- */
    /* FILTER MOVEMENTS                                                        */
    /* ---------------------------------------------------------------------- */

    const filteredMovements = useMemo(() => {
        const query = search.trim().toLowerCase();

        return movements.filter((movement) => {
            const searchableText = [
                movement.reference,
                movement.product_name,
                movement.product,
                movement.sku,
                movement.operation,
                movement.status,
                movement.warehouse,
                movement.location,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesSearch =
                !query || searchableText.includes(query);

            const matchesDocument =
                documentFilter === 'All Documents' ||
                String(movement.operation || '')
                    .replaceAll('_', ' ')
                    .toLowerCase() ===
                    documentFilter.toLowerCase();

            const matchesStatus =
                statusFilter === 'All Statuses' ||
                String(movement.status || '').toLowerCase() ===
                    statusFilter.toLowerCase();

            return (
                matchesSearch &&
                matchesDocument &&
                matchesStatus
            );
        });
    }, [movements, search, documentFilter, statusFilter]);

    /* ---------------------------------------------------------------------- */
    /* MOVEMENT TABLE                                                          */
    /* ---------------------------------------------------------------------- */

    const movementColumns = [
        {
            header: 'REFERENCE',
            accessor: 'reference',
            render: (row) => (
                <span className="font-semibold text-blue-600">
                    {row.reference || row.id || '—'}
                </span>
            ),
        },
        {
            header: 'PRODUCT',
            accessor: 'product_name',
            render: (row) => (
                <div>
                    <p className="font-medium text-slate-800">
                        {row.product_name ||
                            row.product ||
                            'Unknown product'}
                    </p>

                    <p className="text-[10px] text-slate-400">
                        {row.sku || 'No SKU'}
                    </p>
                </div>
            ),
        },
        {
            header: 'OPERATION',
            accessor: 'operation',
            render: (row) => (
                <Badge status={row.operation || 'MOVEMENT'}>
                    {String(row.operation || 'Movement').replaceAll(
                        '_',
                        ' '
                    )}
                </Badge>
            ),
        },
        {
            header: 'QUANTITY',
            accessor: 'quantity',
            render: (row) => {
                const quantity = Number(row.quantity) || 0;

                return (
                    <span
                        className={
                            quantity < 0
                                ? 'font-semibold text-red-600'
                                : 'font-semibold text-emerald-600'
                        }
                    >
                        {quantity > 0 ? '+' : ''}
                        {formatNumber(quantity)} {row.uom || ''}
                    </span>
                );
            },
        },
        {
            header: 'STATUS',
            accessor: 'status',
            render: (row) => (
                <Badge status={row.status || 'DONE'}>
                    {String(row.status || 'DONE').replaceAll(
                        '_',
                        ' '
                    )}
                </Badge>
            ),
        },
    ];

    /* ---------------------------------------------------------------------- */
    /* INTELLIGENCE                                                            */
    /* ---------------------------------------------------------------------- */

    const firstAnomaly = anomalies[0];
    const firstForecast = forecasts[0];
    const firstLocation = locations[0];

    const anomalyProduct = getValue(
        firstAnomaly,
        ['product_name', 'product', 'name'],
        'No anomaly detected'
    );

    const anomalyQuantity = getValue(
        firstAnomaly,
        ['quantity', 'movement_quantity', 'current_movement'],
        ''
    );

    const forecastProduct = getValue(
        firstForecast,
        ['product_name', 'product', 'name'],
        'Inventory'
    );

    const forecastDays = getValue(
        firstForecast,
        ['days_remaining', 'days_to_depletion', 'depletion_days'],
        null
    );

    const locationName = getValue(
        firstLocation,
        ['location_name', 'warehouse', 'name'],
        'Warehouse'
    );

    /* ---------------------------------------------------------------------- */
    /* RENDER                                                                  */
    /* ---------------------------------------------------------------------- */

    return (
        <div className="space-y-5 pb-8">

            {/* PAGE TITLE - NO HEADER / NO SIDEBAR HERE */}

            <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="text-[10px] font-medium text-slate-400">
                        Home <span className="mx-1">/</span> Dashboard
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        Inventory Overview
                    </h1>

                    <p className="mt-1 text-xs text-slate-500">
                        Real-time stock management, warehouse performance
                        and inventory intelligence.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={isLoading}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60"
                >
                    <RefreshCw
                        className={`h-3.5 w-3.5 ${
                            isLoading ? 'animate-spin' : ''
                        }`}
                    />

                    {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
            </section>

            {/* ERROR */}

            {errorMessage && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    <span>{errorMessage}</span>

                    <button
                        type="button"
                        onClick={loadDashboard}
                        className="font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* KPI CARDS */}

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {metricCards.map((metric) => (
                    <MetricCard
                        key={metric.title}
                        title={metric.title}
                        value={
                            isLoading && !summary
                                ? '...'
                                : formatNumber(metric.value)
                        }
                        note={metric.note}
                        icon={metric.icon}
                        type={metric.type}
                    />
                ))}
            </section>

            {/* FILTERS */}

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800">
                            Inventory Filters
                        </h2>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                            Filter receipts, deliveries, transfers and
                            adjustments
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setDocumentFilter('All Documents');
                            setStatusFilter('All Statuses');
                        }}
                        className="text-[10px] font-semibold text-slate-500 hover:text-blue-600"
                    >
                        Reset
                    </button>
                </div>

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-[9px] font-semibold text-slate-500">
                            Document Type
                        </label>

                        <select
                            value={documentFilter}
                            onChange={(event) =>
                                setDocumentFilter(event.target.value)
                            }
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-400"
                        >
                            <option>All Documents</option>
                            <option>Receipt</option>
                            <option>Delivery</option>
                            <option>Internal Transfer</option>
                            <option>Adjustment</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-[9px] font-semibold text-slate-500">
                            Status
                        </label>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-400"
                        >
                            <option>All Statuses</option>
                            <option>Draft</option>
                            <option>Waiting</option>
                            <option>Ready</option>
                            <option>Done</option>
                            <option>Canceled</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-[9px] font-semibold text-slate-500">
                            Search
                        </label>

                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Product, SKU, reference..."
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400"
                        />
                    </div>

                    <div className="flex items-end">
                        <Link
                            to="/inventory/stock"
                            className="flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                            View Current Stock
                        </Link>
                    </div>
                </div>
            </section>

            {/* ANALYTICS */}

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_1fr]">

                {/* CATEGORY */}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-800">
                            Stock Level by Category
                        </h2>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                            Current inventory distribution
                        </p>
                    </div>

                    <div className="space-y-5 p-4">
                        {[
                            ['Electronics', 88],
                            ['Computers', 76],
                            ['Accessories', 61],
                            ['Office Supplies', 36],
                        ].map(([name, percentage]) => (
                            <div key={name}>
                                <div className="mb-1.5 flex justify-between text-[11px]">
                                    <span className="text-slate-600">
                                        {name}
                                    </span>

                                    <strong className="text-slate-800">
                                        {percentage}%
                                    </strong>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{
                                            width: `${percentage}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* HEALTH */}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-800">
                            Inventory Health
                        </h2>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                            Stock availability status
                        </p>
                    </div>

                    <div className="flex items-center gap-5 p-5">
                        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#2563eb_0deg_327deg,#f59e0b_327deg_340deg,#e2e8f0_340deg_360deg)]">
                            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
                                <strong className="text-xl text-slate-900">
                                    {metrics.totalProducts
                                        ? Math.max(
                                            0,
                                            Math.round(
                                                ((Number(metrics.totalProducts) -
                                                    Number(metrics.lowStockItems) -
                                                    Number(metrics.outOfStockItems)) /
                                                    Number(metrics.totalProducts)) *
                                                    100
                                            )
                                        )
                                        : 0}
                                    %
                                </strong>

                                <span className="text-[8px] text-slate-400">
                                    Healthy
                                </span>
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            <div className="flex justify-between text-[10px]">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <i className="h-2 w-2 rounded-full bg-blue-600" />
                                    Healthy
                                </span>

                                <strong>
                                    {formatNumber(
                                        Math.max(
                                            0,
                                            Number(metrics.totalProducts) -
                                                Number(metrics.lowStockItems) -
                                                Number(metrics.outOfStockItems)
                                        )
                                    )}
                                </strong>
                            </div>

                            <div className="flex justify-between text-[10px]">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <i className="h-2 w-2 rounded-full bg-amber-500" />
                                    Low Stock
                                </span>

                                <strong>
                                    {formatNumber(metrics.lowStockItems)}
                                </strong>
                            </div>

                            <div className="flex justify-between text-[10px]">
                                <span className="flex items-center gap-2 text-slate-500">
                                    <i className="h-2 w-2 rounded-full bg-red-500" />
                                    Out of Stock
                                </span>

                                <strong>
                                    {formatNumber(metrics.outOfStockItems)}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WAREHOUSE */}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3">
                        <h2 className="text-sm font-semibold text-slate-800">
                            Stock by Warehouse
                        </h2>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                            Inventory distribution by location
                        </p>
                    </div>

                    <div className="divide-y divide-slate-100 px-4">
                        {locations.length > 0 ? (
                            locations.slice(0, 4).map((location, index) => (
                                <div
                                    key={location.id || index}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                            <Warehouse className="h-4 w-4" />
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-700">
                                                {getValue(
                                                    location,
                                                    [
                                                        'location_name',
                                                        'warehouse',
                                                        'name',
                                                    ],
                                                    'Warehouse'
                                                )}
                                            </p>

                                            <p className="text-[9px] text-slate-400">
                                                Inventory location
                                            </p>
                                        </div>
                                    </div>

                                    <strong className="text-xs text-slate-800">
                                        {formatNumber(
                                            getValue(
                                                location,
                                                [
                                                    'quantity',
                                                    'stock',
                                                    'current_stock',
                                                ],
                                                0
                                            )
                                        )}
                                    </strong>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <Building2 className="mx-auto h-6 w-6 text-slate-300" />

                                <p className="mt-2 text-[10px] text-slate-400">
                                    Warehouse data unavailable
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* STOCK INTELLIGENCE */}

            <section
                id="ai-insights"
                className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4 text-blue-600" />

                            <h2 className="text-sm font-semibold text-slate-800">
                                Stock Intelligence
                            </h2>
                        </div>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                            AI-powered inventory insights
                        </p>
                    </div>

                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] font-bold text-blue-600">
                        ✦ AI ASSISTED
                    </span>
                </div>

                <div className="grid gap-3 p-4 lg:grid-cols-2 xl:grid-cols-4">
                    <InsightCard
                        icon={Zap}
                        type="red"
                        title="Unusual Movement"
                        heading={
                            anomalies.length
                                ? `${anomalyProduct} has unusual movement`
                                : 'No unusual movement detected'
                        }
                        description={
                            anomalies.length
                                ? `${anomalyQuantity || 'Unusual'} movement detected above the normal inventory pattern.`
                                : 'The system has not reported an inventory anomaly.'
                        }
                        action="Explain movement"
                    />

                    <InsightCard
                        icon={Activity}
                        type="blue"
                        title="Depletion Forecast"
                        heading={
                            forecasts.length && forecastDays
                                ? `${forecastProduct} may deplete in ${forecastDays} days`
                                : 'No depletion forecast available'
                        }
                        description={
                            forecasts.length
                                ? 'Forecast based on current stock and historical usage.'
                                : 'Forecast information will appear when inventory history is available.'
                        }
                        action="View forecast"
                    />

                    <InsightCard
                        icon={Warehouse}
                        type="amber"
                        title="Location Imbalance"
                        heading={
                            locations.length
                                ? `${locationName} needs attention`
                                : 'No location imbalance detected'
                        }
                        description={
                            locations.length
                                ? 'Inventory distribution indicates a possible warehouse imbalance.'
                                : 'Location intelligence has not reported an imbalance.'
                        }
                        action="View locations"
                    />

                    <InsightCard
                        icon={Truck}
                        type="violet"
                        title="Smart Transfer"
                        heading="Reduce shortage risk"
                        description="Use location intelligence to identify stock that can be redistributed before a shortage occurs."
                        action="View recommendation"
                    />
                </div>
            </section>

            {/* MOVEMENTS + ALERTS */}

            <section className="grid gap-4 2xl:grid-cols-[1.7fr_0.8fr]">

                {/* MOVEMENTS */}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">
                                Recent Stock Movements
                            </h2>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                                {filteredMovements.length} operation
                                {filteredMovements.length !== 1
                                    ? 's'
                                    : ''}{' '}
                                shown
                            </p>
                        </div>

                        <Link
                            to="/inventory/movements"
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                            View all →
                        </Link>
                    </div>

                    <DataTable
                        columns={movementColumns}
                        data={filteredMovements}
                        loading={isLoading}
                        searchPlaceholder="Search movements..."
                        emptyTitle={
                            errorMessage
                                ? 'Movement history unavailable'
                                : 'No stock movements yet'
                        }
                        emptyDescription={
                            errorMessage
                                ? 'Retry the dashboard request.'
                                : 'Receipts, deliveries and adjustments will appear here.'
                        }
                    />
                </div>

                {/* ALERTS */}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">
                                Low Stock Alerts
                            </h2>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                                Products requiring attention
                            </p>
                        </div>

                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-50 px-2 text-[9px] font-bold text-red-600">
                            {alerts.length}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 px-4">
                        {isLoading ? (
                            <div className="py-10 text-center text-xs text-slate-400">
                                Loading alerts...
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Bell className="mb-2 h-5 w-5 text-slate-300" />

                                <p className="text-xs font-medium text-slate-600">
                                    No open alerts
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    New inventory alerts will appear here.
                                </p>
                            </div>
                        ) : (
                            alerts.slice(0, 5).map((alert, index) => (
                                <div
                                    key={alert.id || index}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[11px] font-semibold text-slate-700">
                                            {alert.product_name ||
                                                alert.product ||
                                                alert.alert_type ||
                                                'Inventory Alert'}
                                        </p>

                                        <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-400">
                                            {alert.message ||
                                                'This product requires inventory attention.'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        to="/inventory/stock"
                        className="mx-4 mb-4 mt-2 flex h-8 items-center justify-center rounded-lg border border-slate-200 text-[10px] font-semibold text-blue-600 hover:bg-blue-50"
                    >
                        View all alerts →
                    </Link>
                </div>
            </section>

            {/* FOOTER */}

            <footer className="flex flex-col justify-between gap-2 px-1 pt-2 text-[9px] text-slate-400 sm:flex-row">
                <span>StockSense Inventory Management</span>

                <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Dashboard
                </span>
            </footer>
        </div>
    );
}

export default Dashboard;