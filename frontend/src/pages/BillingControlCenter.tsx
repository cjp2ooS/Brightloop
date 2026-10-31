import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Activity,
  Play,
  RotateCw,
  AlertOctagon,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
  Percent,
  History,
  Layers,
} from 'lucide-react';

export const BillingControlCenter: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [retryMsg, setRetryMsg] = useState<string | null>(null);

  useEffect(() => {
    loadControlCenter();
  }, []);

  const loadControlCenter = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/billing/control-center');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBilling = async (subscriptionId?: string) => {
    try {
      setTriggering(true);
      setRunResult(null);
      setRetryMsg(null);
      const res = await apiRequest('/billing/trigger', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId }),
      });
      setRunResult(res.result);
      await loadControlCenter();
    } catch (err: any) {
      alert(`Billing run error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleRetryAttempt = async (attemptId: string) => {
    try {
      setTriggering(true);
      const res = await apiRequest(`/billing/retry-attempt/${attemptId}`, {
        method: 'POST',
      });
      setRetryMsg(res.message);
      await loadControlCenter();
    } catch (err: any) {
      alert(`Retry error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Loading Billing Control Centre...</span>
        </div>
      </div>
    );
  }

  const {
    dueSubscriptions,
    upcomingRenewals,
    failedAttempts,
    invoiceMetrics,
    paymentMetrics,
    expiringDiscounts,
  } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Master Trigger */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/40">
        <div>
          <div className="flex items-center gap-2 text-amber-400">
            <Activity className="w-5 h-5" />
            <span className="text-xs uppercase font-extrabold tracking-wider">Operational Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">Billing Control Centre</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time scheduler monitoring, due subscription processing, failure containment, and automated invoice dispatch.
          </p>
        </div>

        <button
          onClick={() => handleTriggerBilling()}
          disabled={triggering}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          {triggering ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Processing Engine...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Trigger Recurring Billing Run</span>
            </>
          )}
        </button>
      </div>

      {/* Execution Result Banner */}
      {runResult && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-slate-100">
                Run {runResult.runNumber} Executed: Status {runResult.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 space-x-3">
              <span className="text-emerald-400 font-semibold">{runResult.successCount} Invoices Created</span>
              <span className="text-blue-400 font-semibold">{runResult.skippedCount} Skipped (Idempotent)</span>
              {runResult.failedCount > 0 && (
                <span className="text-rose-400 font-semibold">{runResult.failedCount} Failed</span>
              )}
            </div>
          </div>
          {runResult.details?.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pt-2 border-t border-slate-800 text-xs">
              {runResult.details.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-300 font-medium">
                    {d.subscriptionNumber} ({d.customerName})
                  </span>
                  <div className="flex items-center gap-3">
                    {d.invoiceNumber && <span className="text-emerald-400 font-mono">{d.invoiceNumber} (₹{d.amount})</span>}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      d.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {d.status}
                    </span>
                    {d.reason && <span className="text-[11px] text-slate-400">{d.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {retryMsg && (
        <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{retryMsg}</span>
        </div>
      )}

      {/* Control Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Due Subscriptions Today
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{dueSubscriptions.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for invoice generation</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" /> Failed Billing Attempts
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">{failedAttempts.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Requiring intervention or retry</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Upcoming Renewals (7d)
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{upcomingRenewals.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Upcoming recurring billing events</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Overdue Invoices
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{invoiceMetrics.overdueCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unpaid past payment due date</div>
        </div>
      </div>

      {/* Main Interactive Sections: Due Subscriptions & Failed Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Subscriptions Table */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Due Subscriptions Scheduled For Billing</span>
              </h2>
              <p className="text-[11px] text-slate-400">Subscriptions where next billing date has arrived</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {dueSubscriptions.length} Due
            </span>
          </div>

          {dueSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
              No subscriptions currently due. All cycles are up to date!
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {dueSubscriptions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200">{sub.subscriptionNumber}</div>
                    <div className="text-[11px] text-slate-400">{sub.customer?.companyName}</div>
                    <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                      ₹{sub.totalAmount.toLocaleString('en-IN')} / {sub.billingInterval.toLowerCase()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTriggerBilling(sub.id)}
                    disabled={triggering}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
                  >
                    Bill Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Failed Billing Attempts & Safe Retry */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Failed Billing Operations</span>
              </h2>
              <p className="text-[11px] text-slate-400">Failures trapped by the engine with safe idempotent retry</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
              {failedAttempts.length} Failed
            </span>
          </div>

          {failedAttempts.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-400 border border-dashed border-emerald-900/40 bg-emerald-950/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
              Zero failed billing operations! The engine is running with 100% operational health.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {failedAttempts.map((att: any) => (
                <div
                  key={att.id}
                  className="p-3 rounded-lg bg-slate-950 border border-rose-900/50 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-rose-300">{att.subscription?.subscriptionNumber}</div>
                    <div className="text-[11px] text-slate-400">{att.subscription?.customer?.companyName}</div>
                    <div className="text-[10px] text-rose-400 mt-1 max-w-xs truncate">{att.errorMessage}</div>
                  </div>
                  <button
                    onClick={() => handleRetryAttempt(att.id)}
                    disabled={triggering}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" /> Retry Safe
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Operational Modules: Partially Paid Invoices & Unallocated Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Partially Paid Invoices */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Partially Paid Invoices</span>
            </h2>
            <span className="text-xs text-slate-400">{paymentMetrics.partiallyPaid.length} Records</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {paymentMetrics.partiallyPaid.map((inv: any) => (
              <div key={inv.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-400">{inv.customer.companyName}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold">Due: ₹{inv.balanceDue.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-400">Paid: ₹{inv.amountPaid.toLocaleString('en-IN')} of ₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unallocated Payments */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Unallocated Payments Awaiting Allocation</span>
            </h2>
            <span className="text-xs text-slate-400">{paymentMetrics.unallocatedPayments.length} Records</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {paymentMetrics.unallocatedPayments.map((p: any) => (
              <div key={p.id} className="p-3 rounded-lg bg-slate-950 border border-purple-900/40 flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{p.paymentNumber}</div>
                  <div className="text-[11px] text-slate-400">{p.customer.companyName} • {p.method}</div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-bold">Unallocated: ₹{p.unallocatedAmount.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-400">Total: ₹{p.amount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
