import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  Plus,
  RotateCw,
} from 'lucide-react';
import { format } from 'date-fns';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [txnRef, setTxnRef] = useState('');
  const [notes, setNotes] = useState('');

  // Allocation modal
  const [allocatingPayment, setAllocatingPayment] = useState<any>(null);
  const [allocInvoiceId, setAllocInvoiceId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pmts, custs, invs] = await Promise.all([
        apiRequest('/payments'),
        apiRequest('/customers'),
        apiRequest('/invoices?paymentStatus=UNPAID,PARTIALLY_PAID'),
      ]);
      setPayments(pmts);
      setCustomers(custs);
      setInvoices(invs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          invoiceId: selectedInvoiceId || undefined,
          amount: parseFloat(amount),
          method,
          transactionReference: txnRef || undefined,
          notes: notes || undefined,
        }),
      });
      setShowModal(false);
      setAmount('');
      setTxnRef('');
      setNotes('');
      await loadData();
    } catch (err: any) {
      alert(`Payment recording error: ${err.message}`);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingPayment || !allocInvoiceId || !allocAmount) return;

    try {
      await apiRequest(`/payments/${allocatingPayment.id}/allocate`, {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: allocInvoiceId,
          amount: parseFloat(allocAmount),
        }),
      });
      setAllocatingPayment(null);
      setAllocAmount('');
      await loadData();
    } catch (err: any) {
      alert(`Allocation error: ${err.message}`);
    }
  };

  const handleReverse = async (id: string) => {
    const reason = prompt('Enter the auditable reason for payment reversal:');
    if (!reason) return;

    try {
      await apiRequest(`/payments/${id}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      await loadData();
    } catch (err: any) {
      alert(`Reversal error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Operations & Allocations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-method collections, partial settlement matching, and auditable financial reversals.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Payment #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Method & Ref</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Allocated</th>
              <th className="py-3 px-4">Unallocated</th>
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
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No payment records found.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{p.paymentNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{p.customer?.companyName}</td>
                  <td className="py-3.5 px-4 text-slate-500">{format(new Date(p.paymentDate), 'yyyy-MM-dd')}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-800 font-medium">{p.method}</span>
                    {p.transactionReference && (
                      <span className="text-[10px] text-slate-500 block font-mono">{p.transactionReference}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">₹{p.amount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-600">₹{p.allocatedAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-purple-600">₹{p.unallocatedAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'ALLOCATED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'PARTIALLY_ALLOCATED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : p.status === 'REVERSED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {p.unallocatedAmount > 0 && p.status !== 'REVERSED' && (
                      <button
                        onClick={() => {
                          setAllocatingPayment(p);
                          setAllocAmount(p.unallocatedAmount.toString());
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-semibold"
                      >
                        Allocate
                      </button>
                    )}
                    {p.status !== 'REVERSED' && (
                      <button
                        onClick={() => handleReverse(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-medium"
                      >
                        Reverse
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Record Received Payment</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedInvoiceId('');
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Allocate Immediately to Invoice (Optional)</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) setAmount(inv.balanceDue.toString());
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="">Do not allocate immediately (leave unallocated)</option>
                  {invoices
                    .filter((inv) => !selectedCustomerId || inv.customerId === selectedCustomerId)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - Balance Due: ₹{inv.balanceDue.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="4000.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI (Unified Payments)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="e.g. UTR / Bank Slip Reference"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Allocate Unallocated Payment Modal */}
      {allocatingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAllocate}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Allocate Payment Balance</h2>
                <p className="text-xs text-purple-700 font-mono mt-0.5">
                  Available: ₹{allocatingPayment.unallocatedAmount.toFixed(2)}
                </p>
              </div>
              <button type="button" onClick={() => setAllocatingPayment(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Outstanding Invoice *</label>
                <select
                  value={allocInvoiceId}
                  onChange={(e) => setAllocInvoiceId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="">Select outstanding invoice...</option>
                  {invoices
                    .filter((inv) => inv.customerId === allocatingPayment.customerId)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} (Balance Due: ₹{inv.balanceDue.toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Allocation Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={allocatingPayment.unallocatedAmount}
                  required
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAllocatingPayment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs"
              >
                Apply Allocation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
