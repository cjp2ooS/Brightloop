import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Receipt,
  Download,
  Search,
  RotateCw,
  HelpCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [selectedExplanation, setSelectedExplanation] = useState<any>(null);

  useEffect(() => {
    loadInvoices();
  }, [paymentStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      let url = `/invoices?paymentStatus=${paymentStatus}`;
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Records & Settlement</h1>
          <p className="text-xs text-slate-500 mt-1">
            Auditable recurring invoices, itemized tax calculations, and printable PDF statements.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadInvoices()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span>Payment Status:</span>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
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
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <RotateCw className="w-4 h-4 animate-spin text-blue-600 mx-auto" />
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.customer?.companyName}</td>
                  <td className="py-3.5 px-4 text-slate-500">{format(new Date(inv.invoiceDate), 'yyyy-MM-dd')}</td>
                  <td className="py-3.5 px-4 text-slate-500">{format(new Date(inv.dueDate), 'yyyy-MM-dd')}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">₹{inv.totalAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-600">₹{inv.amountPaid.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600">₹{inv.balanceDue.toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => openExplanation(inv.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                      title="Explain Calculation"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Explain
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-black text-slate-900">{selectedExplanation.invoiceNumber}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculation snapshot breakdown for {selectedExplanation.customerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedExplanation(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Itemized Formula Breakdown
              </div>

              {selectedExplanation.items.map((it: any, idx: number) => (
                <div key={idx} className="space-y-1 pb-3 border-b border-slate-200/60 last:border-0">
                  <div className="font-semibold text-slate-900">{it.productName} {it.variantName ? `(${it.variantName})` : ''}</div>
                  <div className="grid grid-cols-2 gap-y-1 text-slate-600">
                    <span>Base plan price:</span>
                    <span className="text-right text-slate-800">₹{it.basePrice.toFixed(2)}</span>

                    {it.variantPrice > 0 && (
                      <>
                        <span>Variant additional:</span>
                        <span className="text-right text-slate-800">+₹{it.variantPrice.toFixed(2)}</span>
                      </>
                    )}

                    <span>Quantity:</span>
                    <span className="text-right text-slate-800">× {it.quantity}</span>

                    <span>Subtotal:</span>
                    <span className="text-right font-medium text-slate-900">₹{it.lineSubtotal.toFixed(2)}</span>

                    {it.discount > 0 && (
                      <>
                        <span>Discount applied:</span>
                        <span className="text-right text-rose-600">-₹{it.discount.toFixed(2)}</span>
                      </>
                    )}

                    <span>Taxable amount:</span>
                    <span className="text-right text-slate-800">₹{it.taxable.toFixed(2)}</span>

                    <span>GST (18%):</span>
                    <span className="text-right text-slate-800">+₹{it.tax.toFixed(2)}</span>

                    <span className="font-bold text-slate-900 pt-1 border-t border-slate-200">Line Total:</span>
                    <span className="text-right font-bold text-emerald-600 pt-1 border-t border-slate-200">₹{it.lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="text-slate-900 font-medium">₹{selectedExplanation.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Discount:</span>
                <span className="text-rose-600 font-medium">-₹{selectedExplanation.discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Tax (GST):</span>
                <span className="text-slate-900 font-medium">₹{selectedExplanation.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-blue-600">₹{selectedExplanation.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-semibold pt-1">
                <span>Amount Paid:</span>
                <span>₹{selectedExplanation.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs text-amber-600">
                <span>Balance Due:</span>
                <span>₹{selectedExplanation.balanceDue.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedExplanation(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              Close Explanation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
