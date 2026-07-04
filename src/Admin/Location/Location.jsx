import React, { useState, useEffect } from 'react';
import '../../App.css';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"

export default function Location() {
  const [states, setStates] = useState([]);
  const [newState, setNewState] = useState('');
  const [districts, setDistricts] = useState({});
  const [newDistrict, setNewDistrict] = useState({});
  const [minRates, setMinRates] = useState({});
  const [deleteStateConfirm, setDeleteStateConfirm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchStates(); }, []);

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setStates(data);
      data.forEach(state => {
        fetchDistricts(state.name);
        setMinRates(prev => ({ ...prev, [state.name]: state.min_rate || '' }));
      });
    } catch (error) { setError('Error fetching states'); }
  };

  const fetchDistricts = async (stateName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setDistricts(prev => ({ ...prev, [stateName]: data }));
    } catch (error) { setError(`Error fetching districts for ${stateName}`); }
  };

  const handleAddState = async (e) => {
    e.preventDefault();
    if (!newState.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newState }) });
      if (response.ok) { setNewState(''); fetchStates(); setSuccess('State added'); setTimeout(() => setSuccess(''), 2000); }
      else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { setError('Error adding state'); }
  };

  const handleAddDistrict = async (e, stateName) => {
    e.preventDefault();
    if (!newDistrict[stateName]?.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newDistrict[stateName] }) });
      if (response.ok) { setNewDistrict(prev => ({ ...prev, [stateName]: '' })); fetchDistricts(stateName); }
      else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { setError('Error adding district'); }
  };

  const handleUpdateRate = async (stateName, rate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/rate`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rate: parseFloat(rate) || 0 }) });
      if (response.ok) { setMinRates(prev => ({ ...prev, [stateName]: rate })); setSuccess('Rate updated'); setTimeout(() => setSuccess(''), 2000); }
      else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { setError('Error updating rate'); }
  };

  const handleDeleteState = async (stateName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}`, { method: 'DELETE' });
      if (response.ok) {
        setDistricts(prev => { const n = { ...prev }; delete n[stateName]; return n; });
        setMinRates(prev => { const n = { ...prev }; delete n[stateName]; return n; });
        setDeleteStateConfirm(null);
        fetchStates();
      } else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { setError('Error deleting state'); setDeleteStateConfirm(null); }
  };

  const handleDeleteDistrict = async (stateName, districtId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts/${districtId}`, { method: 'DELETE' });
      if (response.ok) fetchDistricts(stateName);
      else throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) { setError('Error deleting district'); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manage Locations</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Add states, districts and set delivery rates</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">⚠️ {error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-800 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">✓ {success}</div>}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-6 mb-8 max-w-lg mobile:p-4">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
              Add New State
            </h3>
            <form onSubmit={handleAddState} className="flex gap-3">
              <input type="text" value={newState} onChange={(e) => setNewState(e.target.value)} placeholder="Enter state name..." className={`${inputCls} flex-1`} />
              <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200 whitespace-nowrap">
                + Add State
              </button>
            </form>
          </div>

          {states.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-slate-400 font-medium text-sm">No states added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
              {states.map((state) => (
                <div key={state.name} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
                      <h3 className="text-base font-extrabold text-slate-800">{state.name}</h3>
                    </div>
                    <button onClick={() => setDeleteStateConfirm(state.name)}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200">
                      Delete State
                    </button>
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateRate(state.name, minRates[state.name]); }}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Delivery Rate</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                          <input type="number" step="0.01" value={minRates[state.name] || ''} onChange={(e) => setMinRates(prev => ({ ...prev, [state.name]: e.target.value }))}
                            placeholder="0.00" className={`${inputCls} pl-7`} />
                        </div>
                        <button type="submit" className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200">
                          Save
                        </button>
                      </div>
                    </form>

                    <form onSubmit={(e) => handleAddDistrict(e, state.name)}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Add District</label>
                      <div className="flex gap-2">
                        <input type="text" value={newDistrict[state.name] || ''} onChange={(e) => setNewDistrict(prev => ({ ...prev, [state.name]: e.target.value }))}
                          placeholder="District name..." className={`${inputCls} flex-1`} />
                        <button type="submit" className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-500 transition-all duration-200">
                          + Add
                        </button>
                      </div>
                    </form>

                    {districts[state.name]?.length > 0 ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Districts ({districts[state.name].length})</label>
                        <div className="flex flex-wrap gap-1.5">
                          {districts[state.name].map((district) => (
                            <span key={district.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
                              {district.name}
                              <button onClick={() => handleDeleteDistrict(state.name, district.id)} className="ml-0.5 text-indigo-400 hover:text-red-500 font-extrabold text-sm leading-none transition-colors">×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 text-xs">No districts added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteStateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-2.5">Delete State?</h2>
            <p className="text-slate-500 text-sm mb-6"><strong className="text-slate-800">{deleteStateConfirm}</strong> and all its districts will be permanently removed.</p>
            <div className="flex gap-2.5 justify-center">
              <button onClick={() => setDeleteStateConfirm(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Keep It</button>
              <button onClick={() => handleDeleteState(deleteStateConfirm)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-500 transition-all duration-200">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}