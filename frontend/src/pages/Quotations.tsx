import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Layers,
  RotateCw,
  Clock,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

export const Quotations: React.FC = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New quotation modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('NET_30');
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quo, tmpl, cust, prod, pln] = await Promise.all([
        apiRequest('/quotations'),
        apiRequest('/quotations/templates'),
        apiRequest('/customers'),
        apiRequest('/products'),
        apiRequest('/plans'),
      ]);
      setQuotations(quo);
      setTemplates(tmpl);
      setCustomers(cust);
      setProducts(prod);
      setPlans(pln);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;

    if (tmpl.planId) setSelectedPlanId(tmpl.planId);
    setPaymentTerms(tmpl.paymentTerms);
    setValidityDays(tmpl.validityDays);
    if (tmpl.defaultNotes) setNotes(tmpl.defaultNotes);

    const mapped = tmpl.items.map((it: any) => {
      const p = products.find((prod) => prod.id === it.productId);
      const v = p?.variants.find((variant: any) => variant.id === it.variantId);
      return {
        productId: it.productId,
        productName: p?.name || 'Product',
        variantId: it.variantId || null,
        variantName: v?.name || null,
        unitPrice: p?.salesPrice || 0,
        variantPrice: v?.additionalPrice || 0,
        quantity: it.quantity || 1,
        discountPercentage: 0,
      };
    });
    setLineItems(mapped);
  };

  const addLineItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const defaultVariant = defaultProduct.variants?.[0];
    setLineItems((prev) => [
      ...prev,
      {
        productId: defaultProduct.id,
        productName: defaultProduct.name,
        variantId: defaultVariant?.id || null,
        variantName: defaultVariant?.name || null,
        unitPrice: defaultProduct.salesPrice,
        variantPrice: defaultVariant?.additionalPrice || 0,
        quantity: 1,
        discountPercentage: 0,
      },
    ]);
  };

  const updateLineItem = (index: number, updates: any) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || lineItems.length === 0) {
      alert('Please select a customer and add at least one line item.');
      return;
    }

    try {
      await apiRequest('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          planId: selectedPlanId || null,
          paymentTerms,
          validityDays,
          notes,
          items: lineItems,
        }),
      });
      setShowModal(false);
      setLineItems([]);
      await loadData();
    } catch (err: any) {
      alert(`Creation error: ${err.message}`);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await apiRequest(`/quotations/${id}/confirm`, { method: 'POST' });
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleConvert = async (id: string) => {
    try {
      const res = await apiRequest(`/quotations/${id}/convert`, { method: 'POST' });
      alert(res.message);
      await loadData();
    } catch (err: any) {
      alert(`Conversion error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Quotation Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build proposals, configure pricing discounts, and convert confirmed quotations into recurring subscriptions.
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            if (lineItems.length === 0) addLineItem();
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Create Quotation
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Quotation #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4">Subtotal</th>
              <th className="py-3 px-4">Discount</th>
              <th className="py-3 px-4">Tax (GST)</th>
              <th className="py-3 px-4">Total Amount</th>
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
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No quotations created yet.
                </td>
              </tr>
            ) : (
              quotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">{q.quotationNumber}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-100">{q.customer?.companyName}</td>
                  <td className="py-3.5 px-4 text-slate-300">{q.plan?.name || 'Custom'}</td>
                  <td className="py-3.5 px-4 font-mono">₹{q.subtotal.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-rose-400">-₹{q.discountTotal.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">₹{q.taxTotal.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">₹{q.totalAmount.toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'CONVERTED'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : q.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {q.status === 'QUOTATION' && (
                      <button
                        onClick={() => handleConfirm(q.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold"
                      >
                        Confirm
                      </button>
                    )}
                    {q.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleConvert(q.id)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                      >
                        Convert to Sub
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Quotation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateQuotation}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Create New Quotation</h2>
                <p className="text-xs text-slate-400">Configure customer items, variant adjustments, and discounts</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Template Quick Selection */}
            {templates.length > 0 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Use a Reusable Template:</span>
                <select
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Select template to autofill...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Customer Account *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.contactName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Associated Plan *</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="">Select plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.billingInterval})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_30">Net 30 Days</option>
                  <option value="DUE_ON_RECEIPT">Due Upon Receipt</option>
                </select>
              </div>
            </div>

            {/* Line items editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Line Items & Pricing Configuration</span>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-12 gap-3 items-center text-xs">
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newP = products.find((p) => p.id === e.target.value);
                            const newV = newP?.variants?.[0];
                            updateLineItem(idx, {
                              productId: newP.id,
                              productName: newP.name,
                              unitPrice: newP.salesPrice,
                              variantId: newV?.id || null,
                              variantName: newV?.name || null,
                              variantPrice: newV?.additionalPrice || 0,
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Variant</label>
                        <select
                          value={item.variantId || ''}
                          onChange={(e) => {
                            const v = prod?.variants.find((vr: any) => vr.id === e.target.value);
                            updateLineItem(idx, {
                              variantId: v?.id || null,
                              variantName: v?.name || null,
                              variantPrice: v?.additionalPrice || 0,
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                        >
                          <option value="">Standard (₹0)</option>
                          {prod?.variants.map((v: any) => (
                            <option key={v.id} value={v.id}>{v.name} (+₹{v.additionalPrice})</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, { quantity: parseInt(e.target.value, 10) || 1 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200 text-center"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercentage}
                          onChange={(e) => updateLineItem(idx, { discountPercentage: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200 text-center"
                        />
                      </div>

                      <div className="col-span-1 text-right pt-4">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Generate Quotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
