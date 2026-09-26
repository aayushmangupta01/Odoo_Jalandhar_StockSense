import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../services/api';
import { Button } from '../../components/common/button';
import { Card } from '../../components/common/Card';
import { useToast } from '../../components/common/ToastContext';
import { ClipboardCheck, Calculator, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PhysicalVerificationPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [locationId, setLocationId] = useState('LOC-MAIN-01');
  const [systemQuantity, setSystemQuantity] = useState(0);
  const [physicalQuantity, setPhysicalQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    inventoryApi
      .getProducts()
      .then((data) => setProducts(data))
      .catch((err) => showToast('Failed to load products: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));

  useEffect(() => {
    if (selectedProduct) {
      // Fetch exact location stock
      inventoryApi
        .getStock()
        .then((stockList) => {
          const match = stockList.find(
            (s) => s.product_id === selectedProduct.id && s.location_id === locationId
          );
          setSystemQuantity(match ? match.quantity : 0);
          setPhysicalQuantity(match ? String(match.quantity) : '0');
        })
        .catch(() => setSystemQuantity(0));
    }
  }, [selectedProductId, locationId]);

  const variance = physicalQuantity !== '' ? Number(physicalQuantity) - systemQuantity : 0;

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Please select a product to verify', 'warning');
      return;
    }
    if (physicalQuantity === '' || Number(physicalQuantity) < 0) {
      showToast('Physical quantity cannot be negative', 'warning');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide a reason for physical count verification', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await inventoryApi.createAdjustment({
        product_id: Number(selectedProductId),
        location_id: locationId,
        warehouse_id: 'WH-01',
        physical_quantity: Number(physicalQuantity),
        reason,
      });

      showToast(
        `Physical Verification Complete! Adjustment #${res.adjustmentNumber} recorded (Variance: ${res.variance > 0 ? '+' : ''}${res.variance} ${selectedProduct?.uom}).`,
        'success'
      );
      navigate('/inventory/adjustments');
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-cyan-400" /> Physical Stock Verification
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Warehouse stock counting interface. Compare recorded system stock against physical count to calculate variance.
        </p>
      </div>

      <Card title="Stock Counting Form">
        <form onSubmit={handleSubmitVerification} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Location</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="LOC-MAIN-01">LOC-MAIN-01 (Main Warehouse Store)</option>
                <option value="LOC-RACK-B2">LOC-RACK-B2 (Production Rack B2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Choose item to count...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">System Record</p>
                  <p className="text-2xl font-bold font-mono text-slate-100 mt-1">
                    {systemQuantity} <span className="text-xs text-slate-400 font-normal">{selectedProduct.uom}</span>
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-cyan-400 mb-1">
                    Physical Count Input
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={physicalQuantity}
                    onChange={(e) => setPhysicalQuantity(e.target.value)}
                    placeholder="Enter count"
                    className="w-full bg-slate-950 border border-cyan-500/50 text-center text-xl font-bold font-mono text-cyan-300 rounded py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className={`p-3 rounded-lg border ${
                  variance === 0
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : variance > 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold">Calculated Variance</p>
                  <p className="text-2xl font-bold font-mono mt-1">
                    {variance > 0 ? `+${variance}` : variance} <span className="text-xs font-normal">{selectedProduct.uom}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Physical Count Variance *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Monthly physical audit count variance / damage loss / unrecorded scrap..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={!selectedProductId}
              isLoading={submitting}
              icon={Calculator}
            >
              Submit Physical Verification & Reconcile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default PhysicalVerificationPage;
