import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
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
        <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const { summary, paidInvoices, partiallyPaidInvoices, unpaidInvoices, overdueInvoices, unallocatedPayments } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" />
            Financial Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time reconciliation of invoice obligations, partial collections, unallocated balances, and aging arrears.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fully Paid Invoices
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{summary.paidCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total settled accounts</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" /> Partially Paid Invoices
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{summary.partiallyPaidCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active partial settlements</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> Overdue Invoices
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{summary.overdueCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Past contractual due date</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-600" /> Unallocated Payments
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{summary.unallocatedPaymentsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Unmatched cash receipts</div>
        </div>
      </div>

      {/* 2x2 Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Invoices List */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Overdue Invoices Requiring Follow-Up</span>
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {overdueInvoices.length} Invoices
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {overdueInvoices.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No overdue invoices found.</div>
            ) : (
              overdueInvoices.map((inv: any) => (
                <div key={inv.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs hover:bg-slate-100/70 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-[11px] text-slate-600">{inv.customer.companyName}</div>
                    <div className="text-[10px] text-rose-600 font-medium mt-0.5">Due: {format(new Date(inv.dueDate), 'yyyy-MM-dd')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-rose-600 font-bold font-mono">₹{inv.balanceDue.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">Total: ₹{inv.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unmatched / Unallocated Payments */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-blue-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Unmatched Receipts & Available Balances</span>
            </h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {unallocatedPayments.length} Payments
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {unallocatedPayments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No unallocated payments found.</div>
            ) : (
              unallocatedPayments.map((p: any) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs hover:bg-slate-100/70 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-900">{p.paymentNumber}</div>
                    <div className="text-[11px] text-slate-600">{p.customer.companyName} • {p.method}</div>
                    {p.transactionReference && (
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">{p.transactionReference}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-blue-700 font-bold font-mono">₹{p.unallocatedAmount.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">Total: ₹{p.amount.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
