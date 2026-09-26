import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/button';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastContext';
import { FolderTree, Plus } from 'lucide-react';

export function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getCategories();
      setCategories(data);
    } catch (err) {
      showToast('Failed to load categories: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await inventoryApi.createCategory(formData);
      showToast(`Category ${formData.name} created!`, 'success');
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name',
      render: (row) => <span className="font-semibold text-slate-100">{row.name}</span>,
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => <span className="text-slate-400 text-xs">{row.description || 'No description provided.'}</span>,
    },
    {
      header: 'Product Count',
      accessor: 'product_count',
      render: (row) => (
        <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-mono text-xs font-bold">
          {row.product_count || 0} Products
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          ACTIVE
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-cyan-400" /> Category Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize inventory items into logical product categories.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
          Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        searchPlaceholder="Search categories..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Category"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Save Category
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Electrical Components"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of items under this classification..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CategoriesPage;
