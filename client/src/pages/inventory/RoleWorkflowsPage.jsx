import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, ClipboardCheck, RefreshCw, ScrollText } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { authApi } from '../../services/authApi';

const panelClass = 'rounded-xl border border-slate-800 bg-slate-900';
const inputClass = 'h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500';

function PageShell({ title, description, icon: Icon, children, onRefresh, loading }) {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100"><Icon className="h-6 w-6 text-cyan-400" />{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        {onRefresh && <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button>}
      </header>
      {children}
    </div>
  );
}

function ErrorNotice({ message }) {
  return message ? <div role="alert" className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{message}</div> : null;
}

export function AdjustmentRequestsPage() {
  const user = authApi.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [physicalQuantity, setPhysicalQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const list = await inventoryApi.getAdjustmentRequests();
      setRows(list);
      if (!isAdmin) {
        const [productList, stockList] = await Promise.all([inventoryApi.getProducts(), inventoryApi.getStock()]);
        setProducts(productList);
        setStock(stockList);
      }
    } catch (loadError) {
      setError(loadError.response?.data?.error || loadError.message || 'Unable to load adjustment requests.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const productLocations = stock.filter((entry) => String(entry.product_id) === productId);
  const selectedStock = productLocations.find((entry) => entry.location_id === locationId);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      await inventoryApi.createAdjustmentRequest({
        product_id: Number(productId),
        location_id: locationId,
        warehouse_id: user.warehouseId,
        physical_quantity: Number(physicalQuantity),
        reason,
      });
      setNotice('Adjustment request sent for administrator review.');
      setPhysicalQuantity('');
      setReason('');
      await load();
    } catch (submitError) {
      setError(submitError.response?.data?.error || submitError.message || 'Unable to submit adjustment request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function review(id, decision) {
    const action = decision === 'approve' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${action} this stock adjustment?`)) return;
    setError('');
    try {
      if (decision === 'approve') await inventoryApi.approveAdjustmentRequest(id);
      else await inventoryApi.rejectAdjustmentRequest(id);
      await load();
    } catch (reviewError) {
      setError(reviewError.response?.data?.error || reviewError.message || 'Unable to review adjustment request.');
    }
  }

  return (
    <PageShell
      title={isAdmin ? 'Adjustment Approvals' : 'Adjustment Requests'}
      description={isAdmin ? 'Review staff physical-count discrepancies before inventory is changed.' : 'Submit physical counts for approval. Your request does not change stock until an administrator approves it.'}
      icon={ClipboardCheck}
      onRefresh={load}
      loading={loading}
    >
      <ErrorNotice message={error} />
      {notice && <div role="status" className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
      {!isAdmin && (
        <form onSubmit={submit} className={`${panelClass} grid gap-3 p-4 md:grid-cols-2`}>
          <div className="md:col-span-2">
            <h2 className="text-sm font-semibold text-slate-100">Request a stock correction</h2>
            <p className="mt-1 text-xs text-slate-400">Select the physical count and explain the discrepancy.</p>
          </div>
          <label className="space-y-1 text-xs text-slate-400">Product
            <select className={inputClass} required value={productId} onChange={(event) => { setProductId(event.target.value); setLocationId(''); }}>
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-400">Stock location
            <select className={inputClass} required value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="">Select location</option>
              {productLocations.map((entry) => <option key={entry.id} value={entry.location_id}>{entry.location_id} · System {entry.quantity} {entry.uom}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-400">Physical quantity
            <input className={inputClass} type="number" min="0" step="any" required value={physicalQuantity} onChange={(event) => setPhysicalQuantity(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-slate-400">Reason
            <input className={inputClass} required minLength={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Describe the physical count discrepancy" />
          </label>
          {selectedStock && <p className="text-xs text-slate-300 md:col-span-2">System quantity: <strong>{selectedStock.quantity} {selectedStock.uom}</strong></p>}
          <button disabled={submitting} className="h-10 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60 md:col-span-2">{submitting ? 'Submitting…' : 'Submit for approval'}</button>
        </form>
      )}

      <section className={panelClass}>
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">{loading ? 'Loading requests…' : `${rows.length} adjustment request${rows.length === 1 ? '' : 's'}`}</h2>
        </div>
        {!loading && rows.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-400">No adjustment requests to show.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-slate-500"><tr>{['Product / SKU', 'Warehouse / Location', 'System → Physical', 'Variance', isAdmin ? 'Requested by' : 'Reason', 'Status', ...(isAdmin ? ['Review'] : [])].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {rows.map((row) => <tr key={row.id}>
                  <td className="px-4 py-3"><strong className="text-slate-100">{row.product_name}</strong><p className="mt-1 text-slate-500">{row.sku}</p></td>
                  <td className="px-4 py-3">{row.warehouse_id}<p className="mt-1 text-slate-500">{row.location_id}</p></td>
                  <td className="px-4 py-3">{row.system_quantity} → {row.physical_quantity} {row.uom}</td>
                  <td className={row.variance < 0 ? 'px-4 py-3 text-rose-300' : 'px-4 py-3 text-emerald-300'}>{row.variance > 0 ? '+' : ''}{row.variance}</td>
                  <td className="max-w-56 px-4 py-3">{isAdmin ? row.requested_by_name : row.reason}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  {isAdmin && <td className="px-4 py-3">{row.status === 'PENDING' ? <div className="flex gap-2"><button type="button" onClick={() => review(row.id, 'approve')} className="font-semibold text-emerald-300 hover:text-emerald-200">Approve</button><button type="button" onClick={() => review(row.id, 'reject')} className="font-semibold text-rose-300 hover:text-rose-200">Reject</button></div> : row.review_note || '—'}</td>}
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}

export function StockAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError('');
    try { setAlerts(await inventoryApi.getAlerts()); }
    catch (loadError) { setError(loadError.response?.data?.error || loadError.message || 'Unable to load alerts.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  return (
    <PageShell title="Warehouse Alerts" description="Open low-stock and out-of-stock alerts in your assigned warehouse." icon={AlertTriangle} onRefresh={load} loading={loading}>
      <ErrorNotice message={error} />
      <div className={panelClass}>
        {loading ? <p className="px-4 py-10 text-center text-sm text-slate-400">Loading alerts…</p> : alerts.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-400">No active alerts for this warehouse.</p> : alerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3 border-b border-slate-800 p-4 last:border-b-0">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div><p className="text-sm font-semibold text-slate-100">{alert.product_name} <span className="text-xs font-normal text-slate-500">{alert.sku}</span></p><p className="mt-1 text-sm text-slate-300">{alert.message}</p><p className="mt-2 text-[10px] text-slate-500">{alert.alert_type} · {alert.created_at}</p></div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function MyActivityPage() {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError('');
    try { setActivities(await inventoryApi.getMyActivity()); }
    catch (loadError) { setError(loadError.response?.data?.error || loadError.message || 'Unable to load your activity.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  return (
    <PageShell title="My Activity" description="Actions recorded for your signed-in account." icon={ScrollText} onRefresh={load} loading={loading}>
      <ErrorNotice message={error} />
      <div className={panelClass}>
        {loading ? <p className="px-4 py-10 text-center text-sm text-slate-400">Loading activity…</p> : activities.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-400">No actions have been recorded for your account yet.</p> : (
          <div className="divide-y divide-slate-800">
            {activities.map((activity, index) => <div key={`${activity.created_at}-${index}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><p className="text-sm font-semibold text-slate-200">{activity.action}</p><p className="mt-1 text-xs text-slate-500">{activity.entity}{activity.entity_id ? ` · ${activity.entity_id}` : ''}{activity.location_id ? ` · ${activity.location_id}` : ''}{activity.warehouse_id ? ` · ${activity.warehouse_id}` : ''}</p></div>
              <time className="text-[10px] text-slate-500">{activity.created_at}</time>
            </div>)}
          </div>
        )}
      </div>
    </PageShell>
  );
}

export function InternalTransfersPage() {
  const user = authApi.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [transfers, setTransfers] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sourceLocation, setSourceLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [sourceWarehouse, setSourceWarehouse] = useState('WH-01');
  const [destinationWarehouse, setDestinationWarehouse] = useState('WH-01');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [products, setProducts] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError('');
    try {
      const [transferList, productList] = await Promise.all([inventoryApi.getTransfers(), inventoryApi.getProducts()]);
      setTransfers(transferList);
      setProducts(productList);
      if (isAdmin) {
        setStaffUsers((await authApi.getUsers()).filter((account) => account.role === 'staff' && account.isActive));
      }
    } catch (loadError) { setError(loadError.response?.data?.error || loadError.message || 'Unable to load transfers.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function create(event) {
    event.preventDefault();
    setError('');
    try {
      await inventoryApi.createTransfer({
        source_location_id: sourceLocation,
        destination_location_id: destinationLocation,
        source_warehouse_id: sourceWarehouse,
        destination_warehouse_id: destinationWarehouse,
        assigned_user_id: assignedUserId ? Number(assignedUserId) : null,
        items: [{ product_id: Number(productId), quantity: Number(quantity) }],
      });
      setProductId(''); setQuantity('');
      await load();
    } catch (submitError) { setError(submitError.response?.data?.error || submitError.message || 'Unable to create transfer.'); }
  }
  async function update(id, action) {
    setError('');
    try {
      if (action === 'approve' && !window.confirm('Approve this internal transfer?')) return;
      if (action === 'process' && !window.confirm('Confirm that the assigned transfer has been completed?')) return;
      if (action === 'approve') await inventoryApi.approveTransfer(id);
      else await inventoryApi.processTransfer(id);
      await load();
    } catch (actionError) { setError(actionError.response?.data?.error || actionError.message || 'Unable to update transfer.'); }
  }
  return (
    <PageShell title={isAdmin ? 'Internal Transfers' : 'My Assigned Transfers'} description={isAdmin ? 'Create warehouse transfers, approve them, and follow their completion.' : 'Process transfers assigned to your warehouse account after approval.'} icon={ArrowRightLeft} onRefresh={load} loading={loading}>
      <ErrorNotice message={error} />
      {isAdmin && <form onSubmit={create} className={`${panelClass} grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4`}>
        <label className="space-y-1 text-xs text-slate-400">Product<select required value={productId} onChange={(event) => setProductId(event.target.value)} className={inputClass}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></label>
        <label className="space-y-1 text-xs text-slate-400">Quantity<input required type="number" min="0.01" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} className={inputClass} /></label>
        <label className="space-y-1 text-xs text-slate-400">Source location<input required value={sourceLocation} onChange={(event) => setSourceLocation(event.target.value)} placeholder="LOC-MAIN-01" className={inputClass} /></label>
        <label className="space-y-1 text-xs text-slate-400">Destination location<input required value={destinationLocation} onChange={(event) => setDestinationLocation(event.target.value)} placeholder="LOC-RACK-B2" className={inputClass} /></label>
        <label className="space-y-1 text-xs text-slate-400">Source warehouse<input required value={sourceWarehouse} onChange={(event) => setSourceWarehouse(event.target.value)} className={inputClass} /></label>
        <label className="space-y-1 text-xs text-slate-400">Destination warehouse<input required value={destinationWarehouse} onChange={(event) => setDestinationWarehouse(event.target.value)} className={inputClass} /></label>
        <label className="space-y-1 text-xs text-slate-400">Assign to staff user<select value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)} className={inputClass}><option value="">Unassigned</option>{staffUsers.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.warehouseId}</option>)}</select></label>
        <button className="self-end rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500">Create transfer for approval</button>
      </form>}
      <div className={panelClass}>
        {loading ? <p className="px-4 py-10 text-center text-sm text-slate-400">Loading transfers…</p> : transfers.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-400">No transfers are assigned or recorded.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-slate-500"><tr>{['Transfer', 'Route', 'Assigned to', 'Status', 'Action'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-800 text-slate-300">{transfers.map((transfer) => <tr key={transfer.id}><td className="px-4 py-3 font-mono text-slate-100">{transfer.transfer_number}<p className="mt-1 font-sans text-slate-500">{transfer.item_count} item(s)</p></td><td className="px-4 py-3">{transfer.source_warehouse_id} · {transfer.source_location_id}<p className="mt-1 text-slate-500">→ {transfer.destination_warehouse_id} · {transfer.destination_location_id}</p></td><td className="px-4 py-3">{transfer.assigned_to_name || 'Unassigned'}</td><td className="px-4 py-3">{transfer.status}</td><td className="px-4 py-3">{isAdmin && transfer.status === 'WAITING' ? <button type="button" onClick={() => update(transfer.id, 'approve')} className="font-semibold text-emerald-300">Approve</button> : transfer.status === 'READY' ? <button type="button" onClick={() => update(transfer.id, 'process')} className="font-semibold text-cyan-300">Mark processed</button> : '—'}</td></tr>)}</tbody></table></div>}
      </div>
    </PageShell>
  );
}
