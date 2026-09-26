import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/button';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastContext';
import { ArrowDownLeft, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/authApi';

export function ReceiptsPage() {
  const { showToast } = useToast();
  const isAdmin = authApi.getCurrentUser()?.role === 'admin';
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    warehouse_id: authApi.getCurrentUser()?.warehouseId || 'WH-01',
    location_id: 'LOC-MAIN-01',
    notes: '',
    reference: '',
    assigned_user_id: '',
    items: [{ product_id: '', quantity: 10, unit: 'kg', unit_price: 100 }],
  });

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const [recData, prodData] = await Promise.all([
        inventoryApi.getReceipts(),
        inventoryApi.getProducts(),
      ]);
      setReceipts(recData);
      setProducts(prodData);
      if (isAdmin) {
        setStaffUsers((await authApi.getUsers()).filter((account) => account.role === 'staff' && account.isActive));
      }
    } catch (err) {
      showToast('Failed to load receipts: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    if (!formData.supplier.trim() || formData.items.some((i) => !i.product_id || i.quantity <= 0)) {
      showToast('Supplier and valid items with positive quantities are required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inventoryApi.createReceipt({
        ...formData,
        assigned_user_id: formData.assigned_user_id ? Number(formData.assigned_user_id) : null,
      });
      showToast(`Draft Receipt ${res.receiptNumber} created! (Stock un-changed until validated)`, 'info');
      setIsModalOpen(false);
      fetchReceipts();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateReceipt = async (id, number) => {
    try {
      await inventoryApi.validateReceipt(id);
      showToast(`Receipt ${number} validated! Inventory increased & ledger written.`, 'success');
      fetchReceipts();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 10, unit: 'units', unit_price: 0 }],
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
      header: 'Receipt No / Reference',
      accessor: 'receipt_number',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-100 font-mono text-sm">{row.receipt_number}</p>
          <p className="text-xs text-slate-400">Ref: {row.reference || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      render: (row) => <span className="font-medium text-slate-200">{row.supplier}</span>,
    },
    {
      header: 'Destination Location',
      accessor: 'location_id',
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.location_id} <span className="text-slate-500">({row.warehouse_id})</span>
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
                await inventoryApi.updateReceiptStatus(row.id, 'READY');
                await fetchReceipts();
              } catch (err) {
                showToast(err.response?.data?.error || err.message, 'error');
              }
            }}>
              Mark ready
            </Button>
          )}
          {(isAdmin || ['READY', 'WAITING'].includes(row.status)) && ['DRAFT', 'WAITING', 'READY'].includes(row.status) ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleValidateReceipt(row.id, row.receipt_number)}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Validate & Receive
            </Button>
          ) : (
            <span className={`text-xs font-medium ${row.status === 'CANCELED' ? 'text-slate-500' : 'text-emerald-400'}`}>
              {row.status === 'CANCELED' ? 'Canceled' : row.status === 'DONE' ? 'Stock updated' : row.status}
            </span>
          )}
          {isAdmin && ['DRAFT', 'WAITING', 'READY'].includes(row.status) && (
            <Button variant="danger" size="sm" onClick={async () => {
              if (!window.confirm(`Cancel receipt ${row.receipt_number}?`)) return;
              try {
                await inventoryApi.updateReceiptStatus(row.id, 'CANCELED');
                await fetchReceipts();
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
            <ArrowDownLeft className="w-6 h-6 text-emerald-400" /> Stock Receipts (Goods Inward)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Incoming vendor receipts. Stock increases only upon validation.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
          {isAdmin ? 'Create Receipt' : 'Create Limited Receipt'}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={receipts}
        loading={loading}
        searchPlaceholder="Search by receipt number, supplier..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Incoming Stock Receipt"
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReceipt} isLoading={isSubmitting}>
              Create Draft Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateReceipt} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Name *</label>
              <input
                type="text"
                required
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g. TATA Steel India Ltd"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Receipt Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Destination Location</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="LOC-MAIN-01">LOC-MAIN-01 (Main Warehouse Store)</option>
                <option value="LOC-RACK-B2">LOC-RACK-B2 (Production Rack B2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">PO Reference Number</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="e.g. PO-9821"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            {isAdmin && <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Warehouse ID</label>
                <input required value={formData.warehouse_id} onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assign to staff</label>
                <select value={formData.assigned_user_id} onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none">
                  <option value="">No assignment</option>
                  {staffUsers.filter((account) => account.warehouseId === formData.warehouse_id).map((account) => <option key={account.id} value={account.id}>{account.name} · {account.email}</option>)}
                </select>
              </div>
            </>}
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Line Items</h4>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                + Add Item Line
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
                          {p.name} ({p.sku})
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

export default ReceiptsPage;
