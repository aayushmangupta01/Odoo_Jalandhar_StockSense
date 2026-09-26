import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../../services/api';
import { DataTable } from '../../../components/common/DataTable';
import { Badge } from '../../../components/common/Badge';
import { useToast } from '../../../components/common/ToastContext';
import { TrendingDown, Calendar, ShieldAlert } from 'lucide-react';

export function ForecastPage() {
  const { showToast } = useToast();
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getForecast()
      .then((data) => setForecasts(data))
      .catch((err) => showToast('Failed to compute stock forecast: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      header: 'Health Risk Status',
      accessor: 'status',
      render: (row) => (
        <span
          className={`font-mono text-xs font-bold px-2.5 py-1 rounded border ${
            row.status === 'CRITICAL'
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
              : row.status === 'WARNING'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}
        >
          {row.status}
        </span>
      ),
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
      header: 'Current Stock',
      accessor: 'currentStock',
      render: (row) => (
        <span className="font-mono text-sm font-bold text-slate-100">
          {row.currentStock} <span className="text-xs text-slate-400 font-normal">{row.uom}</span>
        </span>
      ),
    },
    {
      header: 'Daily Velocity',
      accessor: 'avgDailyConsumption',
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          ~{row.avgDailyConsumption} {row.uom}/day
        </span>
      ),
    },
    {
      header: 'Est. Coverage',
      accessor: 'coverageDays',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-cyan-300">
          ≈ {row.coverageDays > 300 ? '300+' : row.coverageDays} Days
        </span>
      ),
    },
    {
      header: 'Projected Risk Date',
      accessor: 'shortageRiskDate',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.shortageRiskDate}</span>
        </div>
      ),
    },
    {
      header: 'Smart Recommendation',
      accessor: 'recommendation',
      render: (row) => <span className="text-xs text-slate-300">{row.recommendation}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-cyan-400" /> Stock Depletion Forecasting
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Predicts estimated days remaining and projected stockout risk dates based on recent delivery consumption velocity.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={forecasts}
        loading={loading}
        searchPlaceholder="Search product forecast..."
      />
    </div>
  );
}

export default ForecastPage;
