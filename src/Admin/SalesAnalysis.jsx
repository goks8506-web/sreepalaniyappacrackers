import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import { API_BASE_URL } from '../../Config';
import Sidebar from './Sidebar/Sidebar';
import Logout from './Logout';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium">
        ⚠️ An error occurred: {this.state.error?.message || 'Unknown error'}
      </div>
    );
    return this.props.children;
  }
}

const PaginBtn = ({ label, onClick, disabled, active }) => (
  <button onClick={onClick} disabled={disabled}
    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all duration-150
      ${active ? "bg-indigo-600 border-indigo-600 text-white"
      : disabled ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
      : "bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:text-indigo-600"}`}>
    {label}
  </button>
)

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
      <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
      <h2 className="text-base font-extrabold text-slate-800">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
)

const DataTable = ({ headers, rows, emptyMsg = "No data available" }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          {headers.map(h => <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            {row.map((cell, j) => <td key={j} className={`px-4 py-3 text-slate-700 font-medium ${j > 0 ? 'text-right' : ''}`}>{cell}</td>)}
          </tr>
        )) : (
          <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400 text-sm">{emptyMsg}</td></tr>
        )}
      </tbody>
    </table>
  </div>
)

export default function SalesAnalysis() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const chartsRef = useRef({});

  // ==================== NEW: Download Function ====================
  const downloadProductsCSV = () => {
    if (!salesData?.products?.length) {
      alert("No product data available to download");
      return;
    }

    const csvRows = [
      ["Product Name", "Units Sold"],
      ...salesData.products.map(p => [p.productname, p.quantity])
    ];

    const csvContent = csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `product_units_sold_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  // ============================================================

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sales-analysis/detailed`);
        if (!response.data || typeof response.data !== 'object') throw new Error('Invalid response format');
        const expectedFields = ['products', 'cities', 'trends', 'profitability', 'quotations', 'customer_types', 'cancellations'];
        if (!expectedFields.every(field => field in response.data)) throw new Error('Incomplete data received from server');
        setSalesData(response.data);
      } catch (err) { setError(`Failed to fetch sales data: ${err.message}`); }
      finally { setLoading(false); }
    };
    fetchSalesData();
  }, []);

  useEffect(() => {
    if (!salesData) return;
    Object.values(chartsRef.current).forEach(chart => chart?.destroy());

    const makeChart = (id, config) => {
      const ctx = document.getElementById(id)?.getContext('2d');
      if (ctx) chartsRef.current[id] = new Chart(ctx, config);
    };

    const tickCb = value => '₹' + value.toLocaleString('en-IN');
    const baseOpts = (legend = 'bottom') => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: legend } } });

    if (salesData.trends?.length) {
      makeChart('salesTrendChart', { type: 'line', data: { labels: salesData.trends.map(t => t.month), datasets: [{ label: 'Total Amount (₹)', data: salesData.trends.map(t => t.total_amount), borderColor: 'rgba(99,102,241,1)', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4 }, { label: 'Amount Paid (₹)', data: salesData.trends.map(t => t.amount_paid), borderColor: 'rgba(16,185,129,1)', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }] }, options: { ...baseOpts(), scales: { y: { beginAtZero: true, ticks: { callback: tickCb } } } } });
    }

    if (salesData.customer_types?.length) {
      makeChart('customerTypeChart', { type: 'bar', data: { labels: salesData.customer_types.map(ct => ct.customer_type), datasets: [{ label: 'Total Amount (₹)', data: salesData.customer_types.map(ct => ct.total_amount), backgroundColor: 'rgba(99,102,241,0.6)', borderColor: 'rgba(99,102,241,1)', borderWidth: 1 }] }, options: { ...baseOpts(), scales: { y: { beginAtZero: true, ticks: { callback: tickCb } } } } });
    }

    makeChart('quotationChart', { type: 'pie', data: { labels: ['Pending', 'Booked', 'Canceled'], datasets: [{ data: [salesData.quotations?.pending?.count || 0, salesData.quotations?.booked?.count || 0, salesData.quotations?.canceled?.count || 0], backgroundColor: ['rgba(251,191,36,0.7)', 'rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'] }] }, options: baseOpts() });

    if (salesData.cities?.length) {
      makeChart('regionalDemandChart', { type: 'bar', data: { labels: salesData.cities.map(c => c.district), datasets: [{ label: 'Total Amount (₹)', data: salesData.cities.map(c => c.total_amount), backgroundColor: 'rgba(139,92,246,0.6)', borderColor: 'rgba(139,92,246,1)', borderWidth: 1 }] }, options: { ...baseOpts(), scales: { y: { beginAtZero: true, ticks: { callback: tickCb } } } } });
    }
  }, [salesData]);

  useEffect(() => () => Object.values(chartsRef.current).forEach(chart => chart?.destroy()), []);

  const fmt = (value) => { const n = Number(value); return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  const pct = (value, total) => !total || total === 0 ? '0.00%' : ((value / total) * 100).toFixed(2) + '%';

  const totalPages = Math.ceil((Array.isArray(salesData?.products) ? salesData.products.length : 0) / itemsPerPage);
  const currentProducts = Array.isArray(salesData?.products) ? salesData.products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <Logout />
        <div className="hundred:ml-64 mobile:ml-0 mobile:px-3 w-auto">
          <div className="mx-auto px-6 py-8 w-full">

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Market Analysis Report</h1>
              <p className="text-slate-400 mt-1.5 text-sm">Sales insights, regional demand and customer analytics</p>
            </div>

            {loading && (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl mb-6">
                <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                <p className="text-slate-400 font-medium text-sm">Loading analytics...</p>
              </div>
            )}

            {error && <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3.5 rounded-xl mb-5 text-sm font-medium">⚠️ {error}</div>}

            {salesData && (
              <div className="space-y-6">

                <SectionCard title="Sales Trends Over Time">
                  <div className="h-64 mb-5">
                    <canvas id="salesTrendChart" className="w-full h-full" />
                  </div>
                  {!salesData.trends?.length && <p className="text-center text-slate-400 text-sm mb-4">No trends data available</p>}
                  <DataTable
                    headers={['Month', 'Sales Volume', 'Total Amount', 'Amount Paid']}
                    rows={salesData.trends.map(t => [t.month, t.volume, `₹${fmt(t.total_amount)}`, `₹${fmt(t.amount_paid)}`])}
                  />
                </SectionCard>

                <SectionCard title="Product Performance">
                  {/* Download Button Added Here */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={downloadProductsCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      ⬇️ Download Units Sold (CSV)
                    </button>
                  </div>

                  <DataTable
                    headers={['Product', 'Units Sold']}
                    rows={currentProducts.map(p => [p.productname, p.quantity])}
                  />
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-1.5 flex-wrap mt-4">
                      <PaginBtn label="← Prev" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                      {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 2)).map(page => (
                        <PaginBtn key={page} label={page} onClick={() => setCurrentPage(page)} active={currentPage === page} />
                      ))}
                      <PaginBtn label="Next →" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Regional Demand">
                  <div className="h-64 mb-5">
                    <canvas id="regionalDemandChart" className="w-full h-full" />
                  </div>
                  <DataTable
                    headers={['District', 'Bookings', 'Total Amount']}
                    rows={salesData.cities.map(c => [c.district, c.count, `₹${fmt(c.total_amount)}`])}
                  />
                </SectionCard>

                <SectionCard title="Profitability Analysis">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[["Total Amount", salesData.profitability.total_amount, "text-slate-800"], ["Amount Paid", salesData.profitability.amount_paid, "text-emerald-600"], ["Unpaid Amount", salesData.profitability.unpaid_amount, "text-red-500"]].map(([label, value, cls]) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
                        <div className={`text-xl font-extrabold ${cls}`}>₹{fmt(value)}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Quotation Conversion Rates">
                  <div className="h-64 mb-5">
                    <canvas id="quotationChart" className="w-full h-full" />
                  </div>
                  <DataTable
                    headers={['Status', 'Count', 'Percentage', 'Total Amount']}
                    rows={(() => {
                      const total = (salesData.quotations.pending?.count || 0) + (salesData.quotations.booked?.count || 0) + (salesData.quotations.canceled?.count || 0);
                      return ['pending', 'booked', 'canceled'].map(status => [status.charAt(0).toUpperCase() + status.slice(1), salesData.quotations[status]?.count || 0, pct(salesData.quotations[status]?.count || 0, total), `₹${fmt(salesData.quotations[status]?.total_amount || 0)}`]);
                    })()}
                  />
                </SectionCard>

                <SectionCard title="Customer Type Analysis">
                  <div className="h-64 mb-5">
                    <canvas id="customerTypeChart" className="w-full h-full" />
                  </div>
                  <DataTable
                    headers={['Customer Type', 'Bookings', 'Total Amount']}
                    rows={salesData.customer_types.map(ct => [ct.customer_type, ct.count, `₹${fmt(ct.total_amount)}`])}
                  />
                </SectionCard>

                <SectionCard title="Cancellations">
                  <DataTable
                    headers={['Order ID', 'Total', 'Date']}
                    rows={salesData.cancellations.map(c => [c.order_id, `₹${fmt(c.total)}`, new Date(c.created_at).toLocaleDateString('en-GB')])}
                    emptyMsg="No cancellations"
                  />
                </SectionCard>

              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}