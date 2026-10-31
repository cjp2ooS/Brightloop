import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  CreditCard,
  Plus,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ArrowRight,
  ShieldAlert,
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
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Payment Operations & Allocations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-method collections, partial settlement matching, and auditable financial reversals.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <RotateCw className="w-4 h-4 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No payment records found.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-400">{p.paymentNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{p.customer?.companyName}</td>
                  <td className="py-3.5 px-4 text-slate-400">{format(new Date(p.paymentDate), 'yyyy-MM-dd')}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-200 font-medium">{p.method}</span>
                    {p.transactionReference && (
                      <span className="text-[10px] text-slate-400 block font-mono">{p.transactionReference}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">₹{p.amount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400">₹{p.allocatedAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-purple-400">₹{p.unallocatedAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'ALLOCATED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'PARTIALLY_ALLOCATED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : p.status === 'REVERSED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
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
                        className="px-2.5 py-1 rounded bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 text-xs font-semibold"
                      >
                        Allocate
                      </button>
                    )}
                    {p.status !== 'REVERSED' && (
                      <button
                        onClick={() => handleReverse(p.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs font-medium"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100">Record Received Payment</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedInvoiceId('');
                  }}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Allocate Immediately to Invoice (Optional)</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) setAmount(inv.balanceDue.toString());
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
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
                  <label className="block text-slate-400 font-semibold mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="4000.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
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
                <label className="block text-slate-400 font-semibold mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="e.g. UTR / Bank Slip Reference"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Allocate Unallocated Payment Modal */}
      {allocatingPayment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAllocate}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100">Allocate Payment Balance</h2>
                <p className="text-xs text-purple-400 font-mono mt-0.5">
                  Available: ₹{allocatingPayment.unallocatedAmount.toFixed(2)}
                </p>
              </div>
              <button type="button" onClick={() => setAllocatingPayment(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Outstanding Invoice *</label>
                <select
                  value={allocInvoiceId}
                  onChange={(e) => setAllocInvoiceId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
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
                <label className="block text-slate-400 font-semibold mb-1">Allocation Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={allocatingPayment.unallocatedAmount}
                  required
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAllocatingPayment(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
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
