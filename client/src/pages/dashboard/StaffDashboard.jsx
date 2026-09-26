import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { inventoryApi } from '../../services/api';

const initialData = {
  pendingReceipts: 0,
  pendingDeliveries: 0,
  pendingTransfers: 0,
  lowStockAlerts: [],
  todayMovements: [],
};

function StaffDashboard() {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setIsLoading(true);
    setError('');
    try {
      setData(await inventoryApi.getStaffDashboard());
    } catch (loadError) {
      setError(loadError.response?.data?.error || loadError.message || 'Unable to load your warehouse dashboard.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = [
    { label: 'My Pending Receipts', value: data.pendingReceipts, icon: ArrowDownLeft, path: '/inventory/receipts', color: 'text-blue-600 bg-blue-50' },
    { label: 'My Pending Deliveries', value: data.pendingDeliveries, icon: ArrowUpRight, path: '/inventory/deliveries', color: 'text-violet-600 bg-violet-50' },
    { label: 'My Assigned Transfers', value: data.pendingTransfers, icon: Truck, path: '/inventory/transfers', color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Low Stock Alerts', value: data.lowStockAlerts.length, icon: AlertTriangle, path: '/inventory/alerts', color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Warehouse workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-100">Staff Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Your assigned work, warehouse alerts, and today’s stock activity.</p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          <span>{error}</span>
          <button type="button" onClick={loadDashboard} className="font-semibold underline">Retry</button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, path, color }) => (
          <Link key={label} to={path} className="rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-cyan-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">{isLoading ? '…' : value}</p>
              </div>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100">Important Inventory Alerts</h2>
            </div>
            <Link to="/inventory/alerts" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">View alerts</Link>
          </div>
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Loading alerts…</p>
          ) : data.lowStockAlerts.length ? (
            <div className="divide-y divide-slate-800">
              {data.lowStockAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-200">{alert.product_name} <span className="text-xs text-slate-500">({alert.sku})</span></p>
                  <p className="mt-1 text-xs text-slate-400">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <Boxes className="mx-auto h-5 w-5 text-slate-600" />
              <p className="mt-2 text-sm text-slate-300">No open alerts for your warehouse.</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-100">Today’s Stock Movements</h2>
            </div>
            <Link to="/inventory/my-activity" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">My activity</Link>
          </div>
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Loading activity…</p>
          ) : data.todayMovements.length ? (
            <div className="divide-y divide-slate-800">
              {data.todayMovements.slice(0, 6).map((movement) => (
                <div key={movement.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{movement.product_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{movement.operation} · {movement.reference || 'No reference'}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-slate-300">{movement.quantity} {movement.uom}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <ClipboardCheck className="mx-auto h-5 w-5 text-slate-600" />
              <p className="mt-2 text-sm text-slate-300">No stock movements recorded today.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default StaffDashboard;
