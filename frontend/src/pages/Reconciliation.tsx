import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Receipt,
  RotateCw,
} from 'lucide-react';
import { format } from 'date-fns';

export const Reconciliation: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReconciliation();
  }, []);

  const loadReconciliation = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/payments/reconciliation');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <RotateCw className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const { summary, paidInvoices, partiallyPaidInvoices, unpaidInvoices, overdueInvoices, unallocatedPayments } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Financial Reconciliation Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time reconciliation of invoice obligations, partial collections, unallocated balances, and aging arrears.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Fully Paid Invoices
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{summary.paidCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total settled accounts</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Partially Paid Invoices
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{summary.partiallyPaidCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active partial settlements</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Overdue Invoices
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">{summary.overdueCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Past contractual due date</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" /> Unallocated Payments
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2">{summary.unallocatedPaymentsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unmatched cash receipts</div>
        </div>
      </div>

      {/* 2x2 Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Invoices List */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Overdue Invoices Requiring Follow-Up</span>
            </h2>
            <span className="text-xs text-slate-400">{overdueInvoices.length} Invoices</span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {overdueInvoices.map((inv: any) => (
              <div key={inv.id} className="p-3 bg-slate-950 border border-rose-900/40 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-400">{inv.customer.companyName}</div>
                  <div className="text-[10px] text-rose-400 mt-0.5">Due since: {format(new Date(inv.dueDate), 'yyyy-MM-dd')}</div>
                </div>
                <div className="text-right">
                  <div className="text-rose-400 font-bold font-mono">₹{inv.balanceDue.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">Total: ₹{inv.totalAmount.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unmatched / Unallocated Payments */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-purple-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Unmatched Receipts & Available Balances</span>
            </h2>
            <span className="text-xs text-slate-400">{unallocatedPayments.length} Payments</span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {unallocatedPayments.map((p: any) => (
              <div key={p.id} className="p-3 bg-slate-950 border border-purple-900/40 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{p.paymentNumber}</div>
                  <div className="text-[11px] text-slate-400">{p.customer.companyName} • {p.method}</div>
                  {p.transactionReference && (
                    <div className="text-[10px] text-purple-300 font-mono mt-0.5">{p.transactionReference}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-bold font-mono">₹{p.unallocatedAmount.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">Total: ₹{p.amount.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
