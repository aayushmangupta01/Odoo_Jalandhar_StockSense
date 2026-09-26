import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/button';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/ToastContext';
import { Sliders, ClipboardCheck } from 'lucide-react';

export function AdjustmentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getAdjustments();
      setAdjustments(data);
    } catch (err) {
      showToast('Failed to load adjustments: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const columns = [
    {
      header: 'Adjustment No',
      accessor: 'adjustment_number',
      render: (row) => (
        <span className="font-semibold text-slate-100 font-mono text-sm">{row.adjustment_number}</span>
      ),
    },
    {
      header: 'Product / SKU',
      accessor: 'product_name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-200 text-sm">{row.product_name}</p>
          <p className="text-xs font-mono text-cyan-400">{row.sku}</p>
        </div>
      ),
    },
    {
      header: 'System vs Physical',
      accessor: 'system_quantity',
      render: (row) => (
        <div className="font-mono text-xs text-slate-300">
          System: <span className="text-slate-400">{row.system_quantity}</span> → Physical: <strong className="text-slate-100">{row.physical_quantity} {row.uom}</strong>
        </div>
      ),
    },
    {
      header: 'Variance',
      accessor: 'variance',
      render: (row) => (
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
            row.variance === 0
              ? 'bg-slate-800 text-slate-400 border-slate-700'
              : row.variance > 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {row.variance > 0 ? `+${row.variance}` : row.variance} {row.uom}
        </span>
      ),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => <span className="text-xs text-slate-300 italic">{row.reason}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status === 'DONE' ? 'DONE' : 'DRAFT'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-amber-400" /> Physical Stock Adjustments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit history of physical inventory reconciliations. Every adjustment updates inventory state and logs a stock ledger entry.
          </p>
        </div>

        <Button onClick={() => navigate('/inventory/physical-verification')} icon={ClipboardCheck}>
          Perform Count Verification
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={adjustments}
        loading={loading}
        searchPlaceholder="Search adjustments by SKU, reason..."
      />
    </div>
  );
}

export default AdjustmentsPage;
