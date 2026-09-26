import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../../services/api';
import { DataTable } from '../../../components/common/DataTable';
import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { useToast } from '../../../components/common/ToastContext';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function AnomaliesPage() {
  const { showToast } = useToast();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getAnomalies()
      .then((data) => setAnomalies(data))
      .catch((err) => showToast('Failed to run anomaly detection: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      header: 'Severity',
      accessor: 'severity',
      render: (row) => <Badge status={row.severity} />,
    },
    {
      header: 'Product / SKU',
      accessor: 'productName',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-100 text-sm">{row.productName}</p>
          <p className="text-xs font-mono text-cyan-400">{row.sku}</p>
        </div>
      ),
    },
    {
      header: 'Operation',
      accessor: 'operation',
      render: (row) => <span className="font-mono text-xs text-slate-300">{row.operation}</span>,
    },
    {
      header: 'Explainable Signal & Description',
      accessor: 'explanation',
      render: (row) => (
        <div>
          <p className="font-semibold text-xs text-slate-200">{row.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">{row.explanation}</p>
        </div>
      ),
    },
    {
      header: 'Recommended Action',
      accessor: 'recommendation',
      render: (row) => (
        <span className="text-xs text-amber-300/90 font-medium bg-amber-500/10 p-2 rounded border border-amber-500/20 block">
          {row.recommendation}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" /> Inventory Anomaly Detection
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Identifies unusual movement volume spikes and large physical stock adjustment variances using statistical Z-score thresholds.
        </p>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-300">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0" />
        <p>
          <strong>Explainable Signals Policy:</strong> Anomalies highlight potential discrepancies or high-risk volume variations for human review. They do not automatically declare fraudulent activity.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={anomalies}
        loading={loading}
        emptyTitle="No anomalies detected"
        emptyDescription="All stock movements and physical adjustments fall within expected statistical ranges."
        searchPlaceholder="Search anomalies..."
      />
    </div>
  );
}

export default AnomaliesPage;
