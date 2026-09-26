import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { inventoryApi } from '../../services/api';
import { History, ArrowDownLeft, ArrowUpRight, Sliders, PackagePlus, CheckCircle2, Clock } from 'lucide-react';

export function ExplainStockChangeModal({ productId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      inventoryApi
        .getExplanation(productId)
        .then((res) => setData(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const getOpIcon = (op) => {
    switch (op) {
      case 'RECEIPT':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'DELIVERY':
        return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
      case 'ADJUSTMENT':
        return <Sliders className="w-4 h-4 text-amber-400" />;
      case 'OPENING_STOCK':
        return <PackagePlus className="w-4 h-4 text-cyan-400" />;
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? `Why did stock change for ${data.product.name}?` : 'Trace Stock Calculation'}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse font-mono text-sm">
          Tracing atomic stock ledger events...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Authoritative Database Stock</p>
              <h4 className="text-3xl font-extrabold text-slate-100 font-mono mt-0.5">
                {data.product.currentStock} <span className="text-base text-cyan-400">{data.product.uom}</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">{data.explanationSummary}</p>
            </div>
            <Badge status="DONE">VERIFIED AUDIT LEDGER</Badge>
          </div>

          {/* Timeline Stream */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Chronological Ledger Audit Trail
            </h5>

            <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
              {data.timeline.map((event, idx) => (
                <div key={event.id || idx} className="relative group">
                  {/* Circle dot on line */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {getOpIcon(event.operation)}
                        <span className="font-semibold text-sm text-slate-200">{event.operation}</span>
                        <span className="text-xs text-slate-400 font-mono">Ref: {event.reference}</span>
                      </div>
                      <span
                        className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded ${
                          event.quantityChange >= 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {event.formattedChange} {data.product.uom}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-2">{event.reason}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/60 pt-2 mt-2">
                      <span>Location: <span className="text-slate-400">{event.location}</span></span>
                      <span>Stock Flow: {event.previousQuantity} → <strong className="text-cyan-300">{event.newQuantity} {data.product.uom}</strong></span>
                      <span>User: {event.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default ExplainStockChangeModal;
