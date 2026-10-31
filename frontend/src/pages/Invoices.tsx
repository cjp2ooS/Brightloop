import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Receipt,
  Download,
  Search,
  RotateCw,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [selectedExplanation, setSelectedExplanation] = useState<any>(null);

  useEffect(() => {
    loadInvoices();
  }, [workflowStatus, paymentStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      let url = `/invoices?workflowStatus=${workflowStatus}&paymentStatus=${paymentStatus}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await apiRequest(url);
      setInvoices(res);
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('PDF download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const openExplanation = async (id: string) => {
    try {
      const res = await apiRequest(`/invoices/${id}/explanation`);
      setSelectedExplanation(res);
    } catch (err: any) {
      alert(`Error fetching invoice breakdown: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Invoice Records & Settlement</h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditable recurring invoices, itemized tax calculations, and printable PDF statements.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadInvoices()}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Payment:</span>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Invoice Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Paid</th>
              <th className="py-3 px-4">Balance Due</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <RotateCw className="w-4 h-4 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{inv.customer?.companyName}</td>
                  <td className="py-3.5 px-4 text-slate-400">{format(new Date(inv.invoiceDate), 'yyyy-MM-dd')}</td>
                  <td className="py-3.5 px-4 text-slate-400">{format(new Date(inv.dueDate), 'yyyy-MM-dd')}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">₹{inv.totalAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400">₹{inv.amountPaid.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">₹{inv.balanceDue.toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : inv.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => openExplanation(inv.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1"
                      title="Explain Calculation"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> Explain
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                      className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold inline-flex items-center gap-1"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Explanation Breakdown Modal (PRD Feature 15.B) */}
      {selectedExplanation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-black text-slate-100">{selectedExplanation.invoiceNumber}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculation snapshot breakdown for {selectedExplanation.customerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedExplanation(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Itemized Formula Breakdown
              </div>

              {selectedExplanation.items.map((it: any, idx: number) => (
                <div key={idx} className="space-y-1 pb-3 border-b border-slate-800/60 last:border-0">
                  <div className="font-semibold text-slate-200">{it.productName} {it.variantName ? `(${it.variantName})` : ''}</div>
                  <div className="grid grid-cols-2 gap-y-1 text-slate-400">
                    <span>Base plan price:</span>
                    <span className="text-right text-slate-200">₹{it.basePrice.toFixed(2)}</span>

                    {it.variantPrice > 0 && (
                      <>
                        <span>Variant additional:</span>
                        <span className="text-right text-slate-200">+₹{it.variantPrice.toFixed(2)}</span>
                      </>
                    )}

                    <span>Quantity:</span>
                    <span className="text-right text-slate-200">× {it.quantity}</span>

                    <span>Subtotal:</span>
                    <span className="text-right font-medium text-slate-200">₹{it.lineSubtotal.toFixed(2)}</span>

                    {it.discount > 0 && (
                      <>
                        <span>Discount applied:</span>
                        <span className="text-right text-rose-400">-₹{it.discount.toFixed(2)}</span>
                      </>
                    )}

                    <span>Taxable amount:</span>
                    <span className="text-right text-slate-200">₹{it.taxable.toFixed(2)}</span>

                    <span>GST (18%):</span>
                    <span className="text-right text-slate-200">+₹{it.tax.toFixed(2)}</span>

                    <span className="font-bold text-slate-100 pt-1 border-t border-slate-800">Line Total:</span>
                    <span className="text-right font-bold text-emerald-400 pt-1 border-t border-slate-800">₹{it.lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="text-slate-200">₹{selectedExplanation.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Discount:</span>
                <span className="text-rose-400">-₹{selectedExplanation.discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Tax (GST):</span>
                <span className="text-slate-200">₹{selectedExplanation.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-100 pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="text-blue-400">₹{selectedExplanation.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 pt-1">
                <span>Amount Paid:</span>
                <span>₹{selectedExplanation.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs text-amber-400">
                <span>Balance Due:</span>
                <span>₹{selectedExplanation.balanceDue.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedExplanation(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              Close Explanation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
