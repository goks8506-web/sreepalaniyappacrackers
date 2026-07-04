import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';
import '../../App.css';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaEdit, FaArrowRight, FaTrash, FaDownload, FaSearch, FaCamera } from 'react-icons/fa';
import Select, { components } from 'react-select';
import Tesseract from 'tesseract.js';
import Webcam from 'react-webcam';

Modal.setAppElement("#root");

const selectStyles = {
  control: (base, { isFocused }) => ({
    ...base,
    padding: "0.2rem 0.4rem",
    fontSize: "0.95rem",
    borderRadius: "10px",
    background: "#fff",
    borderColor: isFocused ? "#6366f1" : "#e2e8f0",
    boxShadow: isFocused ? "0 0 0 3px rgba(99,102,241,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
    transition: "all 0.2s",
    "&:hover": { borderColor: "#6366f1" },
  }),
  menu: (base) => ({ ...base, zIndex: 50, borderRadius: "10px", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", overflow: "hidden" }),
  singleValue: (base) => ({ ...base, color: "#1e293b", fontWeight: 500 }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    background: isSelected ? "#6366f1" : isFocused ? "#f0f0ff" : "#fff",
    color: isSelected ? "#fff" : "#1e293b",
    fontWeight: isFocused || isSelected ? 500 : 400,
    cursor: "pointer",
    padding: "0.8rem",
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  clearIndicator: (base) => ({ ...base, color: "#94a3b8", "&:hover": { color: "#ef4444" } }),
};

const Spinner = ({ white = false }) => (
  <span className={`inline-block w-4 h-4 border-[3px] rounded-full animate-spin ${white ? "border-white/30 border-t-white" : "border-indigo-200 border-t-indigo-500"}`} />
);

class DirectErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("DirectErrorBoundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
        An error occurred: {this.state.error?.message || 'Unknown error'}. Please refresh.
      </div>
    );
    return this.props.children;
  }
}

class QuotationTableErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("QuotationTableErrorBoundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
        Error rendering quotation table. Please try again.
      </div>
    );
    return this.props.children;
  }
}

const getEffectivePrice = (item) => Math.round(Number(item.price) || 0);

const styles = { input: {}, button: {}, card: {} };

const SummaryChip = ({ label, value, color, large }) => {
  const colorMap = {
    "#64748b": "text-slate-500",
    "#10b981": "text-emerald-500",
    "#f59e0b": "text-amber-500",
    "#94a3b8": "text-slate-400",
    "#6366f1": "text-indigo-500",
  };
  const textColor = colorMap[color] || "text-slate-600";
  return (
    <div className="text-right">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`font-bold ${large ? "text-xl" : "text-sm"} ${textColor}`}>{value}</div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    pending: "text-amber-500 bg-amber-50 border-amber-200",
    booked: "text-emerald-600 bg-emerald-50 border-emerald-200",
    cancelled: "text-red-500 bg-red-50 border-red-200",
  };
  const icons = { pending: "⏳ Pending", booked: "✓ Booked", cancelled: "✕ Cancelled" };
  const cls = map[status] || "text-slate-400 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {icons[status] || status}
    </span>
  );
};

const QuotActionBtn = ({ label, onClick, disabled, color, loading = false }) => {
  const colorMap = {
    "#f59e0b": {
      idle: "bg-amber-50 text-amber-500 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500",
      off: "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed",
    },
    "#10b981": {
      idle: "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500",
      off: "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed",
    },
    "#ef4444": {
      idle: "bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500",
      off: "bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed",
    },
  };
  const variant = colorMap[color] || colorMap["#6366f1"];
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${disabled || loading ? variant.off : variant.idle}`}
    >
      {loading ? <Spinner /> : label}
    </button>
  );
};

const PaginBtn = ({ label, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all duration-150
      ${active ? "bg-indigo-600 border-indigo-600 text-white"
      : disabled ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
        : "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:text-indigo-600"}`}
  >
    {label}
  </button>
);

const CustomOption = (props) => {
  const { data, innerRef, innerProps, isFocused, isSelected, selectProps } = props;
  const { onAddToCart, cart } = selectProps;
  const cartItem = cart && cart.find(item => `${item.id}-${item.product_type}` === data.value);
  const qty = cartItem ? cartItem.quantity : 0;

  return (
    <div
      ref={innerRef}
      {...innerProps}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: isSelected ? "#6366f1" : isFocused ? "#f0f0ff" : "#fff",
        color: isSelected ? "#fff" : "#1e293b",
        cursor: "pointer",
        gap: "8px",
      }}
    >
      <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: isFocused || isSelected ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {data.label}
      </span>
      <div
        style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {qty > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart && onAddToCart(data.value, "minus"); }}
              style={{
                width: "22px", height: "22px", borderRadius: "50%", border: "1.5px solid",
                borderColor: isSelected ? "rgba(255,255,255,0.6)" : "#e2e8f0",
                background: isSelected ? "rgba(255,255,255,0.15)" : "#fff",
                color: isSelected ? "#fff" : "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: "bold", cursor: "pointer", lineHeight: 1, flexShrink: 0,
              }}
            >−</button>
            <input
              type="number"
              value={qty}
              min="0"
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(data.value, "set", parseInt(e.target.value) || 0); }}
              style={{
                width: "38px", height: "24px", borderRadius: "6px", border: "1.5px solid",
                borderColor: isSelected ? "rgba(255,255,255,0.5)" : "#c7d2fe",
                background: isSelected ? "rgba(255,255,255,0.2)" : "#eef2ff",
                color: isSelected ? "#fff" : "#4338ca",
                textAlign: "center", fontSize: "0.78rem", fontWeight: "700",
                outline: "none", padding: "0 2px",
              }}
            />
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart && onAddToCart(data.value, "plus"); }}
              style={{
                width: "22px", height: "22px", borderRadius: "50%", border: "1.5px solid",
                borderColor: isSelected ? "rgba(255,255,255,0.6)" : "#6366f1",
                background: isSelected ? "rgba(255,255,255,0.2)" : "#6366f1",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: "bold", cursor: "pointer", lineHeight: 1, flexShrink: 0,
              }}
            >+</button>
          </div>
        )}
        {qty === 0 && (
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart && onAddToCart(data.value, "plus"); }}
            style={{
              width: "26px", height: "26px", borderRadius: "50%", border: "1.5px solid",
              borderColor: isSelected ? "rgba(255,255,255,0.7)" : "#6366f1",
              background: isSelected ? "rgba(255,255,255,0.2)" : "#6366f1",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: "bold", cursor: "pointer", lineHeight: 1, flexShrink: 0,
            }}
          >+</button>
        )}
      </div>
    </div>
  );
};

const QuotationTable = ({
  cart = [], products = [], selectedProduct, setSelectedProduct,
  addToCart, updateQuantity, updateDiscount, updatePrice, removeFromCart,
  calculateNetRate, calculateYouSave, calculateProcessingFee, calculateTotal,
  isModal = false, additionalDiscount, setAdditionalDiscount,
  changeDiscount, setChangeDiscount, openNewProductModal,
  lastAddedProduct, setLastAddedProduct, setCart, setModalCart,
}) => {
  const quantityInputRefs = useRef({});
  const productSelectRef = useRef(null);

  useEffect(() => {
    if (lastAddedProduct) {
      const key = `${lastAddedProduct.id}-${lastAddedProduct.product_type}`;
      const input = quantityInputRefs.current[key];
      if (input) { input.focus(); input.select(); setLastAddedProduct(null); }
    }
  }, [lastAddedProduct, setLastAddedProduct]);

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); productSelectRef.current?.focus(); }
  };

  const handleChangeDiscount = (value) => {
    const newDiscount = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setChangeDiscount(newDiscount);
    const updatedCart = cart.map(item => ({ ...item, discount: item.initialDiscount === 0 ? 0 : newDiscount }));
    if (isModal) setModalCart(updatedCart); else setCart(updatedCart);
  };

  const handleOptionCartAction = useCallback((productValue, action, setValue) => {
    const [id, type] = productValue.split("-");
    const product = products.find(p => p.id.toString() === id && p.product_type === type);
    if (!product) return;
    const setTargetCart = isModal ? setModalCart : setCart;
    const currentDiscount = changeDiscount;

    setTargetCart(prev => {
      const exists = prev.find(item => item.id.toString() === id && item.product_type === type);
      if (action === "plus") {
        if (exists) {
          return prev.map(item => item.id.toString() === id && item.product_type === type ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
          const newItem = { ...product, id: product.id, price: Math.round(Number(product.price) || 0), quantity: 1, discount: parseFloat(product.discount) || currentDiscount, initialDiscount: parseFloat(product.discount) || 0, per: product.per || 'Unit' };
          return [...prev, newItem];
        }
      } else if (action === "minus") {
        if (!exists) return prev;
        if (exists.quantity <= 1) return prev.filter(item => !(item.id.toString() === id && item.product_type === type));
        return prev.map(item => item.id.toString() === id && item.product_type === type ? { ...item, quantity: item.quantity - 1 } : item);
      } else if (action === "set") {
        const qty = parseInt(setValue) || 0;
        if (!exists && qty > 0) {
          const newItem = { ...product, id: product.id, price: Math.round(Number(product.price) || 0), quantity: qty, discount: parseFloat(product.discount) || currentDiscount, initialDiscount: parseFloat(product.discount) || 0, per: product.per || 'Unit' };
          return [...prev, newItem];
        }
        if (qty <= 0) return prev.filter(item => !(item.id.toString() === id && item.product_type === type));
        return prev.map(item => item.id.toString() === id && item.product_type === type ? { ...item, quantity: qty } : item);
      }
      return prev;
    });
  }, [cart, products, isModal, setCart, setModalCart, changeDiscount]);

  const total = parseFloat(calculateTotal(cart, additionalDiscount));
  const cartInputCls = "w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 text-center bg-slate-50 outline-none focus:border-indigo-400 transition-colors";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <label className="block text-xs font-semibold text-amber-500 uppercase tracking-widest mb-2">
            Additional Discount (%)
          </label>
          <div className="relative">
            <input
              type="number"
              value={additionalDiscount || ''}
              onChange={(e) => setAdditionalDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
              placeholder="0"
              min="0" max="100" step="1"
              className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 outline-none focus:border-amber-400 transition-colors box-border"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">%</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
            Bulk Change Discount (%)
          </label>
          <div className="relative">
            <input
              type="number"
              value={changeDiscount || ''}
              onChange={(e) => handleChangeDiscount(e.target.value)}
              placeholder="0"
              min="0" max="100" step="1"
              className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">%</span>
          </div>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center">
          <div className="text-4xl mb-3">🛒</div>
          <p className="text-slate-400 font-medium text-sm">Cart is empty — search and add products above</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-slate-50 border-b-2 border-indigo-100">
                  {["#", "Product", "Price (₹)", "Discount", "Qty", "Total", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-3.5 py-3 text-xs font-bold text-indigo-500 uppercase tracking-widest whitespace-nowrap
                        ${i === 0 || i === 6 ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => {
                  const lineTotal = Math.round(getEffectivePrice(item) * (1 - item.discount / 100) * item.quantity);
                  return (
                    <tr
                      key={`${item.id}-${item.product_type}`}
                      className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors duration-150"
                    >
                      <td className="px-3.5 py-2.5 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-slate-800">{item.productname}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.product_type}{item.serial_number ? ` · ${item.serial_number}` : ""}</div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <input
                          type="number" value={getEffectivePrice(item)} min="0" step="1"
                          onChange={(e) => updatePrice(item.id, item.product_type, parseFloat(e.target.value) || 0, isModal)}
                          className={`${cartInputCls} focus:border-emerald-400`}
                        />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="relative inline-block">
                          <input
                            type="number" value={item.discount} min="0" max="100" step="0.01"
                            onChange={(e) => updateDiscount(item.id, item.product_type, parseFloat(e.target.value) || 0, isModal)}
                            className={`${cartInputCls} pr-6 focus:border-amber-400`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <input
                          type="number" value={item.quantity} min="0"
                          onChange={(e) => updateQuantity(item.id, item.product_type, parseInt(e.target.value) || 0, isModal)}
                          onKeyDown={handleQuantityKeyDown}
                          ref={(el) => (quantityInputRefs.current[`${item.id}-${item.product_type}`] = el)}
                          className={`${cartInputCls} focus:border-indigo-400`}
                        />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="font-bold text-slate-800">₹{lineTotal.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <button
                          onClick={() => removeFromCart(item.id, item.product_type, isModal)}
                          className="bg-red-50 border border-red-200 text-red-500 rounded-lg px-2.5 py-1.5 hundred:text-md hundred:w-20 mobile:w-8 mobile:text-xs font-bold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border-t-2 border-indigo-100 px-5 py-4">
            <div className="flex justify-end flex-wrap gap-6">
              <SummaryChip label="Net Rate" value={`₹${parseFloat(calculateNetRate(cart)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="#64748b" />
              <SummaryChip label="You Save" value={`₹${parseFloat(calculateYouSave(cart)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="#10b981" />
              {additionalDiscount > 0 && <SummaryChip label="Extra Discount" value={`${additionalDiscount}%`} color="#f59e0b" />}
              <SummaryChip label="Processing Fee (2.5%)" value={`₹${parseFloat(calculateProcessingFee(cart, additionalDiscount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="#94a3b8" />
              <SummaryChip label="Total" value={`₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="#6366f1" large />
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 border border-indigo-100 rounded-2xl p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-60">
            <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">
              Search Product
            </label>
            <Select
              ref={productSelectRef}
              value={selectedProduct}
              onChange={(option) => {
                if (!option) return setSelectedProduct(null);
                setSelectedProduct(option);
                const [id, type] = option.value.split("-");
                const product = products.find(p => p.id.toString() === id && p.product_type === type);
                if (!product) return;
                const setTargetCart = isModal ? setModalCart : setCart;
                const setTargetLastAddedProduct = isModal ? null : setLastAddedProduct;
                const currentDiscount = changeDiscount;
                const newItem = {
                  ...product,
                  id: product.id,
                  price: Math.round(Number(product.price) || 0),
                  quantity: 1,
                  discount: parseFloat(product.discount) || currentDiscount,
                  initialDiscount: parseFloat(product.discount) || 0,
                  per: product.per || 'Unit',
                };
                setTargetCart(prev => {
                  const exists = prev.find(item => item.id === product.id && item.product_type === product.product_type);
                  return exists
                    ? prev.map(item => item.id === product.id && item.product_type === product.product_type
                      ? { ...item, quantity: item.quantity + 1 } : item)
                    : [...prev, newItem];
                });
                if (setTargetLastAddedProduct) {
                  setTargetLastAddedProduct({ id: product.id, product_type: product.product_type });
                } else {
                  setLastAddedProduct({ id: product.id, product_type: product.product_type });
                }
                setSelectedProduct(null);
              }}
              options={products.map((p) => ({
                value: `${p.id}-${p.product_type}`,
                label: `${p.serial_number ? `[${p.serial_number}] ` : ''}${p.productname} · ${p.product_type} · ₹${getEffectivePrice(p)}`,
              }))}
              placeholder="Type to search products..."
              isClearable
              isSearchable
              styles={selectStyles}
              components={{ Option: CustomOption }}
              onAddToCart={handleOptionCartAction}
              cart={cart}
            />
          </div>
          <button
            onClick={() => openNewProductModal(isModal)}
            className="h-11 px-5 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-500 transition-all duration-200"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            Custom Product
          </button>
        </div>
      </div>
    </div>
  );
};

const FormFields = ({
  isEdit, customers, modalSelectedCustomer, setModalSelectedCustomer,
  modalCart, setModalCart, products, modalSelectedProduct, setModalSelectedProduct,
  addToCart, updateQuantity, updateDiscount, updatePrice, removeFromCart,
  calculateNetRate, calculateYouSave, calculateProcessingFee, calculateTotal,
  handleSubmit, closeModal, modalAdditionalDiscount, setModalAdditionalDiscount,
  modalChangeDiscount, setModalChangeDiscount, openNewProductModal,
  modalLastAddedProduct, setModalLastAddedProduct, submitLoading,
}) => (
  <div className="space-y-5">
    <div>
      <label className="block text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">
        Customer
      </label>
      <Select
        value={modalSelectedCustomer}
        onChange={setModalSelectedCustomer}
        options={customers.map((c) => ({
          value: c.id.toString(),
          label: `${c.name} (${c.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : c.customer_type || "User"} - ${c.district || "N/A"})`,
        }))}
        placeholder="Search for a customer..."
        isClearable
        styles={selectStyles}
      />
    </div>
    <QuotationTableErrorBoundary>
      <QuotationTable
        cart={modalCart} setCart={setModalCart} setModalCart={setModalCart}
        products={products || []} selectedProduct={modalSelectedProduct}
        setSelectedProduct={setModalSelectedProduct} addToCart={addToCart}
        updateQuantity={updateQuantity} updateDiscount={updateDiscount}
        updatePrice={updatePrice} removeFromCart={removeFromCart}
        calculateNetRate={calculateNetRate} calculateYouSave={calculateYouSave}
        calculateProcessingFee={calculateProcessingFee} calculateTotal={calculateTotal}
        styles={styles} isModal={true}
        additionalDiscount={modalAdditionalDiscount} setAdditionalDiscount={setModalAdditionalDiscount}
        changeDiscount={modalChangeDiscount} setChangeDiscount={setModalChangeDiscount}
        openNewProductModal={openNewProductModal}
        lastAddedProduct={modalLastAddedProduct} setLastAddedProduct={setModalLastAddedProduct}
      />
    </QuotationTableErrorBoundary>
    <div className="flex justify-end gap-2.5 pt-2">
      <button
        onClick={closeModal}
        disabled={submitLoading}
        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={!modalSelectedCustomer || !modalCart.length || submitLoading}
        className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center gap-2
          ${!modalSelectedCustomer || !modalCart.length || submitLoading
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : isEdit
              ? "bg-gradient-to-br from-amber-500 to-amber-400 shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-amber-500"
              : "bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500"
          }`}
      >
        {submitLoading ? <><Spinner white />{isEdit ? "Updating..." : "Confirming..."}</> : (isEdit ? "Update Quotation" : "Confirm Booking")}
      </button>
    </div>
  </div>
);

const NewProductModal = ({ isOpen, onClose, onSubmit, newProductData, setNewProductData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localProductData, setLocalProductData] = useState(newProductData);

  useEffect(() => { setLocalProductData(newProductData); }, [newProductData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...localProductData,
      [name]: ['price', 'discount', 'quantity'].includes(name) ? (value === '' ? '' : parseFloat(value) || 0) : value,
    };
    setLocalProductData(updatedData);
    setNewProductData(updatedData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try { await onSubmit(localProductData); onClose(); }
    catch (err) { console.error('NewProductModal error:', err); }
    finally { setIsSubmitting(false); }
  };

  const fields = [
    { name: "productname", label: "Product Name", type: "text", placeholder: "e.g. Ground Chakkar", required: true, full: true },
    { name: "price", label: "Price (₹)", type: "number", placeholder: "0", min: 0, step: 1, required: true },
    { name: "discount", label: "Discount (%)", type: "number", placeholder: "0", min: 0, max: 100, step: 0.01 },
    { name: "quantity", label: "Quantity", type: "number", placeholder: "1", min: 1, step: 1, required: true },
    { name: "per", label: "Unit", type: "text", placeholder: "Box / Piece" },
    { name: "product_type", label: "Product Type", type: "text", placeholder: "custom", required: true },
  ];

  const isValid = localProductData.productname && localProductData.price !== '' && localProductData.quantity !== '' && localProductData.product_type;

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black/50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        <h2 className="text-xl font-extrabold text-slate-800 mb-6 text-center">✦ Add Custom Product</h2>
        <div className="grid grid-cols-2 gap-3.5">
          {fields.map(({ name, label, type, placeholder, min, max, step, required, full }) => (
            <div key={name} className={full ? "col-span-2" : "col-span-1"}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                name={name} type={type} value={localProductData[name] || ''} onChange={handleInputChange}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
                {...(min !== undefined ? { min } : {})} {...(max !== undefined ? { max } : {})} {...(step !== undefined ? { step } : {})}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 mt-6 justify-end">
          <button
            onClick={onClose} disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={isSubmitting || !isValid}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center gap-2
              ${isSubmitting || !isValid
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-500"
              }`}
          >
            {isSubmitting ? <><Spinner white />Adding...</> : "Add to Cart"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const CancelConfirmModal = ({ isOpen, onClose, onConfirm, quotationId, loading = false }) => (
  <Modal isOpen={isOpen} onRequestClose={onClose} className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black/50">
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-lg font-extrabold text-slate-800 mb-2.5">Cancel Quotation?</h3>
      <p className="text-slate-500 text-sm mb-6">
        Are you sure you want to cancel <strong className="text-slate-800">{quotationId}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-2.5 justify-center">
        <button
          onClick={onClose} disabled={loading}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Keep It
        </button>
        <button
          onClick={onConfirm} disabled={loading}
          className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-500 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <><Spinner white />Cancelling...</> : "Yes, Cancel"}
        </button>
      </div>
    </div>
  </Modal>
);

const PDFDownloadConfirmModal = ({ isOpen, onClose, onYes, fileName }) => (
  <Modal isOpen={isOpen} onRequestClose={onClose} className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black/50">
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
      <div className="text-5xl mb-4">📄</div>
      <h3 className="text-lg font-extrabold text-slate-800 mb-2.5">Download PDF?</h3>
      <p className="text-slate-500 text-sm mb-6">Quotation created successfully. Would you like to download the PDF now?</p>
      <div className="flex gap-2.5 justify-center">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm cursor-pointer hover:bg-slate-50 transition-colors"
        >
          No Thanks
        </button>
        <button
          onClick={onYes}
          className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200"
        >
          Download PDF
        </button>
      </div>
    </div>
  </Modal>
);

export default function Direct() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [quotationId, setQuotationId] = useState(null);
  const [isQuotationCreated, setIsQuotationCreated] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalCart, setModalCart] = useState([]);
  const [modalSelectedProduct, setModalSelectedProduct] = useState(null);
  const [modalSelectedCustomer, setModalSelectedCustomer] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [modalAdditionalDiscount, setModalAdditionalDiscount] = useState(0);
  const [modalChangeDiscount, setModalChangeDiscount] = useState(0);
  const [newProductModalIsOpen, setNewProductModalIsOpen] = useState(false);
  const [newProductData, setNewProductData] = useState({ productname: '', price: '', discount: 0, quantity: 1, per: '', product_type: 'custom' });
  const [newProductIsForModal, setNewProductIsForModal] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  const [modalLastAddedProduct, setModalLastAddedProduct] = useState(null);
  const [changeDiscount, setChangeDiscount] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [modalSubmitLoading, setModalSubmitLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [quotationToCancel, setQuotationToCancel] = useState(null);
  const [pdfConfirmOpen, setPdfConfirmOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const triggerPdfDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', fileName);
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); window.URL.revokeObjectURL(url);
  };
  const handlePdfYes = () => { if (pdfUrl && pdfFileName) triggerPdfDownload(pdfUrl, pdfFileName); setPdfConfirmOpen(false); setPdfUrl(null); setPdfFileName(""); };
  const handlePdfNo = () => { if (pdfUrl) window.URL.revokeObjectURL(pdfUrl); setPdfConfirmOpen(false); setPdfUrl(null); setPdfFileName(""); };

  const fetchQuotations = async () => {
    try {
      const quotationsResponse = await axios.get(`${API_BASE_URL}/api/direct/quotations`);
      const data = Array.isArray(quotationsResponse.data) ? quotationsResponse.data : [];
      const validQuotations = data.filter(q => q.quotation_id && q.quotation_id !== "undefined" && /^[a-zA-Z0-9-_]+$/.test(q.quotation_id));
      setQuotations(validQuotations); setFilteredQuotations(validQuotations);
    } catch (err) { console.error("Failed to fetch quotations:", err.message); setError(`Failed to fetch quotations: ${err.message}`); }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customersResponse, productsResponse, quotationsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/direct/customers`),
          axios.get(`${API_BASE_URL}/api/direct/aproducts`),
          axios.get(`${API_BASE_URL}/api/direct/quotations`),
        ]);
        const sortedCustomers = Array.isArray(customersResponse.data) ? customersResponse.data.sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
        const validProducts = Array.isArray(productsResponse.data) ? productsResponse.data.filter(p => p != null && typeof p === 'object' && typeof p.id !== 'undefined' && typeof p.product_type === 'string' && typeof p.productname === 'string') : [];
        setCustomers(sortedCustomers); setProducts(validProducts);
        const data = Array.isArray(quotationsResponse.data) ? quotationsResponse.data : [];
        const validQuotations = data.filter(q => q.quotation_id && q.quotation_id !== "undefined" && /^[a-zA-Z0-9-_]+$/.test(q.quotation_id));
        setQuotations(validQuotations); setFilteredQuotations(validQuotations);
      } catch (err) { console.error('Fetch data error:', err); setError(`Failed to fetch data: ${err.message}`); setProducts([]); }
      finally { setLoading(false); }
    };
    fetchData();
    const intervalId = setInterval(fetchQuotations, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSearch = useCallback(debounce((query) => {
    const lowerQuery = query.toLowerCase();
    const filtered = quotations.filter(q => q.quotation_id.toLowerCase().includes(lowerQuery) || (q.customer_name || '').toLowerCase().includes(lowerQuery) || q.status.toLowerCase().includes(lowerQuery));
    setFilteredQuotations(filtered); setCurrentPage(1);
  }, 300), [quotations]);

  const handleSearchChange = (e) => { const query = e.target.value; setSearchQuery(query); handleSearch(query); };

  const downloadCustomersExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const customerGroups = { Customer: customers.filter(c => c.customer_type === 'Customer'), Agent: customers.filter(c => c.customer_type === 'Agent'), 'Customer of Agent': customers.filter(c => c.customer_type === 'Customer of Selected Agent') };
      for (const [type, group] of Object.entries(customerGroups)) {
        if (group.length === 0) continue;
        const data = group.map(customer => ({ ID: customer.id || 'N/A', Name: customer.name || 'N/A', 'Customer Type': customer.customer_type || 'User', ...(type === 'Customer of Agent' ? { 'Agent Name': customer.agent_name || 'N/A' } : {}), 'Mobile Number': customer.mobile_number || 'N/A', Email: customer.email || 'N/A', Address: customer.address || 'N/A', District: customer.district || 'N/A', State: customer.state || 'N/A' }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
      }
      XLSX.writeFile(workbook, 'customers_export.xlsx');
    } catch (err) { console.error('Failed to download customers Excel:', err); setError(`Failed to download customers Excel: ${err.message}`); }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const customerGroups = { Customer: customers.filter(c => c.customer_type === "Customer"), Agent: customers.filter(c => c.customer_type === "Agent"), "Customer of Agent": customers.filter(c => c.customer_type === "Customer of Selected Agent") };
      let hasAnyData = false;
      for (const [type, group] of Object.entries(customerGroups)) {
        if (group.length === 0) continue; hasAnyData = true;
        const data = group.map(customer => ({ ID: customer.id || "N/A", Name: customer.name || "N/A", "Customer Type": customer.customer_type || "User", ...(type === "Customer of Agent" ? { "Agent Name": customer.agent_name || "N/A" } : {}), "Mobile Number": customer.mobile_number || "N/A", Email: customer.email || "N/A", Address: customer.address || "N/A", District: customer.district || "N/A", State: customer.state || "N/A" }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
      }
      if (!hasAnyData) { setError("No customer data available to export"); return; }
      XLSX.writeFile(workbook, "customers_export.xlsx");
      setSuccessMessage("Customers exported successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) { console.error("Failed to export customers:", err); setError(`Failed to export customers: ${err.message}`); }
  };

  const exportQuotationsToExcel = async () => {
    setError(""); setSuccessMessage(""); setExportLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/direct/export-quotations-excel`, { responseType: "blob", timeout: 300000 });
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition?.split("filename=")[1]?.replace(/["']/g, "") || `MadhunishaCrackers_Quotations_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a"); link.href = url; link.setAttribute("download", filename); document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
      setSuccessMessage("Quotations exported successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      console.error("Export quotations failed:", err);
      let message = "Failed to export quotations. Please try again.";
      if (err.code === "ECONNABORTED") message = "Export timed out. The file may be very large.";
      else if (err.response?.status === 500) message = "Server error during export.";
      setError(message);
    } finally { setExportLoading(false); }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotations = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const paginate = (pageNumber) => { if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber); };

  const addToCart = (isModal = false, customProduct = null, directProduct = null) => {
    const setTargetCart = isModal ? setModalCart : setCart;
    const targetSelectedProduct = isModal ? modalSelectedProduct : selectedProduct;
    const setTargetSelectedProduct = isModal ? setModalSelectedProduct : setSelectedProduct;
    const targetDiscount = isModal ? modalChangeDiscount : changeDiscount;
    const setTargetLastAddedProduct = isModal ? setModalLastAddedProduct : setLastAddedProduct;
    if (!customProduct && !targetSelectedProduct && !directProduct) { setError("Please select a product"); return; }
    let product;
    if (customProduct) {
      product = { ...customProduct, id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, product_type: customProduct.product_type || 'custom', price: Math.round(Number(customProduct.price) || 0), quantity: parseInt(customProduct.quantity) || 1, discount: parseFloat(customProduct.discount) || targetDiscount, initialDiscount: parseFloat(customProduct.discount) || targetDiscount, per: customProduct.per || 'Unit' };
    } else if (directProduct) {
      product = { ...directProduct, id: directProduct.id, price: Math.round(Number(directProduct.price) || 0), quantity: 1, discount: parseFloat(directProduct.discount) || targetDiscount, initialDiscount: parseFloat(directProduct.discount) || 0, per: directProduct.per || 'Unit' };
    } else {
      const [id, type] = targetSelectedProduct.value.split("-");
      product = products.find(p => p.id.toString() === id && p.product_type === type);
      if (!product) { setError("Product not found"); return; }
      product = { ...product, id: product.id, price: Math.round(Number(product.price) || 0), quantity: 1, discount: parseFloat(product.discount) || targetDiscount, initialDiscount: parseFloat(product.discount) || 0, per: product.per || 'Unit' };
    }
    setTargetCart(prev => {
      const exists = prev.find(item => item.id === product.id && item.product_type === product.product_type);
      return exists ? prev.map(item => item.id === product.id && item.product_type === product.product_type ? { ...item, quantity: item.quantity + 1 } : item) : [...prev, product];
    });
    setTargetSelectedProduct(null);
    setTargetLastAddedProduct({ id: product.id, product_type: product.product_type });
    setError("");
  };

  const updateQuantity = (id, type, quantity, isModal = false) => { const s = isModal ? setModalCart : setCart; s(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, quantity: quantity < 0 ? 0 : quantity } : item)); };
  const updateDiscount = (id, type, discount, isModal = false) => { const s = isModal ? setModalCart : setCart; s(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, discount: discount < 0 ? 0 : discount > 100 ? 100 : discount } : item)); };
  const updatePrice = (id, type, price, isModal = false) => { const s = isModal ? setModalCart : setCart; s(prev => prev.map(item => item.id === id && item.product_type === type ? { ...item, price: price < 0 ? 0 : price } : item)); };
  const removeFromCart = (id, type, isModal = false) => { const s = isModal ? setModalCart : setCart; s(prev => prev.filter(item => !(item.id === id && item.product_type === type))); };

  const calculateNetRate = (targetCart = []) => targetCart.reduce((total, item) => total + getEffectivePrice(item) * item.quantity, 0).toFixed(2);
  const calculateYouSave = (targetCart = []) => targetCart.reduce((total, item) => total + getEffectivePrice(item) * (item.discount / 100) * item.quantity, 0).toFixed(2);
  const calculateProcessingFee = (targetCart = [], additionalDiscount = 0) => { const subtotal = targetCart.reduce((total, item) => total + getEffectivePrice(item) * (1 - item.discount / 100) * item.quantity, 0); return (subtotal * (1 - additionalDiscount / 100) * 0.025).toFixed(2); };
  const calculateTotal = (targetCart = [], additionalDiscount = 0) => { const subtotal = targetCart.reduce((total, item) => total + getEffectivePrice(item) * (1 - item.discount / 100) * item.quantity, 0); const discountedSubtotal = subtotal * (1 - additionalDiscount / 100); return (discountedSubtotal + discountedSubtotal * 0.025).toFixed(2); };

  const createQuotation = async () => {
    if (!selectedCustomer || !cart.length) return setError("Customer and products are required");
    if (cart.some(i => i.quantity === 0)) return setError("Please remove products with zero quantity");
    setCreateLoading(true); setError("");
    const customer = customers.find(c => c.id.toString() === selectedCustomer.value);
    if (!customer) { setCreateLoading(false); return setError("Invalid customer"); }
    const quotation_id = `QUO-${Date.now()}`;
    try {
      const subtotal = parseFloat(calculateNetRate(cart)) - parseFloat(calculateYouSave(cart));
      const discountedSubtotal = subtotal * (1 - additionalDiscount / 100);
      const processingFee = discountedSubtotal * 0.025;
      const payload = { customer_id: Number(selectedCustomer.value), quotation_id, products: cart.map(item => ({ id: item.id, product_type: item.product_type, productname: item.productname, price: getEffectivePrice(item), discount: parseFloat(item.discount) || 0, quantity: parseInt(item.quantity) || 0, per: item.per || 'Unit', serial_number: item.serial_number || undefined })), net_rate: parseFloat(calculateNetRate(cart)), you_save: parseFloat(calculateYouSave(cart)), processing_fee: processingFee, total: parseFloat(calculateTotal(cart, additionalDiscount)), promo_discount: 0, additional_discount: parseFloat(additionalDiscount.toFixed(2)), customer_type: customer.customer_type || "User", customer_name: customer.name, address: customer.address, mobile_number: customer.mobile_number, email: customer.email, district: customer.district, state: customer.state, status: "pending" };
      const response = await axios.post(`${API_BASE_URL}/api/direct/quotations`, payload);
      const newQuotationId = response.data.quotation_id;
      if (!newQuotationId || newQuotationId === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(newQuotationId)) throw new Error("Invalid quotation ID returned from server");
      setQuotationId(newQuotationId); setIsQuotationCreated(true);
      setSuccessMessage("Quotation created successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      setQuotations(prev => [{ ...payload, created_at: new Date().toISOString(), customer_name: customer.name, total: payload.total }, ...prev]);
      setFilteredQuotations(prev => [{ ...payload, created_at: new Date().toISOString(), customer_name: customer.name, total: payload.total }, ...prev]);
      const pdfRes = await axios.get(`${API_BASE_URL}/api/direct/quotation/${newQuotationId}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([pdfRes.data]));
      const safeName = (customer.name || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      setPdfUrl(blobUrl); setPdfFileName(`${safeName}-${newQuotationId}-quotation.pdf`); setPdfConfirmOpen(true);
      setCart([]); setSelectedCustomer(null); setSelectedProduct(null); setAdditionalDiscount(0); setChangeDiscount(0); setLastAddedProduct(null); setQuotationId(null); setIsQuotationCreated(false);
    } catch (err) { console.error("Create quotation error:", err); setError(`Failed to create quotation: ${err.message}`); }
    finally { setCreateLoading(false); }
  };

  const editQuotation = async (quotation = null) => {
    if (quotation) {
      if (!quotation.quotation_id || quotation.quotation_id === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(quotation.quotation_id)) { setError("Invalid or missing quotation ID"); return; }
      setModalMode("edit");
      setModalSelectedCustomer({ value: quotation.customer_id?.toString(), label: `${quotation.customer_name} (${quotation.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : quotation.customer_type || "User"} - ${quotation.district || "N/A"})` });
      setQuotationId(quotation.quotation_id); setModalAdditionalDiscount(parseFloat(quotation.additional_discount) || 0); setModalChangeDiscount(0);
      try {
        const prods = typeof quotation.products === "string" ? JSON.parse(quotation.products) : quotation.products;
        setModalCart(Array.isArray(prods) ? prods.map(p => ({ ...p, id: p.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, price: parseFloat(p.price) || 0, discount: parseFloat(p.discount) || 0, initialDiscount: parseFloat(p.discount) || 0, quantity: parseInt(p.quantity) || 0, per: p.per || 'Unit', product_type: p.product_type || 'custom' })) : []);
      } catch (e) { setModalCart([]); setError("Failed to parse quotation products"); return; }
      setModalIsOpen(true); return;
    }
    if (!modalSelectedCustomer || !modalCart.length) return setError("Customer and products are required");
    if (modalCart.some(item => item.quantity === 0)) return setError("Please remove products with zero quantity");
    if (!quotationId || quotationId === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(quotationId)) { setError("Invalid or missing quotation ID"); return; }
    setModalSubmitLoading(true);
    try {
      const customer = customers.find(c => c.id.toString() === modalSelectedCustomer.value);
      if (!customer) throw new Error("Invalid customer");
      const subtotal = parseFloat(calculateNetRate(modalCart)) - parseFloat(calculateYouSave(modalCart));
      const discountedSubtotal = subtotal * (1 - modalAdditionalDiscount / 100);
      const processingFee = discountedSubtotal * 0.01;
      const payload = { customer_id: Number(modalSelectedCustomer.value), products: modalCart.map(item => ({ id: item.id, product_type: item.product_type, productname: item.productname, price: parseFloat(item.price) || 0, discount: parseFloat(item.discount) || 0, quantity: parseInt(item.quantity) || 0, per: item.per || 'Unit' })), net_rate: parseFloat(calculateNetRate(modalCart)) || 0, you_save: parseFloat(calculateYouSave(modalCart)) || 0, processing_fee: parseFloat(processingFee) || 0, total: parseFloat(calculateTotal(modalCart, modalAdditionalDiscount)) || 0, promo_discount: 0, additional_discount: parseFloat(modalAdditionalDiscount.toFixed(2)) || 0, status: "pending" };
      const response = await axios.put(`${API_BASE_URL}/api/direct/quotations/${quotationId}`, payload);
      const updatedId = response.data.quotation_id || quotationId;
      if (!updatedId) throw new Error("Invalid quotation ID returned");
      setSuccessMessage("Quotation updated successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      setQuotations(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, ...payload, customer_name: customer.name, total: payload.total } : q));
      setFilteredQuotations(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, ...payload, customer_name: customer.name, total: payload.total } : q));
      const pdfRes = await axios.get(`${API_BASE_URL}/api/direct/quotation/${updatedId}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([pdfRes.data]));
      const safeName = (customer.name || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      setPdfUrl(blobUrl); setPdfFileName(`${safeName}-${updatedId}-quotation.pdf`); setPdfConfirmOpen(true);
      closeModal();
    } catch (err) { console.error("Edit quotation error:", err); setError(`Failed to update quotation: ${err.message}`); }
    finally { setModalSubmitLoading(false); }
  };

  const convertToBooking = async (quotation = null) => {
    if (quotation) {
      if (!quotation.quotation_id || quotation.quotation_id === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(quotation.quotation_id)) { setError("Invalid or missing quotation ID"); return; }
      setModalMode("book");
      setModalSelectedCustomer({ value: quotation.customer_id?.toString(), label: `${quotation.customer_name} (${quotation.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : quotation.customer_type || "User"} - ${quotation.district || "N/A"})` });
      setQuotationId(quotation.quotation_id); setOrderId(`ORD-${Date.now()}`); setModalAdditionalDiscount(parseFloat(quotation.additional_discount) || 0); setModalChangeDiscount(0);
      try {
        const prods = typeof quotation.products === "string" ? JSON.parse(quotation.products) : quotation.products;
        setModalCart(Array.isArray(prods) ? prods.map(p => ({ ...p, id: p.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, price: parseFloat(p.price) || 0, discount: parseFloat(p.discount) || 0, initialDiscount: parseFloat(p.discount) || 0, quantity: parseInt(p.quantity) || 0, per: p.per || 'Unit', product_type: p.product_type || 'custom' })) : []);
      } catch (e) { setModalCart([]); setError("Failed to parse quotation products"); return; }
      setModalIsOpen(true); return;
    }
    if (!modalSelectedCustomer || !modalCart.length || !orderId) return setError("Customer, products, and order ID are required");
    if (modalCart.some(item => item.quantity === 0)) return setError("Please remove products with zero quantity");
    if (!quotationId || quotationId === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(quotationId)) { setError("Invalid or missing quotation ID"); return; }
    setModalSubmitLoading(true);
    try {
      const customer = customers.find(c => c.id.toString() === modalSelectedCustomer.value);
      if (!customer) throw new Error("Invalid customer");
      const subtotal = parseFloat(calculateNetRate(modalCart)) - parseFloat(calculateYouSave(modalCart));
      const discountedSubtotal = subtotal * (1 - modalAdditionalDiscount / 100);
      const processingFee = discountedSubtotal * 0.01;
      const payload = { customer_id: Number(modalSelectedCustomer.value), order_id: orderId, quotation_id: quotationId, products: modalCart.map(item => ({ id: item.id, product_type: item.product_type, productname: item.productname, price: getEffectivePrice(item), discount: parseFloat(item.discount) || 0, quantity: parseInt(item.quantity) || 0, per: item.per || 'Unit', serial_number: item.serial_number || undefined })), net_rate: parseFloat(calculateNetRate(modalCart)), you_save: parseFloat(calculateYouSave(modalCart)), processing_fee: processingFee, total: parseFloat(calculateTotal(modalCart, modalAdditionalDiscount)), promo_discount: 0, additional_discount: parseFloat(modalAdditionalDiscount.toFixed(2)), customer_type: customer.customer_type || "User", customer_name: customer.name, address: customer.address, mobile_number: customer.mobile_number, email: customer.email, district: customer.district, state: customer.state };
      const response = await axios.post(`${API_BASE_URL}/api/direct/bookings`, payload);
      setSuccessMessage("Booking created successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      setQuotations(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, status: "booked" } : q));
      setFilteredQuotations(prev => prev.map(q => q.quotation_id === quotationId ? { ...q, status: "booked" } : q));
      const pdfRes = await axios.get(`${API_BASE_URL}/api/direct/invoice/${response.data.order_id}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([pdfRes.data]));
      const safeName = (customer.name || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      setPdfUrl(blobUrl); setPdfFileName(`${safeName}-${response.data.order_id}-invoice.pdf`); setPdfConfirmOpen(true);
      closeModal();
    } catch (err) { console.error("Convert to booking error:", err); setError(`Failed to create booking: ${err.message}`); }
    finally { setModalSubmitLoading(false); }
  };

  const cancelQuotation = async () => {
    const target = quotationToCancel;
    if (!target || target === "undefined" || !/^[a-zA-Z0-9-_]+$/.test(target)) { setError("Invalid quotation ID"); setCancelConfirmOpen(false); return; }
    setCancelLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/direct/quotations/cancel/${target}`);
      setSuccessMessage("Quotation cancelled successfully!"); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      setQuotations(prev => prev.map(q => q.quotation_id === target ? { ...q, status: "cancelled" } : q));
      setFilteredQuotations(prev => prev.map(q => q.quotation_id === target ? { ...q, status: "cancelled" } : q));
    } catch (err) { setError(`Failed to cancel: ${err.response?.data?.message || err.message}`); }
    finally { setCancelLoading(false); setCancelConfirmOpen(false); setQuotationToCancel(null); }
  };

  const openCancelConfirm = (id) => { setQuotationToCancel(id); setCancelConfirmOpen(true); };
  const openNewProductModal = (isModal = false) => { setNewProductIsForModal(isModal); setNewProductModalIsOpen(true); setNewProductData({ productname: '', price: '', discount: isModal ? modalChangeDiscount : changeDiscount, quantity: 1, per: '', product_type: 'custom' }); };
  const closeNewProductModal = () => { setNewProductModalIsOpen(false); setNewProductData({ productname: '', price: '', discount: 0, quantity: 1, per: '', product_type: 'custom' }); setError(""); };
  const handleAddNewProduct = (productData) => {
    if (!productData.productname) return setError("Product name is required");
    if (productData.price === '' || productData.price < 0) return setError("Price must be a non-negative number");
    if (productData.quantity === '' || productData.quantity < 1) return setError("Quantity must be at least 1");
    if (productData.discount < 0 || productData.discount > 100) return setError("Discount must be between 0 and 100");
    if (!productData.product_type) return setError("Product type is required");
    addToCart(newProductIsForModal, productData); closeNewProductModal();
  };
  const closeModal = () => { setModalIsOpen(false); setModalMode(null); setModalCart([]); setModalSelectedCustomer(null); setModalSelectedProduct(null); setOrderId(""); setModalAdditionalDiscount(0); setModalChangeDiscount(0); setModalLastAddedProduct(null); setError(""); setSuccessMessage(""); };

  return (
    <DirectErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <Logout />
        <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto hundred:max-w-screen">
          <div className="mx-auto px-6 py-8 w-full">

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Direct Booking</h1>
              <p className="text-slate-400 mt-1.5 text-sm">Create quotations and convert them to bookings</p>
            </div>

            {loading && (
              <div className="text-center py-5 text-indigo-500 font-semibold text-sm flex items-center justify-center gap-2">
                <Spinner />
                Loading...
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}
            {showSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-800 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">
                ✓ {successMessage}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-7 mb-8 mobile:p-4 w-full">
              <div className="mb-6">
                <label className="block text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">
                  Select Customer
                </label>
                <Select
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  options={customers.map(c => ({ value: c.id.toString(), label: `${c.name} (${c.customer_type === "Customer of Selected Agent" ? "Customer - Agent" : c.customer_type || "User"} - ${c.district || "N/A"})` }))}
                  placeholder="Search customer"
                  isClearable
                  styles={selectStyles}
                />
              </div>

              <div className="h-px bg-slate-100 -mx-8 mobile:-mx-4 mb-6" />

              <QuotationTableErrorBoundary>
                <QuotationTable
                  cart={cart} setCart={setCart} setModalCart={setModalCart}
                  products={products} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
                  addToCart={addToCart} updateQuantity={updateQuantity} updateDiscount={updateDiscount}
                  updatePrice={updatePrice} removeFromCart={removeFromCart}
                  calculateNetRate={calculateNetRate} calculateYouSave={calculateYouSave}
                  calculateProcessingFee={calculateProcessingFee} calculateTotal={calculateTotal}
                  styles={styles} additionalDiscount={additionalDiscount} setAdditionalDiscount={setAdditionalDiscount}
                  changeDiscount={changeDiscount} setChangeDiscount={setChangeDiscount}
                  openNewProductModal={openNewProductModal}
                  lastAddedProduct={lastAddedProduct} setLastAddedProduct={setLastAddedProduct}
                />
              </QuotationTableErrorBoundary>

              <div className="flex justify-center mt-7">
                <button
                  onClick={createQuotation}
                  disabled={!selectedCustomer || !cart.length || createLoading}
                  className={`flex items-center gap-2.5 px-10 py-3.5 rounded-xl font-extrabold text-sm tracking-wide transition-all duration-200
                    ${!selectedCustomer || !cart.length || createLoading
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-br from-indigo-500 to-indigo-400 text-white shadow-xl shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500"
                    }`}
                >
                  {createLoading ? (
                    <><Spinner white />Creating...</>
                  ) : (
                    <>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><path d="M3 12a9 9 0 1018 0A9 9 0 003 12z" /></svg>
                      Create Quotation
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h2 className="text-xl font-extrabold text-slate-800">All Quotations</h2>
                <div className="relative min-w-[280px]">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text" value={searchQuery} onChange={handleSearchChange}
                    placeholder="Search quotations..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-indigo-400 transition-colors box-border"
                  />
                </div>
              </div>

              {currentQuotations.length ? (
                <>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                    {currentQuotations.map((quotation) => (
                      <div
                        key={quotation.quotation_id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-xs font-extrabold text-indigo-500 tracking-wide">{quotation.quotation_id}</div>
                            <div className="text-base font-bold text-slate-800 mt-0.5">{quotation.customer_name || "N/A"}</div>
                          </div>
                          <StatusBadge status={quotation.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3.5">
                          {[
                            ["📍 Location", quotation.district || "N/A"],
                            ["💰 Total", `₹${parseFloat(quotation.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                            ["📅 Created", new Date(quotation.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
                          ].map(([label, value]) => (
                            <div key={label} className="bg-slate-50 rounded-lg px-2.5 py-2">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                              <div className="text-xs font-semibold text-slate-700 mt-0.5">{value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <QuotActionBtn label="Edit" onClick={() => editQuotation(quotation)} disabled={quotation.status !== "pending"} color="#f59e0b" />
                          <QuotActionBtn label="Book" onClick={() => convertToBooking(quotation)} disabled={quotation.status !== "pending"} color="#10b981" />
                          <QuotActionBtn label="Cancel" onClick={() => openCancelConfirm(quotation.quotation_id)} disabled={quotation.status !== "pending"} color="#ef4444" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-1.5 mt-6 flex-wrap">
                    <PaginBtn key="prev" label="← Prev" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                    {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                      const maxPagesToShow = 4;
                      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                      if (endPage === totalPages) startPage = Math.max(1, totalPages - maxPagesToShow + 1);
                      const page = startPage + i;
                      if (page > endPage) return null;
                      return <PaginBtn key={page} label={page} onClick={() => paginate(page)} active={currentPage === page} />;
                    }).filter(Boolean)}
                    <PaginBtn key="next" label="Next →" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 font-medium bg-white border border-slate-200 rounded-2xl">
                  {searchQuery ? "No quotations match your search" : "No quotations yet — create your first one above"}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center flex-wrap mb-4">
              {[
                { label: "Export Customers", onClick: exportToExcel, cls: "bg-emerald-500 shadow-emerald-200", icon: "📊", loadingState: false },
                { label: "Export Quotations", onClick: exportQuotationsToExcel, cls: "bg-violet-500 shadow-violet-200", icon: "📋", loadingState: exportLoading },
                { label: "Download Customers Excel", onClick: downloadCustomersExcel, cls: "bg-blue-500 shadow-blue-200", icon: "⬇️", loadingState: false },
              ].map(({ label, onClick, cls, icon, loadingState }) => (
                <button
                  key={label} onClick={onClick} disabled={loadingState}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-none font-bold text-sm text-white cursor-pointer shadow-lg hover:opacity-85 transition-opacity disabled:opacity-60 ${cls}`}
                >
                  {loadingState ? <><Spinner white />{label}...</> : <>{icon} {label}</>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="fixed inset-0 flex items-center justify-center p-4" overlayClassName="fixed inset-0 bg-black/60" key="quotation-modal">
          <div className="bg-white rounded-2xl px-8 py-7 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-800">
                {modalMode === "edit" ? "✏️ Edit Quotation" : "🚀 Convert to Booking"}
              </h2>
              <button
                onClick={closeModal} disabled={modalSubmitLoading}
                className="bg-slate-100 border-none rounded-lg px-3 py-1.5 cursor-pointer font-bold text-slate-500 text-xs hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                ✕ Close
              </button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-xs">⚠️ {error}</div>
            )}
            {modalMode === "book" && (
              <div className="mb-5">
                <label className="block text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Order ID</label>
                <input
                  type="text" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Enter Order ID"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
                />
              </div>
            )}
            <FormFields
              isEdit={modalMode === "edit"} customers={customers}
              modalSelectedCustomer={modalSelectedCustomer} setModalSelectedCustomer={setModalSelectedCustomer}
              modalCart={modalCart} setModalCart={setModalCart} products={products}
              modalSelectedProduct={modalSelectedProduct} setModalSelectedProduct={setModalSelectedProduct}
              addToCart={addToCart} updateQuantity={updateQuantity} updateDiscount={updateDiscount}
              updatePrice={updatePrice} removeFromCart={removeFromCart}
              calculateNetRate={calculateNetRate} calculateYouSave={calculateYouSave}
              calculateProcessingFee={calculateProcessingFee} calculateTotal={calculateTotal}
              handleSubmit={modalMode === "edit" ? () => editQuotation() : () => convertToBooking()}
              closeModal={closeModal} styles={styles}
              modalAdditionalDiscount={modalAdditionalDiscount} setModalAdditionalDiscount={setModalAdditionalDiscount}
              modalChangeDiscount={modalChangeDiscount} setModalChangeDiscount={setModalChangeDiscount}
              openNewProductModal={openNewProductModal}
              modalLastAddedProduct={modalLastAddedProduct} setModalLastAddedProduct={setModalLastAddedProduct}
              submitLoading={modalSubmitLoading}
            />
          </div>
        </Modal>

        <CancelConfirmModal isOpen={cancelConfirmOpen} onClose={() => { if (!cancelLoading) setCancelConfirmOpen(false); }} onConfirm={cancelQuotation} quotationId={quotationToCancel} loading={cancelLoading} />
        <PDFDownloadConfirmModal isOpen={pdfConfirmOpen} onClose={handlePdfNo} onYes={handlePdfYes} fileName={pdfFileName} />
        <NewProductModal isOpen={newProductModalIsOpen} onClose={closeNewProductModal} onSubmit={handleAddNewProduct} newProductData={newProductData} setNewProductData={setNewProductData} />

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </DirectErrorBoundary>
  );
}