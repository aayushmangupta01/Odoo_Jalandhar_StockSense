import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/button';
import { Badge } from '../../components/common/Badge';
import { Card, StatCard } from '../../components/common/Card';
import { useToast } from '../../components/common/ToastContext';
import { ExplainStockChangeModal } from '../../components/inventory/ExplainStockChangeModal';
import { Package, ArrowLeft, HelpCircle, MapPin, History, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    inventoryApi
      .getProductById(id)
      .then((res) => setDetails(res))
      .catch((err) => {
        showToast('Product not found: ' + err.message, 'error');
        navigate('/inventory/products');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-sm animate-pulse">
        Loading product master details & location distribution...
      </div>
    );
  }

  if (!details) return null;

  const { product, locationDistribution, recentMovements } = details;
  const stock = product.current_stock;
  let status = 'IN_STOCK';
  if (stock === 0) status = 'OUT_OF_STOCK';
  else if (stock <= product.reorder_level) status = 'LOW_STOCK';
  else if (stock > product.max_stock) status = 'OVERSTOCKED';

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/inventory/products')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setIsExplainOpen(true)}>
            <HelpCircle className="w-4 h-4 mr-1.5" /> Why did stock change?
          </Button>
        </div>
      </div>

      {/* Hero Product Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Package className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{product.name}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-cyan-400">SKU: {product.sku}</span>
                <span>•</span>
                <span>Category: {product.category_name || 'General'}</span>
                <span>•</span>
                <span>Brand: {product.brand || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase font-semibold">Current System Stock</p>
            <h3 className="text-3xl font-extrabold text-slate-100 font-mono mt-0.5">
              {product.current_stock} <span className="text-sm text-cyan-400">{product.uom}</span>
            </h3>
          </div>
          <Badge status={status} />
        </div>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Reorder Level"
          value={`${product.reorder_level} ${product.uom}`}
          subtext="Automated alert threshold"
          color="amber"
        />
        <StatCard
          title="Safety Stock"
          value={`${product.safety_stock} ${product.uom}`}
          subtext="Buffer reserve"
          color="cyan"
        />
        <StatCard
          title="Min - Max Bounds"
          value={`${product.min_stock} - ${product.max_stock}`}
          subtext={`Unit of measure: ${product.uom}`}
          color="indigo"
        />
        <StatCard
          title="Tracking Features"
          value={product.track_batch ? 'Batch Enabled' : 'Standard'}
          subtext="Serial & Expiry tracking ready"
          color="emerald"
        />
      </div>

      {/* Grid: Location Distribution & Movement Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location Breakdown (Warehouse Integration Boundary) */}
        <Card
          title="Warehouse & Location Stock Distribution"
          subtitle="Location data consumed via Warehouse Module API Contract"
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg text-xs text-cyan-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Multi-location stock managed via central API.</span>
            </div>

            {locationDistribution.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No location stock mapped yet.</p>
            ) : (
              locationDistribution.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{loc.location_id}</p>
                      <p className="text-[10px] text-slate-500">Warehouse: {loc.warehouse_id}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-cyan-300">
                    {loc.quantity} {product.uom}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Movement Log */}
        <Card
          title="Recent Stock Movements"
          subtitle="Atomic transaction log backing current stock calculation"
          action={
            <Button variant="ghost" size="sm" onClick={() => setIsExplainOpen(true)}>
              Full Explanation <HelpCircle className="w-3 h-3 ml-1 text-cyan-400" />
            </Button>
          }
          className="lg:col-span-2"
        >
          <div className="space-y-2">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No movement history recorded yet.</p>
            ) : (
              recentMovements.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge status={m.operation} size="sm" />
                    <div>
                      <p className="font-medium text-slate-200">{m.reason || m.operation}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {m.movement_timestamp} • Ref: {m.reference || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span
                      className={`text-xs font-bold ${
                        m.quantity >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {m.quantity >= 0 ? `+${m.quantity}` : m.quantity} {product.uom}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {m.before_quantity} → {m.after_quantity}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Explainability Modal */}
      <ExplainStockChangeModal
        productId={id}
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
      />
    </div>
  );
}

export default ProductDetailPage;
