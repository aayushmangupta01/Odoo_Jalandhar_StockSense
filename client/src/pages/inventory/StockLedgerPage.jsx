import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/ToastContext';
import { FileSpreadsheet, ShieldCheck } from 'lucide-react';

export function StockLedgerPage() {
  const { showToast } = useToast();
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getLedger()
      .then((data) => setLedgerEntries(data))
      .catch((err) => showToast('Failed to load stock ledger: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      header: 'Ledger Entry ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs text-cyan-400">#LEDG-{row.id.toString().padStart(5, '0')}</span>,
    },
    {
      header: 'Timestamp',
      accessor: 'ledger_timestamp',
      render: (row) => <span className="font-mono text-xs text-slate-400">{row.ledger_timestamp}</span>,
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
      header: 'Operation',
      accessor: 'operation',
      render: (row) => <Badge status={row.operation} />,
    },
    {
      header: 'Delta Change',
      accessor: 'quantity_change',
      render: (row) => (
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
            row.quantity_change >= 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {row.quantity_change >= 0 ? `+${row.quantity_change}` : row.quantity_change} {row.uom}
        </span>
      ),
    },
    {
      header: 'Previous → New Stock',
      accessor: 'previous_quantity',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.previous_quantity} → <strong className="text-slate-100">{row.new_quantity} {row.uom}</strong>
        </span>
      ),
    },
    {
      header: 'User & Reference',
      accessor: 'reference',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-200">{row.reference || 'N/A'}</p>
          <p className="text-[10px] text-slate-500 font-mono">By: {row.user || 'Inventory System'}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-cyan-400" /> Stock Audit Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative, read-only immutable audit trail recording every inventory mutation across the application lifecycle.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Tamper-Evident Database Log
        </div>
      </div>

      <DataTable
        columns={columns}
        data={ledgerEntries}
        loading={loading}
        searchPlaceholder="Search audit ledger by SKU, operation, reference..."
      />
    </div>
  );
}

export default StockLedgerPage;
