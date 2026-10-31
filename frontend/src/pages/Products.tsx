import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Package, Plus, RotateCw, Layers, Trash2 } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [productType, setProductType] = useState('SOFTWARE');
  const [description, setDescription] = useState('');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState<Array<{ name: string; additionalPrice: number; sku: string }>>([
    { name: 'Standard', additionalPrice: 0, sku: '' },
  ]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/products');
      setProducts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariantField = () => {
    setVariants((prev) => [...prev, { name: '', additionalPrice: 0, sku: '' }]);
  };

  const handleUpdateVariant = (index: number, updates: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          productType,
          description,
          salesPrice: parseFloat(salesPrice),
          costPrice: costPrice ? parseFloat(costPrice) : 0,
          notes,
          variants,
        }),
      });
      setShowModal(false);
      setName('');
      setDescription('');
      setSalesPrice('');
      setCostPrice('');
      setNotes('');
      setVariants([{ name: 'Standard', additionalPrice: 0, sku: '' }]);
      await loadProducts();
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Product & Variant Catalogue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Base offerings, add-on variant pricing matrices, and sales margin definitions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            <RotateCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {p.productType}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1.5">{p.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Base Price</span>
                    <span className="text-lg font-black text-slate-100 font-mono">₹{p.salesPrice.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
              </div>

              {/* Variants Breakdown */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Available Variants ({p.variants?.length || 0})
                </span>
                <div className="space-y-1">
                  {p.variants?.map((v: any) => (
                    <div
                      key={v.id}
                      className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-300 font-sans">{v.name}</span>
                      <span className="text-emerald-400">
                        {v.additionalPrice > 0 ? `+₹${v.additionalPrice.toFixed(2)}` : 'Included (₹0)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateProduct}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-100">Add New Product to Catalogue</h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Business Management Software"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Product Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  >
                    <option value="SOFTWARE">Software</option>
                    <option value="SERVICE">Service</option>
                    <option value="HARDWARE">Hardware</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Base Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    placeholder="2000.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="650.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              {/* Variants Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Product Variants & Add-on Prices</span>
                  <button
                    type="button"
                    onClick={handleAddVariantField}
                    className="text-blue-400 hover:text-blue-300 font-semibold text-xs"
                  >
                    + Add Variant
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Variant name (e.g. Odoo)"
                        value={v.name}
                        onChange={(e) => handleUpdateVariant(idx, { name: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                      <input
                        type="number"
                        placeholder="Add-on price (e.g. 560)"
                        value={v.additionalPrice}
                        onChange={(e) => handleUpdateVariant(idx, { additionalPrice: parseFloat(e.target.value) || 0 })}
                        className="w-32 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                      />
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
