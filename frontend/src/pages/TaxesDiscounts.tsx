import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Percent, Receipt, Plus, RotateCw, X } from 'lucide-react';

export const TaxesDiscounts: React.FC = () => {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDiscModal, setShowDiscModal] = useState(false);

  // Tax form
  const [taxName, setTaxName] = useState('');
  const [taxPct, setTaxPct] = useState('');
  const [taxInclusive, setTaxInclusive] = useState(false);

  // Discount form
  const [discName, setDiscName] = useState('');
  const [discCode, setDiscCode] = useState('');
  const [discType, setDiscType] = useState('PERCENTAGE');
  const [discValue, setDiscValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [t, d] = await Promise.all([
        apiRequest('/taxes'),
        apiRequest('/discounts'),
      ]);
      setTaxes(t);
      setDiscounts(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/taxes', {
        method: 'POST',
        body: JSON.stringify({
          name: taxName,
          percentage: parseFloat(taxPct),
          isInclusive: taxInclusive,
        }),
      });
      setShowTaxModal(false);
      setTaxName('');
      setTaxPct('');
      await loadData();
    } catch (err: any) {
      alert(`Tax error: ${err.message}`);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/discounts', {
        method: 'POST',
        body: JSON.stringify({
          name: discName,
          code: discCode,
          discountType: discType,
          value: parseFloat(discValue),
          usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        }),
      });
      setShowDiscModal(false);
      setDiscName('');
      setDiscCode('');
      setDiscValue('');
      setUsageLimit('');
      await loadData();
    } catch (err: any) {
      alert(`Discount error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Percent className="w-5 h-5 text-blue-600" />
            Taxes & Discount Rules Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure jurisdiction tax rules, GST models, and transaction-safe discount redemption policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Rules */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Configured Tax Rules</h2>
            </div>
            <button
              onClick={() => setShowTaxModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tax
            </button>
          </div>

          <div className="space-y-2">
            {taxes.map((t) => (
              <div key={t.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t.isInclusive ? 'Inclusive of listed prices' : 'Added exclusively on taxable amount'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-blue-700 font-mono">{t.percentage}%</div>
                  <span className="text-[10px] text-emerald-700 font-medium">ACTIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discounts */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Promotional Discounts & Credits</h2>
            </div>
            <button
              onClick={() => setShowDiscModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Discount
            </button>
          </div>

          <div className="space-y-2">
            {discounts.map((d) => (
              <div key={d.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{d.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-mono text-[10px] text-emerald-700 font-bold">
                      {d.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Used: {d.timesUsed} / {d.usageLimit || '∞'} redemptions
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-emerald-700 font-mono">
                    {d.discountType === 'PERCENTAGE' ? `${d.value}%` : `₹${d.value}`}
                  </div>
                  <span className="text-[10px] text-slate-500 capitalize">{d.discountType.toLowerCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateTax} className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Tax Rule</h3>
              <button type="button" onClick={() => setShowTaxModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST (18%)"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Percentage Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="18"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-slate-700">Tax is inclusive in unit price</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTaxModal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
              >
                Save Tax
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateDiscount} className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Discount Rule</h3>
              <button type="button" onClick={() => setShowDiscModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Discount Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Prepay 15%"
                  value={discName}
                  onChange={(e) => setDiscName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Redemption Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ANNUAL15"
                  value={discCode}
                  onChange={(e) => setDiscCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Type</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="15"
                    value={discValue}
                    onChange={(e) => setDiscValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDiscModal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs"
              >
                Save Discount
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
