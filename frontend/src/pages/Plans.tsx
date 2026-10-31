import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Layers, Plus, RotateCw, Calendar, Check, X } from 'lucide-react';

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Subscription Plans</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cadence definitions, automatic closures, pausing rules, and product bundle associations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            <RotateCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
          </div>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full font-mono">
                    {p.billingInterval}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {p._count?.subscriptions || 0} active subs
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-2">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-100 font-mono">
                    ₹{p.billingAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400">/ {p.billingInterval.toLowerCase()}</span>
                </div>
              </div>

              {/* Rules check */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Automatic Renewals:</span>
                  <span className={p.allowRenewal ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                    {p.allowRenewal ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Pause Permitted:</span>
                  <span className={p.allowPause ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                    {p.allowPause ? 'Allowed' : 'Not Allowed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Early Cancellation:</span>
                  <span className={p.allowEarlyCancel ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                    {p.allowEarlyCancel ? 'Allowed' : 'Not Allowed'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePlan}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100">Create Subscription Plan</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Business Pro"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Billing Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={billingAmount}
                    onChange={(e) => setBillingAmount(e.target.value)}
                    placeholder="2560.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Billing Interval</label>
                  <select
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowRenewal}
                    onChange={(e) => setAllowRenewal(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600"
                  />
                  <span>Allow automatic renewals</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowPause}
                    onChange={(e) => setAllowPause(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600"
                  />
                  <span>Allow customers/staff to pause subscription</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowEarlyCancel}
                    onChange={(e) => setAllowEarlyCancel(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600"
                  />
                  <span>Allow early cancellation</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
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
