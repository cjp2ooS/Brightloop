import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Search,
  Play,
  Pause,
  XCircle,
  RotateCw,
  Clock,
  History,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

export const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      let url = `/subscriptions?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await apiRequest(url);
      setSubscriptions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSubscriptions();
  };

  const openDetail = async (id: string) => {
    try {
      const res = await apiRequest(`/subscriptions/${id}`);
      setSelectedSub(res);
    } catch (err: any) {
      alert(`Error fetching details: ${err.message}`);
    }
  };

  const handleStateTransition = async (targetStatus: string, reason?: string) => {
    if (!selectedSub) return;
    try {
      setTransitioning(true);
      await apiRequest(`/subscriptions/${selectedSub.id}/transition`, {
        method: 'POST',
        body: JSON.stringify({ targetStatus, reason }),
      });
      await openDetail(selectedSub.id);
      await loadSubscriptions();
    } catch (err: any) {
      alert(`Transition error: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  const handleRenew = async () => {
    if (!selectedSub) return;
    try {
      setTransitioning(true);
      await apiRequest(`/subscriptions/${selectedSub.id}/renew`, {
        method: 'POST',
      });
      await openDetail(selectedSub.id);
      await loadSubscriptions();
    } catch (err: any) {
      alert(`Renewal error: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  const handleMakeDue = async () => {
    if (!selectedSub) return;
    try {
      setTransitioning(true);
      await apiRequest(`/subscriptions/${selectedSub.id}/make-due`, {
        method: 'POST',
      });
      await openDetail(selectedSub.id);
      await loadSubscriptions();
      alert('Subscription next billing date set to past! It will now be processed by the Billing Engine.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Paused
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Confirmed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelled
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Subscriptions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer accounts, recurring billing cadences, and automated lifecycles.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            Showing <strong className="text-slate-900">{subscriptions.length}</strong> subscriptions
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subscription ID or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </form>

        {/* Status Pills */}
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto p-1 bg-slate-100/80 rounded-lg text-xs">
          {['ALL', 'ACTIVE', 'PAUSED', 'CONFIRMED', 'CANCELLED', 'EXPIRED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Cadence</th>
                <th className="py-3 px-4">Billing Amount</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading subscriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No subscriptions found matching the selected filter.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => openDetail(sub.id)}>
                        {sub.subscriptionNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{sub.customer?.companyName}</div>
                      <div className="text-[11px] text-slate-500">{sub.customer?.contactName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 font-medium">{sub.plan?.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono ml-1.5 px-1.5 py-0.5 rounded bg-slate-100">
                        {sub.billingInterval}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      ₹{sub.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {format(new Date(sub.nextBillingDate), 'yyyy-MM-dd')}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(sub.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openDetail(sub.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-medium shadow-2xs transition-all"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Detail & Lifecycle Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{selectedSub.subscriptionNumber}</h2>
                  {renderStatusBadge(selectedSub.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Customer: <span className="text-slate-900 font-semibold">{selectedSub.customer?.companyName}</span> ({selectedSub.customer?.contactName})
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lifecycle Transition Actions Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Permitted State Transitions & Actions
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {selectedSub.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStateTransition('ACTIVE')}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> Activate Subscription
                  </button>
                )}

                {selectedSub.status === 'ACTIVE' && selectedSub.allowPause && (
                  <button
                    onClick={() => handleStateTransition('PAUSED', 'Paused by operator')}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause Subscription
                  </button>
                )}

                {selectedSub.status === 'PAUSED' && (
                  <button
                    onClick={() => handleStateTransition('ACTIVE', 'Resumed by operator')}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> Resume Subscription
                  </button>
                )}

                {['ACTIVE', 'PAUSED'].includes(selectedSub.status) && selectedSub.allowEarlyCancel && (
                  <button
                    onClick={() => handleStateTransition('CANCELLED', 'Cancelled by operator request')}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Subscription
                  </button>
                )}

                {selectedSub.allowRenewal && (
                  <button
                    onClick={handleRenew}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Renew Cycle
                  </button>
                )}

                {/* DEMO TRIGGER: Make Due */}
                <button
                  onClick={handleMakeDue}
                  disabled={transitioning}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 ml-auto shadow-2xs transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Force Due (Demo Test)
                </button>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Plan Cadence</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedSub.billingInterval}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Recurring Total</span>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">₹{selectedSub.totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Next Billing Date</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {format(new Date(selectedSub.nextBillingDate), 'yyyy-MM-dd')}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Payment Terms</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedSub.paymentTerms}</div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900">Subscription Line Items</div>
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Discount</th>
                      <th className="p-2.5 text-right">Tax</th>
                      <th className="p-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedSub.items?.map((it: any) => (
                      <tr key={it.id}>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-900">{it.productName}</div>
                          {it.variantName && <div className="text-[10px] text-slate-500">Variant: {it.variantName}</div>}
                        </td>
                        <td className="p-2.5 text-center">{it.quantity}</td>
                        <td className="p-2.5 text-right">₹{(it.unitPrice + it.variantPrice).toFixed(2)}</td>
                        <td className="p-2.5 text-right text-rose-600">-₹{it.discountAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-slate-600">₹{it.taxAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">₹{it.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chronological Audit Timeline */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>Subscription Lifecycle Timeline</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedSub.events?.map((ev: any) => (
                  <div key={ev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700">{ev.eventType}</span>
                        <span className="text-[10px] text-slate-500">by {ev.actorName || 'System'}</span>
                      </div>
                      <p className="text-slate-700 text-[11px] mt-0.5">{ev.description}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {format(new Date(ev.createdAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
