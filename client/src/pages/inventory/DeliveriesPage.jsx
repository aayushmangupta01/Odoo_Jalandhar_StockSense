import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/button';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastContext';
import { ArrowUpRight, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';
import { authApi } from '../../services/authApi';

export function DeliveriesPage() {
  const { showToast } = useToast();
  const isAdmin = authApi.getCurrentUser()?.role === 'admin';
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    date: new Date().toISOString().split('T')[0],
    source_warehouse_id: authApi.getCurrentUser()?.warehouseId || 'WH-01',
    source_location_id: 'LOC-MAIN-01',
    reference: '',
    notes: '',
    assigned_user_id: '',
    items: [{ product_id: '', quantity: 10, unit: 'kg' }],
  });

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const [delData, prodData] = await Promise.all([
        inventoryApi.getDeliveries(),
        inventoryApi.getProducts(),
      ]);
      setDeliveries(delData);
      setProducts(prodData);
      if (isAdmin) {
        setStaffUsers((await authApi.getUsers()).filter((account) => account.role === 'staff' && account.isActive));
      }
    } catch (err) {
      showToast('Failed to load deliveries: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    if (!formData.destination.trim() || formData.items.some((i) => !i.product_id || i.quantity <= 0)) {
      showToast('Destination and valid line items are required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inventoryApi.createDelivery({
        ...formData,
        assigned_user_id: formData.assigned_user_id ? Number(formData.assigned_user_id) : null,
      });
      showToast(`Draft Delivery Order ${res.deliveryNumber} created!`, 'info');
      setIsModalOpen(false);
      fetchDeliveries();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateDelivery = async (id, number) => {
    try {
      await inventoryApi.validateDelivery(id);
      showToast(`Delivery Order ${number} processed! Stock decreased & ledger written.`, 'success');
      fetchDeliveries();
    } catch (err) {
      // Handles insufficient stock validation error cleanly
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 5, unit: 'units' }],
    });
  };

  const removeItemRow = (idx) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx),
    });
  };

  const columns = [
    {
      header: 'Delivery No / Ref',
      accessor: 'delivery_number',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-100 font-mono text-sm">{row.delivery_number}</p>
          <p className="text-xs text-slate-400">Ref: {row.reference || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Destination',
      accessor: 'destination',
      render: (row) => <span className="font-medium text-slate-200">{row.destination}</span>,
    },
    {
      header: 'Source Location',
      accessor: 'source_location_id',
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.source_location_id} <span className="text-slate-500">({row.source_warehouse_id})</span>
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => <span className="text-xs text-slate-400 font-mono">{row.date}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      header: 'Actions / Validation',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          {isAdmin && ['DRAFT', 'WAITING'].includes(row.status) && (
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                await inventoryApi.updateDeliveryStatus(row.id, 'READY');
                await fetchDeliveries();
              } catch (err) {
                showToast(err.response?.data?.error || err.message, 'error');
              }
            }}>
              Mark ready
            </Button>
          )}
          {(isAdmin || ['READY', 'WAITING'].includes(row.status)) && ['DRAFT', 'WAITING', 'READY'].includes(row.status) ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleValidateDelivery(row.id, row.delivery_number)}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Validate & Dispatch
            </Button>
          ) : (
            <span className={`text-xs font-medium ${row.status === 'CANCELED' ? 'text-slate-500' : 'text-emerald-400'}`}>
              {row.status === 'CANCELED' ? 'Canceled' : row.status === 'DONE' ? 'Stock deducted' : row.status}
            </span>
          )}
          {isAdmin && ['DRAFT', 'WAITING', 'READY'].includes(row.status) && (
            <Button variant="danger" size="sm" onClick={async () => {
              if (!window.confirm(`Cancel delivery ${row.delivery_number}?`)) return;
              try {
                await inventoryApi.updateDeliveryStatus(row.id, 'CANCELED');
                await fetchDeliveries();
              } catch (err) {
                showToast(err.response?.data?.error || err.message, 'error');
              }
            }}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-rose-400" /> Delivery Orders (Goods Outward)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Outgoing stock dispatch workflows. Stock validation prevents negative stock quantities.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
          {isAdmin ? 'Create Delivery Order' : 'Create Limited Delivery'}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={deliveries}
        loading={loading}
        searchPlaceholder="Search by delivery number, destination..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Outgoing Delivery Order"
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDelivery} isLoading={isSubmitting}>
              Create Delivery Order
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Destination / Customer *</label>
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g. L&T Construction Site Alpha"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dispatch Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Source Location</label>
              <select
                value={formData.source_location_id}
                onChange={(e) => setFormData({ ...formData, source_location_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="LOC-MAIN-01">LOC-MAIN-01 (Main Warehouse Store)</option>
                <option value="LOC-RACK-B2">LOC-RACK-B2 (Production Rack B2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Reference</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="e.g. DO-5510"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            {isAdmin && <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Source Warehouse ID</label>
                <input required value={formData.source_warehouse_id} onChange={(e) => setFormData({ ...formData, source_warehouse_id: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assign to staff</label>
                <select value={formData.assigned_user_id} onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none">
                  <option value="">No assignment</option>
                  {staffUsers.filter((account) => account.warehouseId === formData.source_warehouse_id).map((account) => <option key={account.id} value={account.id}>{account.name} · {account.email}</option>)}
                </select>
              </div>
            </>}
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Items to Dispatch</h4>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                + Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[idx].product_id = Number(e.target.value);
                        const selP = products.find((p) => p.id === Number(e.target.value));
                        if (selP) newItems[idx].unit = selP.uom;
                        setFormData({ ...formData, items: newItems });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Avail: {p.current_stock} {p.uom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[idx].quantity = Number(e.target.value);
                        setFormData({ ...formData, items: newItems });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DeliveriesPage;
