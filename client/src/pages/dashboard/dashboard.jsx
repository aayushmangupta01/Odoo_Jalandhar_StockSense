import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    Bell,
    Boxes,
    PackagePlus,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Card, StatCard } from '../../components/common/Card';
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
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function Dashboard() {
    const { showToast } = useToast();
    const [summary, setSummary] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [movements, setMovements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [summaryData, lowStockData, alertData, movementData] = await Promise.all([
                inventoryApi.getSummary(),
                inventoryApi.getLowStock(),
                inventoryApi.getAlerts(),
                inventoryApi.getMovements(),
            ]);

            setSummary(summaryData);
            setLowStock(Array.isArray(lowStockData) ? lowStockData : []);
            setAlerts(Array.isArray(alertData) ? alertData : []);
            setMovements(Array.isArray(movementData) ? movementData.slice(0, 6) : []);
        } catch (error) {
            const message = error.response?.data?.error || error.message || 'Unable to load inventory data.';
            setErrorMessage(message);
            showToast(`Dashboard data could not be loaded: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const metrics = summary || emptySummary;
    const metricCards = [
        { title: 'Active products', value: metrics.totalProducts, color: 'cyan', icon: Boxes },
        { title: 'Stock quantity', value: metrics.totalStock, color: 'emerald', icon: PackagePlus, subtext: 'Combined units across UOMs' },
        { title: 'Low stock', value: metrics.lowStockItems, color: 'amber', icon: AlertTriangle },
        { title: 'Out of stock', value: metrics.outOfStockItems, color: 'rose', icon: ShieldAlert },
        { title: 'Pending receipts', value: metrics.pendingReceipts, color: 'indigo', icon: ArrowDownLeft },
        { title: 'Pending deliveries', value: metrics.pendingDeliveries, color: 'violet', icon: ArrowUpRight },
    ];

    const movementColumns = [
        {
            header: 'Movement',
            accessor: 'operation',
            render: (row) => <Badge status={row.operation}>{row.operation?.replaceAll('_', ' ') || 'Movement'}</Badge>,
        },
        {
            header: 'Product',
            accessor: 'product_name',
            render: (row) => (
                <div>
                    <p className="font-medium text-slate-100">{row.product_name || 'Unknown product'}</p>
                    <p className="text-xs text-slate-500">{row.sku || 'No SKU'}</p>
                </div>
            ),
        },
        {
            header: 'Quantity',
            accessor: 'quantity',
            render: (row) => <span>{formatNumber(row.quantity)} {row.uom || ''}</span>,
        },
        { header: 'When', accessor: 'movement_timestamp', render: (row) => formatDate(row.movement_timestamp) },
    ];

    return (
        <div className="space-y-6 pb-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">StockSense / Overview</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Inventory dashboard</h1>
                    <p className="mt-2 text-sm text-slate-400">A live view of stock health, incoming goods, and outbound activity.</p>
                </div>
                <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={isLoading}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-200 transition hover:border-cyan-500/50 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing' : 'Refresh data'}
                </button>
            </header>

            {errorMessage && (
                <div className="flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between" role="alert">
                    <span>Live inventory data is unavailable: {errorMessage}</span>
                    <button type="button" onClick={loadDashboard} className="font-semibold text-rose-200 underline underline-offset-4">Retry</button>
                </div>
            )}

            <section aria-label="Inventory summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {metricCards.map((metric) => (
                    <StatCard
                        key={metric.title}
                        title={metric.title}
                        value={isLoading && !summary ? '...' : formatNumber(metric.value)}
                        subtext={metric.subtext}
                        color={metric.color}
                        icon={metric.icon}
                    />
                ))}
            </section>

            {!isLoading && !errorMessage && metrics.totalProducts === 0 && (
                <Card className="border-cyan-500/20 bg-cyan-500/[0.04]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
                                <PackagePlus className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-100">Your inventory is ready to set up</h2>
                                <p className="mt-1 text-sm text-slate-400">The database is connected, but it has no products yet. Add a product to start tracking stock.</p>
                            </div>
                        </div>
                        <Link to="/inventory/products" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                            <PackagePlus className="h-4 w-4" /> Add first product
                        </Link>
                    </div>
                </Card>
            )}

            <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)]">
                <div className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-100">Reorder attention</h2>
                            <p className="mt-1 text-xs text-slate-400">Products at or below their reorder level.</p>
                        </div>
                        <Link to="/inventory/stock" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">View stock</Link>
                    </div>
                    <DataTable
                        columns={[
                            { header: 'Product', accessor: 'name', render: (row) => <div><p className="font-medium text-slate-100">{row.name}</p><p className="text-xs text-slate-500">{row.sku}</p></div> },
                            { header: 'On hand', accessor: 'current_stock', render: (row) => `${formatNumber(row.current_stock)} ${row.uom || ''}` },
                            { header: 'Reorder at', accessor: 'reorder_level', render: (row) => `${formatNumber(row.reorder_level)} ${row.uom || ''}` },
                            { header: 'Status', accessor: 'current_stock', render: (row) => <Badge status={Number(row.current_stock) === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'} /> },
                        ]}
                        data={lowStock}
                        loading={isLoading}
                        searchPlaceholder="Search low-stock products..."
                        emptyTitle={errorMessage ? 'Stock data unavailable' : 'No reorder risks'}
                        emptyDescription={errorMessage ? 'Retry the dashboard request to reconnect to inventory.' : 'Products at or below their reorder level will appear here.'}
                    />
                </div>

                <div className="space-y-5">
                    <Card title="Open alerts" subtitle="Unresolved inventory notices" className="min-h-52">
                        {isLoading ? (
                            <p className="animate-pulse py-8 text-center text-sm text-slate-500">Loading alerts...</p>
                        ) : alerts.length === 0 ? (
                            <div className="flex min-h-28 flex-col items-center justify-center text-center">
                                <Bell className="mb-2 h-5 w-5 text-slate-500" />
                                <p className="text-sm font-medium text-slate-300">No open alerts</p>
                                <p className="mt-1 text-xs text-slate-500">New stock alerts will appear here.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-800">
                                {alerts.slice(0, 5).map((alert) => (
                                    <li className="flex gap-3 py-3 first:pt-0 last:pb-0" key={alert.id}>
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-200">{alert.product_name || alert.alert_type}</p>
                                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{alert.message}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card title="Quick links" subtitle="Common inventory tasks">
                        <div className="grid grid-cols-2 gap-2">
                            <Link to="/inventory/receipts" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs font-medium text-slate-300 transition hover:border-emerald-500/40 hover:text-emerald-300">
                                <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> Receive stock
                            </Link>
                            <Link to="/inventory/deliveries" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs font-medium text-slate-300 transition hover:border-amber-500/40 hover:text-amber-300">
                                <ArrowUpRight className="h-4 w-4 text-amber-400" /> Create delivery
                            </Link>
                            <Link to="/inventory/movements" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs font-medium text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300">
                                <Activity className="h-4 w-4 text-cyan-400" /> Movement history
                            </Link>
                            <Link to="/inventory/analytics" className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs font-medium text-slate-300 transition hover:border-indigo-500/40 hover:text-indigo-300">
                                <Boxes className="h-4 w-4 text-indigo-400" /> Analytics
                            </Link>
                        </div>
                    </Card>
                </div>
            </section>

            <section className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold text-slate-100">Recent stock movements</h2>
                    <p className="mt-1 text-xs text-slate-400">Latest changes recorded in the inventory ledger.</p>
                </div>
                <DataTable
                    columns={movementColumns}
                    data={movements}
                    loading={isLoading}
                    searchPlaceholder="Search recent movements..."
                    emptyTitle={errorMessage ? 'Movement history unavailable' : 'No stock movements yet'}
                    emptyDescription={errorMessage ? 'Retry the dashboard request to reconnect to inventory.' : 'Receipts, deliveries, and adjustments will show here after they are recorded.'}
                />
            </section>

            {summary && (
                <p className="flex items-center gap-2 text-xs text-slate-500" role="status">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Connected to the inventory database
                </p>
            )}
        </div>
    );
}

export default Dashboard;