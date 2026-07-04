import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
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

const statusColors = {
  booked: "text-sky-600 bg-sky-50 border-sky-200",
  paid: "text-amber-600 bg-amber-50 border-amber-200",
  packed: "text-violet-600 bg-violet-50 border-violet-200",
  dispatched: "text-indigo-600 bg-indigo-50 border-indigo-200",
  delivered: "text-emerald-600 bg-emerald-50 border-emerald-200",
  canceled: "text-red-500 bg-red-50 border-red-200",
}

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 9;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tracking/report-bookings`, { params: { status: '' } });
        setBookings(response.data); setError('');
      } catch { setError('Failed to fetch bookings'); }
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date)) return 'N/A';
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const generatePDF = (booking) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Fun with Crackers', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    const orderDetails = [
      ['Order ID', booking.order_id || 'N/A', 'Customer Name', booking.customer_name || 'N/A'],
      ['Phone', booking.mobile_number || 'N/A', 'District', booking.district || 'N/A'],
      ['State', booking.state || 'N/A', 'Date', formatDate(booking.created_at)],
      ['Payment Method', booking.payment_method || 'N/A', 'Amount Paid', booking.amount_paid ? `Rs.${booking.amount_paid}` : 'N/A'],
      ['Transaction ID', booking.transaction_id || 'N/A', '', ''],
      ['Promocode', booking.promocode || 'N/A', 'Discount', booking.discount ? `Rs.${booking.discount}` : 'N/A'],
      ['Subtotal', booking.subtotal ? `Rs.${booking.subtotal}` : 'N/A', 'Total', booking.total ? `Rs.${booking.total}` : 'N/A']
    ];
    autoTable(doc, { startY: 40, body: orderDetails, columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 }, 3: { cellWidth: 50 } }, styles: { fontSize: 12 } });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: Rs.${booking.total || '0.00'}`, 150, finalY, { align: 'right' });
    doc.save(`${(booking.customer_name || 'order').replace(/[^a-zA-Z0-9]/g, '_')}_crackers_order.pdf`);
  };

  const exportToExcel = () => {
    const groupedBookings = bookings.reduce((acc, booking) => {
      const status = booking.status || 'Unknown';
      if (!acc[status]) acc[status] = [];
      acc[status].push(booking);
      return acc;
    }, {});
    const workbook = XLSX.utils.book_new();
    Object.keys(groupedBookings).forEach(status => {
      const sortedBookings = [...groupedBookings[status]].sort((a, b) => new Date(a.created_at).getMonth() - new Date(b.created_at).getMonth());
      const data = sortedBookings.map((b, i) => {
        const subtotal = b.subtotal || (b.total ? parseFloat(b.total) + (b.discount || 0) : 0);
        const discount = parseFloat(b.discount) || 0;
        const totalAmount = b.total ? parseFloat(b.total).toFixed(2) : (subtotal - discount).toFixed(2);
        return { 'Sl. No': i + 1, 'Order ID': b.order_id || '', 'Customer Name': b.customer_name || '', 'Mobile Number': b.mobile_number || '', 'District': b.district || '', 'State': b.state || '', 'Status': b.status || '', 'Date': new Date(b.created_at).toLocaleDateString('en-GB'), 'Address': b.address || '', 'Subtotal': subtotal.toFixed(2), 'Discount': discount.toFixed(2), 'Promocode': b.promocode || '', 'Total Amount': `Rs.${totalAmount}`, 'Payment Method': b.payment_method || '', 'Amount Paid': b.amount_paid ? `Rs.${b.amount_paid}` : '', 'Transaction ID': b.transaction_id || '' };
      });
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), status.replace(/[*?:/\\[\]]/g, '_').substring(0, 31) || 'Unknown');
    });
    XLSX.writeFile(workbook, 'Bookings_Report_By_Status.xlsx');
  };

  const totalPages = Math.ceil(bookings.length / ordersPerPage);
  const currentOrders = bookings.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Logout />
      <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
        <div className="mx-auto px-6 py-8 w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Report</h1>
            <p className="text-slate-400 mt-1.5 text-sm">View and export all booking records</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">⚠️ {error}</div>}

          <div className="flex justify-end mb-5">
            <button onClick={exportToExcel} className="h-10 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-500 transition-all duration-200 flex items-center gap-2">
              <FaDownload className="text-xs" /> Export to Excel
            </button>
          </div>

          {currentOrders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl mb-6">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-slate-400 font-medium text-sm">No bookings found</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mb-6">
              {currentOrders.map((booking, index) => {
                const subtotal = booking.subtotal || (booking.total ? parseFloat(booking.total) + (booking.discount || 0) : 0);
                const discount = parseFloat(booking.discount) || 0;
                const totalAmount = booking.total ? parseFloat(booking.total).toFixed(2) : (subtotal - discount).toFixed(2);
                return (
                  <div key={booking.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-base font-bold text-slate-800">{booking.customer_name || 'N/A'}</div>
                        {booking.mobile_number && (
                          <a href={`tel:${booking.mobile_number}`} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700">📞 {booking.mobile_number}</a>
                        )}
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[booking.status] || "text-slate-400 bg-slate-50 border-slate-200"}`}>
                        {booking.status || 'N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mb-4">
                      {[["🆔 Order ID", booking.order_id || 'N/A'], ["📅 Date", formatDate(booking.created_at)], ["📍 District", booking.district || 'N/A'], ["🏛️ State", booking.state || 'N/A'], ["💳 Payment", booking.payment_method || 'N/A'], ["💰 Total", `₹${totalAmount}`]].map(([label, value]) => (
                        <div key={label} className="bg-slate-50 rounded-lg px-2 py-1.5">
                          <div className="text-xs font-bold text-slate-400">{label}</div>
                          <div className="text-xs font-semibold text-slate-700">{value}</div>
                        </div>
                      ))}
                    </div>

                    {booking.amount_paid && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                        <div className="text-xs font-bold text-amber-600">Amount Paid: ₹{booking.amount_paid}</div>
                        {booking.transaction_id && <div className="text-xs text-amber-500 mt-0.5">TXN: {booking.transaction_id}</div>}
                      </div>
                    )}

                    <button onClick={() => generatePDF(booking)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200">
                      <FaDownload className="text-xs" /> Download PDF
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              <PaginBtn label="← Prev" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(page => (
                <PaginBtn key={page} label={page} onClick={() => setCurrentPage(page)} active={currentPage === page} />
              ))}
              <PaginBtn label="Next →" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}