import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/ToastContext';
import { History, ArrowDownLeft, ArrowUpRight, Sliders, PackagePlus } from 'lucide-react';

export function StockMovementsPage() {
  const { showToast } = useToast();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getMovements()
      .then((data) => setMovements(data))
      .catch((err) => showToast('Failed to load stock movements: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'movement_timestamp',
      render: (row) => <span className="font-mono text-xs text-slate-400">{row.movement_timestamp}</span>,
    },
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
      header: 'Operation',
      accessor: 'operation',
      render: (row) => <Badge status={row.operation} />,
    },
    {
      header: 'Quantity Change',
      accessor: 'quantity',
      render: (row) => (
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
            row.quantity >= 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {row.quantity >= 0 ? `+${row.quantity}` : row.quantity} {row.uom}
        </span>
      ),
    },
    {
      header: 'Before → After',
      accessor: 'before_quantity',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.before_quantity} → <strong className="text-slate-200">{row.after_quantity} {row.uom}</strong>
        </span>
      ),
    },
    {
      header: 'Reference & Reason',
      accessor: 'reason',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-200">{row.reason || 'N/A'}</p>
          <p className="text-[10px] text-slate-500 font-mono">Ref: {row.reference || 'None'}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <History className="w-6 h-6 text-cyan-400" /> Stock Movement Stream
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete operational movement logs covering receipts, dispatches, physical counts, and initial setup.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={movements}
        loading={loading}
        searchPlaceholder="Search movements by SKU, reference, operation..."
      />
    </div>
  );
}

export default StockMovementsPage;
