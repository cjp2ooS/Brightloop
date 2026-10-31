import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Search,
  Filter,
  Play,
  Pause,
  XCircle,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

export const Subscriptions: React.FC = () => {
  const { user } = useAuth();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'PAUSED':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'CONFIRMED':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'EXPIRED':
        return 'bg-slate-800 text-slate-400 border border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Subscription Operations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete lifecycle management, automated billing intervals, and chronological audit timelines.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subscription number or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'ACTIVE', 'PAUSED', 'CONFIRMED', 'CANCELLED', 'EXPIRED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Subscription</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Plan & Cadence</th>
              <th className="py-3 px-4">Billing Amount</th>
              <th className="py-3 px-4">Next Billing Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin text-blue-500" />
                    <span>Loading subscriptions...</span>
                  </div>
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No subscriptions found matching the selected filter.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">{sub.subscriptionNumber}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-100">{sub.customer?.companyName}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-200 font-medium">{sub.plan?.name}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">{sub.billingInterval}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                    ₹{sub.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {format(new Date(sub.nextBillingDate), 'yyyy-MM-dd')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openDetail(sub.id)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
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

      {/* Subscription Detail & Lifecycle Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-100">{selectedSub.subscriptionNumber}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(selectedSub.status)}`}>
                    {selectedSub.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Customer: <span className="text-slate-200 font-semibold">{selectedSub.customer?.companyName}</span> ({selectedSub.customer?.contactName})
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Lifecycle Transition Actions Bar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Permitted State Transitions & Actions
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {selectedSub.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleStateTransition('ACTIVE')}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Activate Subscription
                  </button>
                )}

                {selectedSub.status === 'ACTIVE' && selectedSub.allowPause && (
                  <button
                    onClick={() => handleStateTransition('PAUSED', 'Paused by operator')}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause Subscription
                  </button>
                )}

                {selectedSub.status === 'PAUSED' && (
                  <button
                    onClick={() => handleStateTransition('ACTIVE', 'Resumed by operator')}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Resume Subscription
                  </button>
                )}

                {['ACTIVE', 'PAUSED'].includes(selectedSub.status) && selectedSub.allowEarlyCancel && (
                  <button
                    onClick={() => handleStateTransition('CANCELLED', 'Cancelled by operator request')}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Subscription
                  </button>
                )}

                {selectedSub.allowRenewal && (
                  <button
                    onClick={handleRenew}
                    disabled={transitioning}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Renew Cycle
                  </button>
                )}

                {/* DEMO TRIGGER: Make Due */}
                <button
                  onClick={handleMakeDue}
                  disabled={transitioning}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1.5 ml-auto"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Force Due (Demo Test)
                </button>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Plan Cadence</span>
                <div className="text-sm font-bold text-slate-100 mt-0.5">{selectedSub.billingInterval}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Recurring Total</span>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">₹{selectedSub.totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Next Billing Date</span>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {format(new Date(selectedSub.nextBillingDate), 'yyyy-MM-dd')}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Payment Terms</span>
                <div className="text-sm font-bold text-slate-100 mt-0.5">{selectedSub.paymentTerms}</div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-200">Subscription Line Items</div>
              <div className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Discount</th>
                      <th className="p-2.5 text-right">Tax</th>
                      <th className="p-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {selectedSub.items?.map((it: any) => (
                      <tr key={it.id}>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-100">{it.productName}</div>
                          {it.variantName && <div className="text-[10px] text-slate-400">Variant: {it.variantName}</div>}
                        </td>
                        <td className="p-2.5 text-center">{it.quantity}</td>
                        <td className="p-2.5 text-right">₹{(it.unitPrice + it.variantPrice).toFixed(2)}</td>
                        <td className="p-2.5 text-right text-rose-400">-₹{it.discountAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-slate-400">₹{it.taxAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-100">₹{it.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chronological Audit Timeline */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-400" />
                <span>Subscription Lifecycle Timeline</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedSub.events?.map((ev: any) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400">{ev.eventType}</span>
                        <span className="text-[10px] text-slate-400">by {ev.actorName || 'System'}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">{ev.description}</p>
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
