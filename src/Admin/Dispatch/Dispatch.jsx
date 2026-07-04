import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaDownload, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

const PaginBtn = ({ label, onClick, disabled, active }) => (
  <button onClick={onClick} disabled={disabled}
    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all duration-150
      ${active ? "bg-indigo-600 border-indigo-600 text-white"
      : disabled ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
      : "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:text-indigo-600"}`}>
    {label}
  </button>
)

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"

const statusColors = {
  paid:       "text-amber-600 bg-amber-50 border-amber-200",
  packed:     "text-sky-600 bg-sky-50 border-sky-200",
  dispatched: "text-indigo-600 bg-indigo-50 border-indigo-200",
  delivered:  "text-emerald-600 bg-emerald-50 border-emerald-200",
}

export default function Dispatch() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transportDetails, setTransportDetails] = useState({ transportName: '', lrNumber: '', transportContact: '' });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState(null);
  const ordersPerPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const allowedStatuses = ['paid', 'packed', 'dispatched', 'delivered'];
        const statuses = filterStatus ? [filterStatus] : allowedStatuses;

        const response = await axios.get(`${API_BASE_URL}/api/tracking/filtered-bookings`, {
          params: { status: statuses.join(',') }
        });

        const sortedBookings = [...response.data].sort((a, b) => (b.id || 0) - (a.id || 0));
        setBookings(sortedBookings);
        setError('');
      } catch {
        setError('Failed to fetch bookings');
      }
    };

    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, startDate, endDate]);

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'dispatched') {
      setSelectedBookingId(id);
      setIsModalOpen(true);
    } else {
      updateStatus(id, newStatus);
    }
  };

  const updateStatus = async (id, newStatus, transportInfo = null) => {
    try {
      const payload = { status: newStatus };

      if (transportInfo) {
        payload.transportName = transportInfo.transportName;
        payload.lrNumber = transportInfo.lrNumber;
        payload.transportContact = transportInfo.transportContact;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/tracking/fbookings/${id}/status`,
        payload
      );

      const updated = response.data?.data || {};
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updated, status: newStatus } : b ));
      setSuccessMessage('Status updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error(err);
      setError('Failed to update status');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!transportDetails.transportName || !transportDetails.lrNumber) {
      setError('Transport Name and LR Number are required');
      return;
    }
    await updateStatus(selectedBookingId, 'dispatched', transportDetails);
    setIsModalOpen(false);
    setTransportDetails({ transportName: '', lrNumber: '', transportContact: '' });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTransportDetails({ transportName: '', lrNumber: '', transportContact: '' });
  };

  const generateBillPDF = async (booking) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/direct/invoice/${booking.order_id}`, { responseType: 'blob' });
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeCustomerName = (booking.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      link.setAttribute('download', `${safeCustomerName}-${booking.order_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded estimate bill, check downloads", { position: "top-center", autoClose: 5000 });
    } catch {
      toast.error("Failed to download PDF. Please try again.", { position: "top-center", autoClose: 5000 });
    }
  };

  const generatePackingPDF = async (booking) => {
      try {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
  
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const marginL = 14;
        const contentW = pageW - marginL * 2;
  
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 88, 12);
        doc.text('SREE PALANIYAPPA CRACKERS', pageW / 2, 18, { align: 'center' });
  
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('www.palaniyappacrackers.com  |  +91 81242 59430', pageW / 2, 25, { align: 'center' });
  
        doc.setDrawColor(234, 88, 12);
        doc.setLineWidth(0.8);
        doc.line(marginL, 29, marginL + contentW, 29);
  
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('PACKING SLIP', marginL, 38);
  
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        doc.line(marginL, 41, marginL + contentW, 41);
  
        const boxY = 46;
        const boxH = 52;
        const halfW = contentW / 2 - 4;
  
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(marginL, boxY, halfW, boxH);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('FROM', marginL + 4, boxY + 7);
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.text('Sree Palaniyappa Crackers', marginL + 4, boxY + 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text('Sivakasi, Tamil Nadu', marginL + 4, boxY + 24);
        doc.text('+91 81242 59430', marginL + 4, boxY + 32);
        doc.text('sreepalaniyappacrackers@gmail.com', marginL + 4, boxY + 40);
  
        const shipX = marginL + halfW + 8;
        doc.rect(shipX, boxY, halfW, boxH);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 150, 150);
        doc.text('SHIP TO', shipX + 4, boxY + 7);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(booking.customer_name || 'N/A', shipX + 4, boxY + 16, { width: halfW - 8 });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        let addr = booking.address || '';
        if (addr.length > 40) addr = addr.substring(0, 37) + '…';
        doc.text(addr, shipX + 4, boxY + 24, { width: halfW - 8 });
        const distState = [booking.district, booking.state].filter(Boolean).join(', ');
        doc.text(distState, shipX + 4, boxY + 32);
        doc.text(`Mobile: ${booking.mobile_number || 'N/A'}`, shipX + 4, boxY + 40);
  
        const metaY = boxY + boxH + 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Order ID:`, marginL, metaY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(booking.order_id || 'N/A', marginL + 20, metaY);
  
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        doc.line(marginL, metaY + 4, marginL + contentW, metaY + 4);
  
        let products = [];
        try {
          products = typeof booking.products === 'string' ? JSON.parse(booking.products) : (booking.products || []);
        } catch { products = []; }
  
        const tableRows = products.map((p, i) => [i + 1, p.productname || 'N/A', p.quantity || 1]);
  
        autoTable(doc, {
          startY: metaY + 10,
          head: [['Sl.No', 'Product Name', 'Quantity']],
          body: tableRows,
          theme: 'grid',
          styles: { 
            fontSize: 12, 
            cellPadding: 4,
            fontStyle: 'bold'           // ← Made products & quantity bold
          },
          headStyles: { 
            fillColor: [255, 255, 255], 
            textColor: [40, 40, 40], 
            fontStyle: 'bold', 
            halign: 'center', 
            lineColor: [200, 200, 200] 
          },
          columnStyles: { 
            0: { cellWidth: 18, halign: 'center' }, 
            1: { cellWidth: 'auto', halign: 'left' }, 
            2: { cellWidth: 28, halign: 'center' } 
          },
          alternateRowStyles: { fillColor: [255, 247, 237] },
        });
  
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setDrawColor(234, 88, 12);
        doc.setLineWidth(0.6);
        doc.line(marginL, finalY, marginL + contentW, finalY);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text('Thank you for your business with Sree Planiyappa Crackers, Sivakasi', pageW / 2, finalY + 7, { align: 'center' });
  
        const safeCustomerName = (booking.customer_name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        doc.save(`${safeCustomerName}-${booking.order_id}-packing.pdf`);
        toast.success("Packing slip downloaded!", { position: "top-center", autoClose: 5000 });
      } catch (err) {
        console.error(err);
        toast.error("Failed to generate packing slip.", { position: "top-center", autoClose: 5000 });
      }
    };

  const handleDownloadClick = (booking) => {
    setDownloadTarget(booking);
    setShowDownloadModal(true);
  };

  const handleDownloadChoice = async (type) => {
    setShowDownloadModal(false);
    if (!downloadTarget) return;
    if (type === 'bill') await generateBillPDF(downloadTarget);
    else await generatePackingPDF(downloadTarget);
    setDownloadTarget(null);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = ['customer_name', 'order_id', 'total'].some(key =>
        b[key]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );

      const bookingDate = new Date(b.created_at || b.date).setHours(0, 0, 0, 0);
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;
      const matchesDate = (!start || bookingDate >= start) && (!end || bookingDate <= end);

      const matchesStatus = filterStatus ? b.status === filterStatus : true;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [bookings, searchQuery, startDate, endDate, filterStatus]);

  const totalPages = Math.ceil(filteredBookings.length / ordersPerPage);
  const currentOrders = filteredBookings.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dispatch Customers</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Manage and update order dispatch statuses</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">⚠️ {error}</div>}
          {successMessage && <div className="bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-800 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">✓ {successMessage}</div>}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
                  <option value="">All Statuses</option>
                  {['paid', 'packed', 'dispatched', 'delivered'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">From Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">To Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Name, Order ID or Total..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
                  />
                </div>
              </div>
            </div>
            {(startDate || endDate || filterStatus || searchQuery) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); setFilterStatus(''); setSearchQuery(''); }} className="mt-3 text-xs font-bold text-red-500 hover:underline block">
                Clear Filters
              </button>
            )}
          </div>

          {currentOrders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl mb-6">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-slate-400 font-medium text-sm">No bookings found</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mb-6">
              {currentOrders.map((booking) => (
                <div key={booking.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-base font-bold text-slate-800">{booking.customer_name || 'N/A'}</div>
                      {booking.mobile_number && (
                        <a href={`tel:${booking.mobile_number}`} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">
                          📞 {booking.mobile_number}
                        </a>
                      )}
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[booking.status] || "text-slate-400 bg-slate-50 border-slate-200"}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {[
                      ["🆔 Order ID", booking.order_id || 'N/A'],
                      ["📍 District",  booking.district  || 'N/A'],
                      ["🏛️ State",     booking.state     || 'N/A'],
                      ["💰 Total",     booking.total ? `₹${Math.round(parseFloat(booking.total))}` : 'N/A'],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg px-2 py-1.5">
                        <div className="text-xs font-bold text-slate-400">{label}</div>
                        <div className="text-xs font-semibold text-slate-700">{value}</div>
                      </div>
                    ))}
                  </div>

                  {booking.status === 'dispatched' && booking.transport_name && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 mb-3 space-y-1">
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">🚚 Transport Info</p>
                      <p className="text-xs text-slate-700"><span className="font-bold">Company:</span> {booking.transport_name}</p>
                      <p className="text-xs text-slate-700"><span className="font-bold">LR No:</span> {booking.lr_number}</p>
                      {booking.transport_contact && (
                        <p className="text-xs text-slate-700"><span className="font-bold">Contact:</span> {booking.transport_contact}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <select 
                      value={booking.status} 
                      onChange={e => handleStatusChange(booking.id, e.target.value)} 
                      className={inputCls}
                    >
                      <option value="" disabled>Update Status</option>
                      {[
                        { value: 'paid', label: 'Paid', level: 1 },
                        { value: 'packed', label: 'Packed', level: 2 },
                        { value: 'dispatched', label: 'Dispatched', level: 3 },
                        { value: 'delivered', label: 'Delivered', level: 4 }
                      ].map(s => {
                        const currentLevels = { paid: 1, packed: 2, dispatched: 3, delivered: 4 };
                        const currentLevel = currentLevels[booking.status] || 0;
                        
                        return (
                          <option 
                            key={s.value} 
                            value={s.value} 
                            disabled={s.level < currentLevel || booking.status === 'delivered'}
                          >
                            {s.label}
                          </option>
                        );
                      })}
                    </select>
                    <button onClick={() => handleDownloadClick(booking)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200">
                      <FaDownload className="text-xs" /> Download Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              <PaginBtn label="← Prev" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                .map(page => (
                  <PaginBtn key={page} label={page} onClick={() => setCurrentPage(page)} active={currentPage === page} />
                ))}
              <PaginBtn label="Next →" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
            </div>
          )}
        </div>
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-4xl mb-4">📄</div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Download PDF</h2>
            <p className="text-slate-400 text-sm mb-7">Choose the type of PDF to download</p>
            <div className="flex gap-3">
              <button onClick={() => handleDownloadChoice('bill')} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all">
                🧾 Bill
              </button>
              <button onClick={() => handleDownloadChoice('packing')} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-orange-500 to-orange-400 shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-500 transition-all">
                📦 Packing
              </button>
            </div>
            <button onClick={() => { setShowDownloadModal(false); setDownloadTarget(null); }} className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-extrabold text-slate-800 mb-6 text-center">🚚 Transport Details</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-xs">⚠️ {error}</div>}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {[
                ["Transport Name",    "transportName",    "Enter transport company name", true],
                ["LR Number",         "lrNumber",         "Enter LR / consignment number", true],
                ["Transport Contact", "transportContact", "Enter contact number (optional)", false],
              ].map(([label, key, placeholder, required]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type="text"
                    value={transportDetails[key]}
                    onChange={e => setTransportDetails({ ...transportDetails, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={inputCls}
                    required={required}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={handleModalClose} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}