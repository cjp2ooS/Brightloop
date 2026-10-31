import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Package, Plus, RotateCw, Trash2, X } from 'lucide-react';

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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Product & Variant Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Base software and service offerings, add-on variant pricing tiers, and margin definitions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <RotateCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <span className="text-xs mt-2 block">Loading product catalogue...</span>
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl bg-white border border-slate-200/80 space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                      {p.productType}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{p.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Base Price</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">₹{p.salesPrice.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
              </div>

              {/* Variants Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Available Variants ({p.variants?.length || 0})
                </span>
                <div className="space-y-1">
                  {p.variants?.map((v: any) => (
                    <div
                      key={v.id}
                      className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-800 font-sans font-medium">{v.name}</span>
                      <span className="text-emerald-700 font-semibold">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateProduct}
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add New Product to Catalogue</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Enterprise Cloud Suite"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Product Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="SOFTWARE">Software</option>
                    <option value="SERVICE">Service</option>
                    <option value="HARDWARE">Hardware</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Base Sales Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description of product deliverables and capabilities..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Variants Builder */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Product Variants (PRD Section 5)</span>
                  <button
                    type="button"
                    onClick={handleAddVariantField}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Variant Name (e.g. Enterprise)"
                        value={v.name}
                        onChange={(e) => handleUpdateVariant(i, { name: e.target.value })}
                        required
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs"
                      />
                      <div className="flex items-center gap-1 w-32">
                        <span className="text-slate-400 font-mono">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Addl Price"
                          value={v.additionalPrice}
                          onChange={(e) =>
                            handleUpdateVariant(i, { additionalPrice: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                        />
                      </div>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(i)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
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
