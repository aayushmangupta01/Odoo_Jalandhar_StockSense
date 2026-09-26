import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/button';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastContext';
import { Package, Plus, Filter, HelpCircle, ArrowRight } from 'lucide-react';
import { ExplainStockChangeModal } from '../../components/inventory/ExplainStockChangeModal';

export function ProductsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Create Product Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand: '',
    uom: 'kg',
    initial_stock: 0,
    reorder_level: 20,
    safety_stock: 5,
    min_stock: 5,
    max_stock: 1000,
  });

  // Explainability Modal state
  const [explainProductId, setExplainProductId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getCategories(),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err) {
      showToast('Failed to load products: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      showToast('Product Name and SKU are required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryApi.createProduct(formData);
      showToast(`Product ${formData.name} created successfully!`, 'success');
      setIsModalOpen(false);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category_id: '',
        brand: '',
        uom: 'kg',
        initial_stock: 0,
        reorder_level: 20,
        safety_stock: 5,
        min_stock: 5,
        max_stock: 1000,
      });
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.category_id !== Number(selectedCategory)) return false;
    if (selectedStatus) {
      const stock = p.current_stock;
      if (selectedStatus === 'IN_STOCK' && stock <= p.reorder_level) return false;
      if (selectedStatus === 'LOW_STOCK' && (stock === 0 || stock > p.reorder_level)) return false;
      if (selectedStatus === 'OUT_OF_STOCK' && stock > 0) return false;
    }
    return true;
  });

  const columns = [
    {
      header: 'Product / SKU',
      accessor: 'name',
      render: (row) => (
        <div>
          <button
            onClick={() => navigate(`/inventory/products/${row.id}`)}
            className="font-semibold text-slate-100 hover:text-cyan-400 text-sm transition-colors text-left"
          >
            {row.name}
          </button>
          <p className="text-xs font-mono text-cyan-400/90">{row.sku}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category_name',
      render: (row) => (
        <span className="text-xs text-slate-300 font-medium px-2 py-1 rounded bg-slate-800 border border-slate-700">
          {row.category_name || 'Uncategorized'}
        </span>
      ),
    },
    {
      header: 'Brand',
      accessor: 'brand',
      render: (row) => <span className="text-slate-400 text-xs">{row.brand || '—'}</span>,
    },
    {
      header: 'Current Stock',
      accessor: 'current_stock',
      render: (row) => (
        <div className="font-mono text-sm font-bold">
          {row.current_stock} <span className="text-xs text-slate-400 font-normal">{row.uom}</span>
        </div>
      ),
    },
    {
      header: 'Reorder Threshold',
      accessor: 'reorder_level',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.reorder_level} {row.uom}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'current_stock',
      render: (row) => {
        const stock = row.current_stock;
        let status = 'IN_STOCK';
        if (stock === 0) status = 'OUT_OF_STOCK';
        else if (stock <= row.reorder_level) status = 'LOW_STOCK';
        else if (stock > row.max_stock) status = 'OVERSTOCKED';
        return <Badge status={status} />;
      },
    },
    {
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExplainProductId(row.id)}
            title="Why did stock change?"
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Why?
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/inventory/products/${row.id}`)}
          >
            Details <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-400" /> Product Master
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage inventory items, SKUs, reorder thresholds, and location tracking.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
          Add New Product
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        searchPlaceholder="Search by name, SKU, or brand..."
        emptyTitle="No products found"
        emptyDescription="Create a new product or modify your search filters."
        filterControls={
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        }
      />

      {/* Create Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Product"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} isLoading={isSubmitting}>
              Save Product
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. High Tensile Steel Rods 16mm"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">SKU / Item Code *</label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              placeholder="e.g. STL-016-HT"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Brand / Manufacturer</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g. TATA Tiscon"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Unit of Measure (UOM)</label>
            <input
              type="text"
              value={formData.uom}
              onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
              placeholder="e.g. kg, units, meters, boxes"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Initial Opening Stock</label>
            <input
              type="number"
              min="0"
              value={formData.initial_stock}
              onChange={(e) => setFormData({ ...formData, initial_stock: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Reorder Level Threshold</label>
            <input
              type="number"
              min="0"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Barcode / UPC</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="890100..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Explainability Modal */}
      <ExplainStockChangeModal
        productId={explainProductId}
        isOpen={Boolean(explainProductId)}
        onClose={() => setExplainProductId(null)}
      />
    </div>
  );
}

export default ProductsPage;
