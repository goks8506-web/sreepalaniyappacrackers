import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import Logout from '../Logout';

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewURLs, setPreviewURLs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = React.useRef(null);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/banners`);
      setBanners(res.data);
    } catch (err) { setError('Failed to fetch banners'); }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setPreviewURLs(files.map(file => URL.createObjectURL(file)));
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/banners/${id}`);
      setDeleteConfirmId(null);
      fetchBanners();
      setSuccess('Banner deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed to delete banner'); setDeleteConfirmId(null); }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('images', file));
    try {
      setUploading(true);
      await axios.post(`${API_BASE_URL}/api/banners/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSelectedFiles([]); setPreviewURLs([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchBanners();
      setSuccess('Banners uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Upload failed: ' + (err?.response?.data?.message || err.message)); }
    finally { setUploading(false); }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/banners/${id}`, { is_active: !currentStatus });
      fetchBanners();
    } catch (err) { setError('Failed to update status'); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manage Banners</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Upload and control banner visibility</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">⚠️ {error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-800 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">✓ {success}</div>}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-7 mb-8 mobile:p-4 max-w-2xl">
            <h3 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
              Upload Banner Images
            </h3>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors mb-4">
              <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-colors" />
              <p className="text-xs text-slate-400 mt-2">Select one or more image files to upload as banners</p>
            </div>
            {previewURLs.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {previewURLs.map((src, index) => (
                  <img key={index} src={src} alt={`Preview ${index}`} className="h-24 w-auto rounded-xl border border-slate-200 shadow-sm object-cover" />
                ))}
              </div>
            )}
            <button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200
                ${uploading || selectedFiles.length === 0
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500"}`}>
              {uploading
                ? <span className="flex items-center gap-2"><span className="inline-block w-4 h-4 border-[3px] border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</span>
                : 'Upload Banners'}
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">🖼️</div>
              <p className="text-slate-400 font-medium text-sm">No banners uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <img src={banner.image_url.startsWith('http') ? banner.image_url : `${API_BASE_URL}${banner.image_url}`} alt="Banner" className="w-full h-36 object-cover" />
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border
                      ${banner.is_active ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-slate-400 bg-slate-50 border-slate-200"}`}>
                      {banner.is_active ? '● Visible' : '○ Hidden'}
                    </span>
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleActive(banner.id, banner.is_active)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200
                          ${banner.is_active
                            ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-500 hover:text-white hover:border-slate-500"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500"}`}>
                        {banner.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => setDeleteConfirmId(banner.id)}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-2.5">Delete Banner?</h2>
            <p className="text-slate-500 text-sm mb-6">This banner will be permanently removed.</p>
            <div className="flex gap-2.5 justify-center">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Keep It</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-500 transition-all duration-200">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}