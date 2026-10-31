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
  Receipt,
  CreditCard,
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
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500">Loading Billing Control Centre...</span>
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
  } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Master Trigger */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-700">
            <Activity className="w-5 h-5 text-amber-600" />
            <span className="text-xs uppercase font-extrabold tracking-wider">Operational Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Billing Control Centre</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time scheduler monitoring, due subscription processing, failure containment, and automated invoice dispatch.
          </p>
        </div>

        <button
          onClick={() => handleTriggerBilling()}
          disabled={triggering}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02] disabled:opacity-50"
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
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-slate-900">
                Run {runResult.runNumber} Executed: Status {runResult.status}
              </span>
            </div>
            <div className="text-xs space-x-3 font-semibold">
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {runResult.successCount} Invoices Created
              </span>
              <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                {runResult.skippedCount} Skipped (Idempotent)
              </span>
              {runResult.failedCount > 0 && (
                <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  {runResult.failedCount} Failed
                </span>
              )}
            </div>
          </div>
          {runResult.details?.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pt-2 border-t border-slate-100 text-xs">
              {runResult.details.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 border-b border-slate-100 last:border-0">
                  <span className="text-slate-800 font-medium">
                    {d.subscriptionNumber} ({d.customerName})
                  </span>
                  <div className="flex items-center gap-3">
                    {d.invoiceNumber && <span className="text-emerald-700 font-mono font-semibold">{d.invoiceNumber} (₹{d.amount})</span>}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      d.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {d.status}
                    </span>
                    {d.reason && <span className="text-[11px] text-slate-500">{d.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {retryMsg && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{retryMsg}</span>
        </div>
      )}

      {/* Control Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Due Today
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{dueSubscriptions.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready for invoice generation</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" /> Failed Attempts
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{failedAttempts.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requiring intervention or retry</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Renewals (7d)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{upcomingRenewals.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Upcoming recurring billing events</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Overdue Invoices
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{invoiceMetrics.overdueCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Unpaid past payment due date</div>
        </div>
      </div>

      {/* Main Interactive Sections: Due Subscriptions & Failed Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Subscriptions Table */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Due Subscriptions Scheduled For Billing</span>
              </h2>
              <p className="text-[11px] text-slate-500">Subscriptions where next billing date has arrived</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {dueSubscriptions.length} Due
            </span>
          </div>

          {dueSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No subscriptions currently due. All cycles are up to date!
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {dueSubscriptions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{sub.subscriptionNumber}</div>
                    <div className="text-[11px] text-slate-600">{sub.customer?.companyName}</div>
                    <div className="text-[10px] text-blue-700 font-mono mt-0.5 font-semibold">
                      ₹{sub.totalAmount.toLocaleString('en-IN')} / {sub.billingInterval.toLowerCase()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTriggerBilling(sub.id)}
                    disabled={triggering}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-2xs transition-all"
                  >
                    Bill Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Failed Billing Attempts & Safe Retry */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Failed Billing Operations</span>
              </h2>
              <p className="text-[11px] text-slate-500">Failures trapped by the engine with safe idempotent retry</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              {failedAttempts.length} Failed
            </span>
          </div>

          {failedAttempts.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-800 border border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
              Zero failed billing operations! The engine is running with 100% operational health.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {failedAttempts.map((att: any) => (
                <div
                  key={att.id}
                  className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="text-xs font-bold text-rose-900">{att.subscription?.subscriptionNumber}</div>
                    <div className="text-[11px] text-slate-600">{att.subscription?.customer?.companyName}</div>
                    <div className="text-[10px] text-rose-700 mt-1 max-w-xs truncate">{att.errorMessage}</div>
                  </div>
                  <button
                    onClick={() => handleRetryAttempt(att.id)}
                    disabled={triggering}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
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
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Partially Paid Invoices</span>
            </h2>
            <span className="text-xs text-slate-500">{paymentMetrics.partiallyPaid.length} Records</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {paymentMetrics.partiallyPaid.map((inv: any) => (
              <div key={inv.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-500">{inv.customer.companyName}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-700 font-bold font-mono">Due: ₹{inv.balanceDue.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-500">Paid: ₹{inv.amountPaid.toLocaleString('en-IN')} of ₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unallocated Payments */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Unallocated Payments Awaiting Allocation</span>
            </h2>
            <span className="text-xs text-slate-500">{paymentMetrics.unallocatedPayments.length} Records</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {paymentMetrics.unallocatedPayments.map((p: any) => (
              <div key={p.id} className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{p.paymentNumber}</div>
                  <div className="text-[11px] text-slate-600">{p.customer.companyName} • {p.method}</div>
                </div>
                <div className="text-right">
                  <div className="text-purple-700 font-bold font-mono">Unallocated: ₹{p.unallocatedAmount.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-500">Total: ₹{p.amount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
