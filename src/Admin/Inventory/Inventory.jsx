import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Logout from '../Logout';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border';

const Field = ({ label, required, children, span2 }) => (
  <div className={span2 ? 'sm:col-span-2' : ''}>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const formatType = (type) => {
  if (!type || typeof type !== 'string') return 'Unknown Type';
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default function Inventory() {
  // ── Product Types ──────────────────────────────────────────────
  const [newProductType, setNewProductType] = useState('');
  const [productTypes, setProductTypes] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState(null);

  // ── Brands ────────────────────────────────────────────────────
  const [newBrand, setNewBrand] = useState('');
  const [brands, setBrands] = useState([]);
  const [showDeleteBrandModal, setShowDeleteBrandModal] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);

  // ── Form State ────────────────────────────────────────────────
  const [productType, setProductType] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [serialNum, setSerialNum] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [per, setPer] = useState('');
  const [discount, setDiscount] = useState('');
  const [description, setDescription] = useState('');
  const [boxCount, setBoxCount] = useState(1);
  const [isFree, setIsFree] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discountWarning, setDiscountWarning] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/brands`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch brands');
      setBrands(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch product types');
      setProductTypes(
        data
          .filter((item) => item && item.product_type && typeof item.product_type === 'string')
          .map((item) => item.product_type)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProductTypes();
    fetchBrands();
    const id = setInterval(fetchProductTypes, 180000);
    return () => clearInterval(id);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────
  const resetForm = () => {
    setSerialNum('');
    setProductName('');
    setPrice('');
    setPer('');
    setDiscount('');
    setDescription('');
    setBoxCount(1);
    setIsFree(false);
    setImages([]);
    setExistingImages([]);
    setDiscountWarning('');
  };

  const handleDiscountChange = (val) => {
    const num = parseFloat(val);
    if (val === '') {
      setDiscountWarning('');
      setDiscount('');
      return;
    }
    if (isNaN(num) || num < 0 || num > 100) {
      setDiscountWarning('Discount must be between 0 and 100%');
      setDiscount(num < 0 ? '0' : '100');
    } else {
      setDiscountWarning('');
      setDiscount(val);
    }
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'video/mp4', 'video/webm', 'video/ogg',
    ];
    const valid = [];
    for (const file of files) {
      if (!allowed.includes(file.type.toLowerCase())) {
        setError('Only JPG, PNG, GIF images and MP4, WebM, Ogg videos are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each file must be less than 5MB');
        return;
      }
      valid.push(file);
    }
    setError('');
    setImages(valid);
  };

  // ── Product Type CRUD ─────────────────────────────────────────
  const handleCreateProductType = async () => {
    if (!newProductType.trim()) { setError('Product type name is required'); return; }
    const formatted = newProductType.trim().toLowerCase().replace(/\s+/g, '_');
    if (productTypes.includes(formatted)) { setError('Product type already exists'); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: formatted }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to create product type');
      setProductTypes((prev) => [...prev, formatted]);
      setNewProductType('');
      setSuccess('Product type created successfully!');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProductType = async () => {
    if (!productTypeToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types/${productTypeToDelete}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to delete product type');
      setProductTypes((prev) => prev.filter((t) => t !== productTypeToDelete));
      setSuccess('Product type deleted successfully!');
      setError('');
      if (productType === productTypeToDelete) { setProductType(''); resetForm(); }
    } catch (err) {
      setError(err.message);
    } finally {
      setShowDeleteModal(false);
      setProductTypeToDelete(null);
    }
  };

  // ── Brand CRUD ────────────────────────────────────────────────
  const handleCreateBrand = async () => {
    if (!newBrand.trim()) { setError('Brand name is required'); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: newBrand.trim() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create brand');
      setBrands((prev) => [...prev, result]);
      setNewBrand('');
      setSuccess('Brand created successfully!');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/brands/${brandToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete brand');
      setBrands((prev) => prev.filter((b) => b.id !== brandToDelete.id));
      setSuccess('Brand deleted successfully!');
      setError('');
      if (selectedBrand === brandToDelete.brand_name) setSelectedBrand('');
    } catch (err) {
      setError(err.message);
    } finally {
      setShowDeleteBrandModal(false);
      setBrandToDelete(null);
    }
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setDiscountWarning('');

    if (!serialNum || !productName || !price || !per || !discount || !productType) {
      setError('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('serial_number', serialNum);
    formData.append('productname', productName);
    formData.append('price', price);
    formData.append('per', per);
    formData.append('discount', discount);
    formData.append('description', description || '');
    formData.append('product_type', productType);
    formData.append('brand', selectedBrand || '');
    formData.append('box_count', Math.max(1, parseInt(boxCount) || 1));
    formData.append('free', isFree ? 'true' : 'false');
    if (existingImages.length > 0)
      formData.append('existingImages', JSON.stringify(existingImages));
    images.forEach((file) => formData.append('images', file));

    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Failed to save product');
      setSuccess('Product saved successfully!');
      resetForm();
      setProductType('');
      setSelectedBrand('');
      event.target.reset();
    } catch (err) {
      setError(`Failed to save product: ${err.message}`);
    }
  };

  const renderMedia = (src, idx, sizeClass) => {
    const isVideo = typeof src === 'string' && src.includes('/video/');
    return isVideo ? (
      <video key={idx} src={src} controls className={`${sizeClass} object-cover rounded-lg inline-block`} />
    ) : (
      <img key={idx} src={src || '/placeholder.svg'} alt={`media-${idx}`} className={`${sizeClass} object-cover rounded-lg inline-block`} />
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Add Items</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Manage product types, brands and add inventory</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-800 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">
              ✓ {success}
            </div>
          )}

          {/* ── PRODUCT TYPES ───────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-7 mb-6 mobile:p-4">
            <h3 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
              Product Types
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-6">
              <Field label="Create New Product Type">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                    placeholder="Enter product type name"
                    className={inputCls}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), handleCreateProductType())
                    }
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCreateProductType}
                    className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 text-white shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200"
                  >
                    <FaPlus className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </Field>
            </div>

            {productTypes.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-8 text-center">
                <p className="text-slate-400 font-medium text-sm">No product types yet — create one above</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Existing Types ({productTypes.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {productTypes.map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 group hover:border-indigo-200 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-700 truncate">
                        {formatType(type)}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setProductTypeToDelete(type); setShowDeleteModal(true); }}
                        className="ml-2 flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── BRANDS ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-7 mb-6 mobile:p-4">
            <h3 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full inline-block" />
              Brands
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-6">
              <Field label="Create New Brand">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Enter brand name"
                    className={inputCls}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), handleCreateBrand())
                    }
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleCreateBrand}
                    className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-white shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-amber-500 transition-all duration-200"
                  >
                    <FaPlus className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </Field>
            </div>

            {brands.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-8 text-center">
                <p className="text-slate-400 font-medium text-sm">No brands yet — create one above</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Existing Brands ({brands.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 hover:border-amber-200 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-700 truncate">
                        {b.brand_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setBrandToDelete(b); setShowDeleteBrandModal(true); }}
                        className="ml-2 flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── ADD PRODUCT FORM ─────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-7 mb-6 mobile:p-4">
              <h3 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                Add Product
              </h3>

              {/* Product Type + Brand selectors — always visible */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-5">
                <Field label="Select Product Type" required>
                  <select
                    value={productType}
                    onChange={(e) => { setProductType(e.target.value); resetForm(); setError(''); setSuccess(''); }}
                    className={inputCls}
                  >
                    <option value="">Select a type...</option>
                    {productTypes.map((type) => (
                      <option key={type} value={type}>{formatType(type)}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Brand">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select a brand...</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.brand_name}>{b.brand_name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Rest of form — shown only when product type is selected */}
              {productType && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Serial Number" required>
                    <input
                      type="text"
                      value={serialNum}
                      onChange={(e) => setSerialNum(e.target.value)}
                      placeholder="e.g. SN-001"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Product Name" required>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Ground Chakkar"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Price (₹)" required>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Per" required>
                    <select value={per} onChange={(e) => setPer(e.target.value)} className={inputCls}>
                      <option value="">Select unit...</option>
                      <option value="pieces">Pieces</option>
                      <option value="box">Box</option>
                      <option value="pkt">Pkt</option>
                    </select>
                  </Field>

                  <Field label="Discount (%)" required>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={discount}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        placeholder="0"
                        className={`${inputCls} ${discountWarning ? 'border-red-400' : ''}`}
                      />
                      {discountWarning && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{discountWarning}</p>
                      )}
                    </div>
                  </Field>

                  <Field label="Box Count">
                    <input
                      type="number"
                      min="1"
                      value={boxCount}
                      onChange={(e) => setBoxCount(e.target.value)}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Description" span2>
                    <textarea
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter product description..."
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  <Field label="Free">
                    <div className="flex items-center gap-3 h-10">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isFree}
                          onChange={(e) => setIsFree(e.target.checked)}
                        />
                        <div
                          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isFree ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div
                            className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${isFree ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </div>
                      </label>
                      <span className="text-sm font-medium text-slate-600">
                        {isFree ? 'On' : 'Off'}
                      </span>
                    </div>
                  </Field>

                  <Field label="Images / Videos" span2>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm,video/ogg"
                        multiple
                        onChange={handleImageChange}
                        className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-colors"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        JPG, PNG, GIF, MP4, WebM, Ogg — max 5MB each
                      </p>
                    </div>

                    {existingImages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Existing Media
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {existingImages.map((url, idx) => (
                            <div key={idx} className="relative">
                              {renderMedia(url, idx, 'h-20 w-20')}
                              <button
                                type="button"
                                onClick={() =>
                                  setExistingImages((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {images.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                          New Uploads
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {images.map((file, idx) => (
                            <div key={idx} className="relative">
                              {renderMedia(URL.createObjectURL(file), idx, 'h-20 w-20')}
                              <button
                                type="button"
                                onClick={() =>
                                  setImages((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Field>
                </div>
              )}
            </div>

            {productType && (
              <div className="flex justify-end gap-3 mb-8">
                <button
                  type="button"
                  onClick={() => { resetForm(); setProductType(''); setSelectedBrand(''); }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200"
                >
                  Save Product
                </motion.button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ── Delete Product Type Modal ─────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2.5">Delete Product Type?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete{' '}
                <strong className="text-slate-800">"{formatType(productTypeToDelete)}"</strong>?
                This cannot be undone.
              </p>
              <div className="flex gap-2.5 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Keep It
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteProductType}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-500 transition-all duration-200"
                >
                  Yes, Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Brand Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteBrandModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4"
            onClick={() => setShowDeleteBrandModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2.5">Delete Brand?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to delete{' '}
                <strong className="text-slate-800">"{brandToDelete?.brand_name}"</strong>?
                This cannot be undone.
              </p>
              <div className="flex gap-2.5 justify-center">
                <button
                  onClick={() => setShowDeleteBrandModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  Keep It
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteBrand}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-500 transition-all duration-200"
                >
                  Yes, Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}