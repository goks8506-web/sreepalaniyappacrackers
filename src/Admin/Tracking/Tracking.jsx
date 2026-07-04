import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { FaDownload, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

const StatusBadge = ({ status }) => {
  const map = {
    booked:     "text-sky-600 bg-sky-50 border-sky-200",
    paid:       "text-amber-600 bg-amber-50 border-amber-200",
    dispatched: "text-emerald-600 bg-emerald-50 border-emerald-200",
    delivered:  "text-emerald-700 bg-emerald-100 border-emerald-300",
  };
  const icons = {
    booked: "⏳ Booked",
    paid: "💰 Paid",
    dispatched: "🚚 Dispatched",
    delivered: "✓ Delivered",
  };
  const cls = map[status?.toLowerCase()] || "text-slate-400 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {icons[status?.toLowerCase()] || status}
    </span>
  );
};

const PaginBtn = ({ label, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all duration-150
      ${active    ? "bg-indigo-600 border-indigo-600 text-white"
      : disabled  ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                  : "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:text-indigo-600"}`}
  >
    {label}
  </button>
);

const ModalWrapper = ({ children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
      {children}
    </div>
  </div>
);

const selectStyles = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border";

export default function Tracking() {
  const [bookings, setBookings] = useState([]);
  const [filterCustomerType, setFilterCustomerType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedTotal, setSelectedTotal] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState(null);
  const ordersPerPage = 12;
  const amountPaidRef = useRef(null);
  const transactionIdRef = useRef(null);

  useEffect(() => {
    if (showDetailsModal) {
      setTimeout(() => {
        if (amountPaidRef.current) {
          amountPaidRef.current.focus();
        }
      }, 150);
    }
  }, [showDetailsModal]);

  const fetchBookings = async (resetPage = false) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracking/bookings`, {
        params: { status: filterStatus || undefined, customerType: filterCustomerType || undefined }
      });
      const sortedBookings = response.data.sort((a, b) => b.id - a.id);
      setBookings(sortedBookings);
      setError('');
      if (resetPage) setCurrentPage(1);
    } catch {
      setError('Failed to fetch bookings');
    }
  };

  useEffect(() => {
    fetchBookings(true);
    const interval = setInterval(() => fetchBookings(false), 100000);
    return () => clearInterval(interval);
  }, [filterStatus, filterCustomerType]);

  const handleStatusChange = (id, newStatus, total) => {
    if (newStatus === 'paid') {
      setSelectedBookingId(id);
      setSelectedTotal(total || 0);
      setShowPaidModal(true);
    } else {
      updateStatus(id, newStatus);
    }
  };

  const updateStatus = async (id, newStatus, paymentDetails = null) => {
    try {
      const payload = { status: newStatus };
      if (paymentDetails) {
        payload.payment_method = paymentDetails.paymentMethod;
        payload.transaction_id = paymentDetails.transactionId || null;
        payload.amount_paid = paymentDetails.amountPaid;
      }
      await axios.put(`${API_BASE_URL}/api/tracking/bookings/${id}/status`, payload);

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id
            ? {
                ...booking,
                status: newStatus,
                ...(paymentDetails && {
                  payment_method: paymentDetails.paymentMethod,
                  transaction_id: paymentDetails.transactionId,
                  amount_paid: paymentDetails.amountPaid
                })
              }
            : booking
        ).sort((a, b) => b.id - a.id)
      );

      setError('');
      setShowPaidModal(false);
      setShowDetailsModal(false);
      resetPaymentForm();
      toast.success("Status updated successfully", { position: "top-center", autoClose: 5000 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const resetPaymentForm = () => {
    setPaymentMethod('cash');
    setTransactionId('');
    setAmountPaid('');
    setSelectedTotal(0);
  };

  const handleFillDetails = () => {
    setShowPaidModal(false);
    setShowDetailsModal(true);
  };

  const handleDetailsSubmit = () => {
    if (!amountPaid.trim() || isNaN(amountPaid) || Number(amountPaid) <= 0) {
      setError('Please enter a valid amount paid');
      return;
    }
    if (paymentMethod === 'bank' && !transactionId.trim()) {
      setError('Transaction ID is required for bank transactions');
      return;
    }

    updateStatus(selectedBookingId, 'paid', {
      paymentMethod,
      transactionId: paymentMethod === 'bank' ? transactionId : null,
      amountPaid: Number(amountPaid)
    });
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
    } catch (err) {
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

  const handleDeleteBooking = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/tracking/bookings/${selectedOrderId}`);
      setBookings((prev) => prev.filter((booking) => booking.order_id !== selectedOrderId));
      setShowDeleteModal(false);
      toast.success("Booking deleted successfully", { position: "top-center", autoClose: 5000 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete booking');
      setShowDeleteModal(false);
    }
  };

  const getISTDateString = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = ['customer_name', 'order_id', 'total', 'customer_type'].some((key) =>
      booking[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchesDate = true;
    if (filterDate) {
      const bookingISTDate = getISTDateString(booking.created_at);
      matchesDate = bookingISTDate === filterDate;
    }

    return matchesSearch && matchesDate;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    return `${String(istDate.getDate()).padStart(2, '0')}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${istDate.getFullYear()}`;
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredBookings.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredBookings.length / ordersPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tracking</h1>
            <p className="text-slate-400 mt-1.5 text-sm">Monitor and manage all bookings</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectStyles}>
                  <option value="">All Statuses</option>
                  <option value="booked">Booked</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Customer Type</label>
                <select value={filterCustomerType} onChange={(e) => setFilterCustomerType(e.target.value)} className={selectStyles}>
                  <option value="">All Customer Types</option>
                  <option value="Customer">Customer</option>
                  <option value="Agent">Agent</option>
                  <option value="Customer of Selected Agent">Customer of Selected Agent</option>
                  <option value="User">User</option>
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={selectStyles}
                />
              </div>
              <div className="flex-1 min-w-64">
                <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1.5">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Name, order ID, total, type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
                  />
                </div>
              </div>
            </div>
          </div>

          {currentOrders.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 mb-6">
              {currentOrders.map((booking) => (
                <div key={booking.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-extrabold text-indigo-500 tracking-wide">{booking.order_id}</div>
                      <div className="text-base font-bold text-slate-800 mt-0.5">{booking.customer_name}</div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Total Amount</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{parseFloat(booking.total || 0).toFixed(2)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      ["📍 District", booking.district || "N/A"],
                      ["🏛️ State", booking.state || "N/A"],
                      ["👤 Type", booking.customer_type],
                      ["📅 Date", formatDate(booking.created_at)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg px-2.5 py-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                        <div className="text-xs font-semibold text-slate-700 mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>

                  {(booking.amount_paid || booking.payment_method || booking.transaction_id) && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-4 space-y-1">
                      {booking.amount_paid && <p className="text-xs text-slate-700"><span className="font-bold text-amber-600">Amount Paid:</span> ₹{booking.amount_paid}</p>}
                      {booking.payment_method && <p className="text-xs text-slate-700"><span className="font-bold text-amber-600">Method:</span> {booking.payment_method}</p>}
                      {booking.transaction_id && <p className="text-xs text-slate-700"><span className="font-bold text-amber-600">Txn ID:</span> {booking.transaction_id}</p>}
                    </div>
                  )}

                  {booking.mobile_number && (
                    <a href={`tel:${booking.mobile_number}`} className="block text-xs font-semibold text-indigo-500 hover:text-indigo-700 mb-4 transition-colors">
                      📞 {booking.mobile_number}
                    </a>
                  )}

                  {booking.status?.toLowerCase() === 'booked' && (
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Update Status</label>
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value, booking.total)}
                        className={selectStyles}
                      >
                        <option value="">— Change Status —</option>
                        <option value="booked">Booked</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadClick(booking)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200"
                    >
                      <FaDownload className="text-xs" /> Download
                    </button>
                    <button
                      onClick={() => { setSelectedOrderId(booking.order_id); setShowDeleteModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
                    >
                      <FaTrash className="text-xs" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-medium bg-white border border-slate-200 rounded-2xl mb-6">
              No bookings found
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              <PaginBtn label="← Prev" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginBtn key={page} label={page} onClick={() => setCurrentPage(page)} active={currentPage === page} />
              ))}
              <PaginBtn label="Next →" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} />
            </div>
          )}
        </div>
      </div>

      {showPaidModal && (
        <ModalWrapper>
          <div className="text-5xl mb-4 text-center">💰</div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2 text-center">Update to Paid?</h2>
          <p className="text-slate-500 text-sm mb-6 text-center">Please fill in the payment details to proceed.</p>
          <div className="flex gap-2.5 justify-center">
            <button onClick={() => setShowPaidModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleFillDetails} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-500 transition-all duration-200">Fill Details</button>
          </div>
        </ModalWrapper>
      )}

      {showDetailsModal && (
        <ModalWrapper>
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 text-center">💳 Payment Details</h2>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm font-medium text-emerald-600">Total Amount</p>
            <p className="text-3xl font-bold text-emerald-700">₹{parseFloat(selectedTotal).toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  if (e.target.value === 'bank') {
                    setTimeout(() => transactionIdRef.current?.focus(), 0);
                  }
                }}
                className={selectStyles}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transaction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Amount Paid <span className="text-red-500">*</span>
              </label>
              <input
                ref={amountPaidRef}
                type="text"
                inputMode="numeric"
                value={amountPaid ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d{0,2}$/.test(val)) setAmountPaid(val);
                }}
                placeholder="Enter amount paid"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
              />
            </div>

            {paymentMethod === 'bank' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  ref={transactionIdRef}
                  type="text"
                  value={transactionId ?? ""}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 transition-colors box-border"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2.5 justify-end mt-6">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                fetchBookings(false);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDetailsSubmit}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-200"
            >
              Submit
            </button>
          </div>
        </ModalWrapper>
      )}

      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-4xl mb-4">📄</div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Download PDF</h2>
            <p className="text-slate-400 text-sm mb-7">Choose the type of PDF to download</p>
            <div className="flex gap-3">
              <button onClick={() => handleDownloadChoice('bill')} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-indigo-400 hover:from-indigo-600">🧾 Bill</button>
              <button onClick={() => handleDownloadChoice('packing')} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-orange-500 to-orange-400 hover:from-orange-600">📦 Packing</button>
            </div>
            <button onClick={() => { setShowDownloadModal(false); setDownloadTarget(null); }} className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <ModalWrapper>
          <div className="text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-2.5 text-center">Delete Booking?</h2>
          <p className="text-slate-500 text-sm mb-6 text-center">Are you sure you want to delete this booking? This cannot be undone.</p>
          <div className="flex gap-2.5 justify-center">
            <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-semibold text-sm hover:bg-slate-50">Keep It</button>
            <button onClick={handleDeleteBooking} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-red-500 to-red-400 hover:from-red-600">Yes, Delete</button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}