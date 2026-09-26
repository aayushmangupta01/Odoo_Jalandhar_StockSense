import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/button';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastContext';
import { PackagePlus, Plus } from 'lucide-react';

export function OpeningStockPage() {
  const { showToast } = useToast();
  const [openingRecords, setOpeningRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reference: '',
    productId: '',
    locationId: 'LOC-MAIN-01',
    warehouseId: 'WH-01',
    quantity: 100,
    unit: 'kg',
    openingDate: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [opData, prodData] = await Promise.all([
        inventoryApi.getOpeningStock(),
        inventoryApi.getProducts(),
      ]);
      setOpeningRecords(opData);
      setProducts(prodData);
    } catch (err) {
      showToast('Failed to load opening stock records: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.productId || Number(formData.quantity) <= 0 || !formData.reference.trim()) {
      showToast('Reference, product, and positive quantity are required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryApi.createOpeningStock(formData);
      showToast(`Opening Stock ${formData.reference} created!`, 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Reference ID',
      accessor: 'reference',
      render: (row) => <span className="font-mono text-xs font-bold text-cyan-400">{row.reference}</span>,
    },
    {
      header: 'Product / SKU',
      accessor: 'product_name',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-100 text-sm">{row.product_name}</p>
          <p className="text-xs font-mono text-slate-400">{row.sku}</p>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: 'location_id',
      render: (row) => <span className="font-mono text-xs text-slate-300">{row.location_id}</span>,
    },
    {
      header: 'Initial Quantity',
      accessor: 'quantity',
      render: (row) => (
        <span className="font-mono text-sm font-bold text-emerald-400">
          +{row.quantity} {row.unit}
        </span>
      ),
    },
    {
      header: 'Opening Date',
      accessor: 'opening_date',
      render: (row) => <span className="font-mono text-xs text-slate-400">{row.opening_date}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-cyan-400" /> Opening Stock Setup
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Initialize baseline inventory state with auditable ledger records.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
          Add Opening Stock
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={openingRecords}
        loading={loading}
        searchPlaceholder="Search opening stock records..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Opening Stock"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={submitting}>
              Save Opening Stock
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Batch Reference ID *</label>
            <input
              type="text"
              required
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="e.g. INIT-STL-001"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Product *</label>
            <select
              value={formData.productId}
              onChange={(e) => {
                const pId = Number(e.target.value);
                const p = products.find((prod) => prod.id === pId);
                setFormData({ ...formData, productId: pId, unit: p ? p.uom : 'kg' });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Choose product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Opening Quantity *</label>
            <input
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Opening Date *</label>
            <input
              type="date"
              required
              value={formData.openingDate}
              onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default OpeningStockPage;
