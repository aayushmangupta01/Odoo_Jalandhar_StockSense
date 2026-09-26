import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../../services/api';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/button';
import { Badge } from '../../../components/common/Badge';
import { useToast } from '../../../components/common/ToastContext';
import { Sparkles, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export function SmartRecommendationsPage() {
  const { showToast } = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getLocationIntelligence()
      .then((res) => setRecommendations(res.recommendations))
      .catch((err) => showToast('Failed to load recommendations: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleApproveRecommendation = (rec) => {
    showToast(
      `Approved Transfer payload for ${rec.suggestedQuantity} ${rec.unit} of ${rec.productName}! Recommended action sent to Warehouse team integration payload.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" /> Smart Stock Transfer Recommendations
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Detects potential location stock imbalances and suggests human-approved stock redistributions.
        </p>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-300">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0" />
        <p>
          <strong>Human-in-the-Loop Safeguard:</strong> Transfer recommendations are purely advisory suggestions based on location stock variance. The system will never execute stock transfers automatically.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 font-mono text-sm animate-pulse">
          Evaluating location stock imbalances...
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-slate-200">No Location Imbalances Detected</h3>
            <p className="text-xs text-slate-400">
              Stock distribution across mapped locations is currently balanced based on current usage.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="border-cyan-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge status="UNUSUAL">LOCATION IMBALANCE</Badge>
                    <span className="font-semibold text-base text-slate-100">{rec.productName}</span>
                    <span className="font-mono text-xs text-cyan-400">({rec.sku})</span>
                  </div>

                  <p className="text-xs text-slate-300">{rec.reason}</p>

                  <div className="flex items-center gap-4 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500">Surplus Location:</span>{' '}
                      <strong className="text-emerald-400">{rec.sourceLocation}</strong> ({rec.sourceStock} {rec.unit})
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="text-slate-500">Shortage Location:</span>{' '}
                      <strong className="text-rose-400">{rec.destLocation}</strong> ({rec.destStock} {rec.unit})
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 bg-cyan-950/30 p-4 rounded-xl border border-cyan-800/40 text-right shrink-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Suggested Transfer</p>
                  <p className="text-2xl font-extrabold font-mono text-slate-100">
                    {rec.suggestedQuantity} <span className="text-xs text-cyan-300 font-normal">{rec.unit}</span>
                  </p>
                  <Button size="sm" onClick={() => handleApproveRecommendation(rec)}>
                    Approve Recommendation
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SmartRecommendationsPage;
