import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Layers, Plus, RotateCw, Check, X } from 'lucide-react';

export const Plans: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [billingInterval, setBillingInterval] = useState('MONTHLY');
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowEarlyCancel, setAllowEarlyCancel] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const [plns, prods] = await Promise.all([
        apiRequest('/plans'),
        apiRequest('/products'),
      ]);
      setPlans(plns);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/plans', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          billingAmount: parseFloat(billingAmount),
          billingInterval,
          allowRenewal,
          allowPause,
          allowEarlyCancel,
          productIds: selectedProductIds,
        }),
      });
      setShowModal(false);
      setName('');
      setDescription('');
      setBillingAmount('');
      setSelectedProductIds([]);
      await loadPlans();
    } catch (err: any) {
      alert(`Error creating plan: ${err.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Subscription Plans
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadence definitions, automatic closures, pausing permissions, and product bundle associations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <RotateCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <span className="text-xs mt-2 block">Loading plans...</span>
          </div>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl bg-white border border-slate-200/80 space-y-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full font-mono">
                    {p.billingInterval}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {p._count?.subscriptions || 0} active subs
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900 font-mono">
                    ₹{p.billingAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500">/ {p.billingInterval.toLowerCase()}</span>
                </div>
              </div>

              {/* Rules check */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Automatic Renewals:</span>
                  <span className={p.allowRenewal ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                    {p.allowRenewal ? 'Permitted' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Pause Capability:</span>
                  <span className={p.allowPause ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                    {p.allowPause ? 'Permitted' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Early Cancellation:</span>
                  <span className={p.allowEarlyCancel ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                    {p.allowEarlyCancel ? 'Permitted' : 'No Early Exit'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreatePlan}
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Define Recurring Plan</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Growth Monthly"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Base Cadence Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(e.target.value)}
                    placeholder="2500.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Billing Interval *</label>
                  <select
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Commercial benefits and service level terms..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Policy Toggles */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-slate-800 block text-xs">Lifecycle Rules</span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowRenewal}
                      onChange={(e) => setAllowRenewal(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Allow Automatic Renewal at term expiry</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPause}
                      onChange={(e) => setAllowPause(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Allow Customers/Staff to Pause subscription</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowEarlyCancel}
                      onChange={(e) => setAllowEarlyCancel(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Allow Early Cancellation before interval ends</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
              >
                Save Plan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
