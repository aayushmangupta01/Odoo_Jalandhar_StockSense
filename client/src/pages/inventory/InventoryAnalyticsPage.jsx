import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Card, StatCard } from '../../components/common/Card';
import { useToast } from '../../components/common/ToastContext';
import { BarChart3, TrendingUp, Boxes, ShieldAlert, PackageCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';

export function InventoryAnalyticsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      inventoryApi.getProducts(),
      inventoryApi.getStock(),
      inventoryApi.getMovements(),
    ])
      .then(([p, s, m]) => {
        setProducts(p);
        setStock(s);
        setMovements(m);
      })
      .catch((err) => showToast('Failed to load analytics: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-sm animate-pulse">
        Aggregating database stock analytics & movement trends...
      </div>
    );
  }

  // Calculate real DB distributions
  const categoryMap = {};
  stock.forEach((item) => {
    const cat = item.category_name || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + item.quantity;
  });

  const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

  // Top products by stock volume
  const topStockProducts = [...products]
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 6)
    .map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      stock: p.current_stock,
      reorder: p.reorder_level,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" /> Inventory Specific Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Deep analytical insights grounded in authoritative database state (Stock distributions, velocity, category volume).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Skus Managed" value={products.length} color="cyan" icon={Boxes} />
        <StatCard
          title="Stock Volume Units"
          value={stock.reduce((a, b) => a + b.quantity, 0).toLocaleString()}
          color="emerald"
        />
        <StatCard
          title="Total Ledger Movements"
          value={movements.length}
          color="indigo"
          icon={TrendingUp}
        />
        <StatCard
          title="Reorder Risk Count"
          value={products.filter((p) => p.current_stock <= p.reorder_level).length}
          color="amber"
          icon={ShieldAlert}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Product Stock Volume Chart */}
        <Card title="Top Products by Current Stock Volume" subtitle="Comparison of current stock against reorder threshold">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStockProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="stock" fill="#06b6d4" name="Current Stock" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reorder" fill="#f59e0b" name="Reorder Level" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stock Volume Distribution by Category */}
        <Card title="Stock Quantity Distribution by Category" subtitle="Real-time breakdown across item categories">
          <div className="h-72 w-full flex items-center justify-center">
            {categoryChartData.length === 0 ? (
              <p className="text-xs text-slate-500">No stock data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default InventoryAnalyticsPage;
