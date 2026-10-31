import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Receipt,
  Download,
  RotateCw,
} from 'lucide-react';
import { format } from 'date-fns';

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const custs = await apiRequest('/customers');
      if (custs.length > 0) {
        setData(custs[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
    try {
      const token = localStorage.getItem('loopflow_token');
      const response = await fetch(`/api/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const subscriptions = data?.subscriptions || [];
  const invoices = data?.invoices || [];
  const totalOutstanding = invoices.reduce((acc: number, inv: any) => acc + inv.balanceDue, 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
            Self-Service Customer Portal
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Welcome, {data?.companyName || user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your subscriptions, download GST invoice receipts, and review payment settlements.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-right">
          <div className="text-[11px] text-slate-500">Total Outstanding Balance</div>
          <div className="text-2xl font-bold text-amber-600 font-mono mt-0.5">
            ₹{totalOutstanding.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Your Active Subscriptions</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 col-span-2">No active subscriptions.</div>
          ) : (
            subscriptions.map((sub: any) => (
              <div key={sub.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{sub.plan?.name}</span>
                    <span className="text-xs text-slate-500 block font-mono">{sub.subscriptionNumber}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sub.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Next Billing Date</span>
                    <span className="text-slate-700 font-medium">{format(new Date(sub.nextBillingDate), 'yyyy-MM-dd')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Recurring Total</span>
                    <span className="text-emerald-700 font-bold font-mono">₹{sub.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoices List with PDF Download */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Invoices & Statements</h2>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">No invoices available.</td>
                </tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="p-3 text-slate-500">{format(new Date(inv.invoiceDate), 'yyyy-MM-dd')}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{inv.totalAmount.toFixed(2)}</td>
                    <td className="p-3 font-mono text-emerald-600">₹{inv.amountPaid.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-amber-600">₹{inv.balanceDue.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold inline-flex items-center gap-1 text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
