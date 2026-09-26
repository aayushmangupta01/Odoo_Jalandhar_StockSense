import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../../services/api';
import { Card, StatCard } from '../../../components/common/Card';
import { useToast } from '../../../components/common/ToastContext';
import { MapPin, Building2, Boxes, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/common/button';

export function LocationIntelligencePage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState({ locations: [], recommendations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getLocationIntelligence()
      .then((res) => setData(res))
      .catch((err) => showToast('Failed to load location intelligence: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-sm animate-pulse">
        Analyzing warehouse location concentration & stock distribution...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyan-400" /> Location Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Product distribution across mapped warehouse locations and surplus / shortage analytics.
          </p>
        </div>

        <Button onClick={() => navigate('/inventory/intelligence/recommendations')} icon={Sparkles}>
          View Transfer Suggestions ({data.recommendations.length})
        </Button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.locations.map((loc) => (
          <Card
            key={loc.locationId}
            title={loc.locationId}
            subtitle={`Warehouse ID: ${loc.warehouseId}`}
            action={
              <span className="text-xs font-mono text-cyan-400 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800">
                {loc.totalProducts} Mapped Products
              </span>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Total Stock Units</span>
                <span className="font-mono text-base font-bold text-slate-100">
                  {loc.totalQuantity.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Items Mapped</p>
                {loc.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
                    <div>
                      <p className="font-semibold text-slate-200">{item.product_name}</p>
                      <p className="text-[10px] font-mono text-slate-500">{item.sku}</p>
                    </div>
                    <span className="font-mono font-bold text-cyan-300">
                      {item.quantity} {item.uom}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default LocationIntelligencePage;
