import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
)

const capitalize = (str) => str ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : str

const Promocode = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [form, setForm] = useState({ code: '', discount: '', min_amount: '', end_date: '', product_type: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => { fetchPromocodes(); fetchProductTypes(); }, []);

  const fetchPromocodes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/promocodes`);
      if (!res.ok) throw new Error('Failed to fetch promocodes');
      setPromocodes(await res.json());
    } catch (err) { setError('Failed to load promocodes.'); }
  };

  const fetchProductTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types`);
      if (!res.ok) throw new Error('Failed to fetch product types');
      const data = await res.json();
      setProductTypes(Array.isArray(data) ? data.map(item => item.product_type).filter(type => type && type !== 'gift_box_dealers') : []);
    } catch (err) { setError('Failed to load product types.'); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) { setError('Code and discount are required.'); return; }
    try {
      const payload = { code: form.code, discount: parseInt(form.discount, 10), min_amount: form.min_amount ? parseFloat(form.min_amount) : null, end_date: form.end_date || null, product_type: form.product_type || null };
      if (isEditing) {
        const res = await fetch(`${API_BASE_URL}/api/promocodes/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to update');
        const updated = await res.json();
        setPromocodes(prev => prev.map(p => p.id === editingId ? updated : p));
      } else {
        const res = await fetch(`${API_BASE_URL}/api/promocodes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to create');
        setPromocodes([...promocodes, await res.json()]);
      }
      setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '' });
      setIsEditing(false); setEditingId(null); setError('');
    } catch (err) { setError('Failed to save promocode.'); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/promocodes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setPromocodes(promocodes.filter(p => p.id !== id));
      if (editingId === id) { setIsEditing(false); setEditingId(null); setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '' }); }
      setDeleteConfirmId(null); setError('');
    } catch (err) { setError('Failed to delete promocode.'); setDeleteConfirmId(null); }
  };

  const handleEdit = (promo) => {
    setForm({ code: promo.code, discount: promo.discount.toString(), min_amount: promo.min_amount ? promo.min_amount.toString() : '', end_date: promo.end_date ? promo.end_date.split('T')[0] : '', product_type: promo.product_type || '' });
    setIsEditing(true); setEditingId(promo.id); setError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false); setEditingId(null);
    setForm({ code: '', discount: '', min_amount: '', end_date: '', product_type: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Promocode Management</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Create and manage discount codes</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">⚠️ {error}</div>}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-7 mb-8 max-w-lg mobile:p-4">
            <h3 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
              {isEditing ? 'Edit Promocode' : 'Add New Promocode'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Code" required>
                <input type="text" name="code" value={form.code} onChange={handleChange} placeholder="e.g. SAVE20" className={inputCls} required />
              </Field>
              <Field label="Discount (%)" required>
                <input type="number" name="discount" value={form.discount} onChange={handleChange} placeholder="e.g. 20" className={inputCls} required min="1" max="100" />
              </Field>
              <Field label="Minimum Amount">
                <input type="number" name="min_amount" value={form.min_amount} onChange={handleChange} placeholder="e.g. 500" className={inputCls} min="0" />
              </Field>
              <Field label="End Date">
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Product Type">
                <select name="product_type" value={form.product_type} onChange={handleChange} className={inputCls}>
                  <option value="">All Products</option>
                  {productTypes.length === 0 ? <option disabled>No types available</option> : productTypes.map(type => <option key={type} value={type}>{capitalize(type)}</option>)}
                </select>
              </Field>
              <div className="flex gap-2.5 pt-1">
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200">
                  {isEditing ? 'Update' : 'Add Promocode'}
                </button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                )}
              </div>
            </form>
          </div>

          {promocodes.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">🎟️</div>
              <p className="text-slate-400 font-medium text-sm">No promocodes added yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Code', 'Discount', 'Min Amount', 'End Date', 'Product Type', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {promocodes.map((promo) => (
                      <tr key={promo.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${editingId === promo.id ? 'bg-indigo-50' : ''}`}>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700 tracking-wide">{promo.code}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{promo.discount}%</td>
                        <td className="px-4 py-3 text-slate-600">{promo.min_amount ? `₹${promo.min_amount}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-slate-600">{promo.end_date ? new Date(promo.end_date).toLocaleDateString() : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-slate-600">{promo.product_type ? capitalize(promo.product_type) : <span className="text-slate-400 text-xs">All Products</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => handleEdit(promo)} className="py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200">Edit</button>
                            <button onClick={() => setDeleteConfirmId(promo.id)} className="py-1.5 px-3 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-2.5">Delete Promocode?</h2>
            <p className="text-slate-500 text-sm mb-6">This code will be permanently removed.</p>
            <div className="flex gap-2.5 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Keep It</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-500 transition-all duration-200">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promocode;