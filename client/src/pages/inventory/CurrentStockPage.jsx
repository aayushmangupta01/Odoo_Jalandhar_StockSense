import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/button';
import { StatCard } from '../../components/common/Card';
import { useToast } from '../../components/common/ToastContext';
import { ExplainStockChangeModal } from '../../components/inventory/ExplainStockChangeModal';
import { Boxes, HelpCircle, AlertTriangle, MapPin, RefreshCw } from 'lucide-react';

export function CurrentStockPage() {
  const { showToast } = useToast();
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Explainability Modal
  const [explainProductId, setExplainProductId] = useState(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getStock();
      setStockData(data);
    } catch (err) {
      showToast('Failed to load stock data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const totalItems = stockData.length;
  const lowStockItems = stockData.filter((s) => s.stock_status === 'LOW_STOCK').length;
  const outOfStockItems = stockData.filter((s) => s.stock_status === 'OUT_OF_STOCK').length;
  const healthyItems = stockData.filter((s) => s.stock_status === 'IN_STOCK').length;

  const filteredStock = stockData.filter((s) => {
    if (selectedStatus && s.stock_status !== selectedStatus) return false;
    if (selectedLocation && s.location_id !== selectedLocation) return false;
    return true;
  });

  const columns = [
    {
      header: 'Product / SKU',
      accessor: 'product_name',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-100 text-sm">{row.product_name}</p>
          <p className="text-xs font-mono text-cyan-400">{row.sku}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category_name',
      render: (row) => (
        <span className="text-xs text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
          {row.category_name || 'General'}
        </span>
      ),
    },
    {
      header: 'Location',
      accessor: 'location_id',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.location_id}</span>
          <span className="text-slate-500">({row.warehouse_id})</span>
        </div>
      ),
    },
    {
      header: 'Current Quantity',
      accessor: 'quantity',
      render: (row) => (
        <span className="font-mono text-base font-bold text-slate-100">
          {row.quantity} <span className="text-xs text-slate-400 font-normal">{row.uom}</span>
        </span>
      ),
    },
    {
      header: 'Reorder Level',
      accessor: 'reorder_level',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.reorder_level} {row.uom}
        </span>
      ),
    },
    {
      header: 'Stock Status',
      accessor: 'stock_status',
      render: (row) => <Badge status={row.stock_status} />,
    },
    {
      header: 'Audit Trace',
      sortable: false,
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExplainProductId(row.product_id)}
          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20"
        >
          <HelpCircle className="w-3.5 h-3.5 mr-1" />
          Why {row.quantity} {row.uom}?
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-cyan-400" /> Current Stock Visibility
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time, database-synchronized stock quantities across all warehouse locations.
          </p>
        </div>

        <Button variant="outline" onClick={fetchStock} icon={RefreshCw}>
          Refresh Stock
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Stock Entries" value={totalItems} color="cyan" icon={Boxes} />
        <StatCard title="Healthy Stock" value={healthyItems} color="emerald" />
        <StatCard title="Low Stock Warnings" value={lowStockItems} color="amber" icon={AlertTriangle} />
        <StatCard title="Out of Stock" value={outOfStockItems} color="rose" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredStock}
        loading={loading}
        searchPlaceholder="Search product, SKU, location..."
        filterControls={
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="OVERSTOCKED">Overstocked</option>
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Locations</option>
              <option value="LOC-MAIN-01">LOC-MAIN-01 (Main Store)</option>
              <option value="LOC-RACK-B2">LOC-RACK-B2 (Production Rack)</option>
            </select>
          </div>
        }
      />

      {/* Explainability Modal */}
      <ExplainStockChangeModal
        productId={explainProductId}
        isOpen={Boolean(explainProductId)}
        onClose={() => setExplainProductId(null)}
      />
    </div>
  );
}

export default CurrentStockPage;
