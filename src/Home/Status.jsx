import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package, Truck, CheckCircle, Clock, MapPin, Phone, Calendar, Download, ChevronDown, ChevronUp
} from "lucide-react"
import Navbar from "../Component/Navbar"
import { API_BASE_URL } from "../../Config"
import axios from 'axios'

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&family=Syne:wght@700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body { background: #030712; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
    
    .display { font-family: 'Syne', sans-serif; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; }
    .label { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: #f59e0b; }
    
    .glassmorphic {
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
  `}</style>
)

const statusConfig = {
  booked:    { color: "#52be80", bg: "rgba(82,190,128,0.12)", border: "rgba(82,190,128,0.3)", icon: CheckCircle },
  paid:      { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", icon: CheckCircle },
  packed:    { color: "#bb8fce", bg: "rgba(187,143,206,0.12)", border: "rgba(187,143,206,0.3)", icon: Package },
  dispatched:{ color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", icon: Truck },
  delivered: { color: "#52be80", bg: "rgba(82,190,128,0.12)", border: "rgba(82,190,128,0.3)", icon: CheckCircle },
}

const Status = () => {
  const [searchForm, setSearchForm] = useState({ mobile_number: "" })
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedTimelines, setExpandedTimelines] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const cleaned = value.replace(/\D/g, "").slice(-10)
    setSearchForm(prev => ({ ...prev, [name]: cleaned }))
  }

  const toggleTimeline = (orderId) => {
    setExpandedTimelines(prev => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const fetchTransportDetails = async (orderId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tracking/filtered-bookings`, {
        params: { status: 'dispatched,delivered' }
      })
      const booking = res.data.find(b => b.order_id === orderId || b.id === orderId)
      return booking ? {
        transport_name: booking.transport_name,
        lr_number: booking.lr_number,
        transport_contact: booking.transport_contact
      } : null
    } catch (error) {
      console.error("Failed to fetch transport details:", error)
      return null
    }
  }

  const searchOrders = async () => {
    if (!searchForm.mobile_number.trim()) {
      alert("Please enter mobile number")
      return
    }
    if (searchForm.mobile_number.length !== 10) {
      alert("Please enter a valid 10-digit mobile number")
      return
    }

    setIsLoading(true)
    try {
      const [bookingsRes, quotationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/direct/bookings/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchForm)
        }),
        fetch(`${API_BASE_URL}/api/direct/quotations/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchForm)
        }),
      ])

      const [bookingsData, quotationsData] = await Promise.all([bookingsRes.json(), quotationsRes.json()])

      let allOrders = [
        ...(Array.isArray(bookingsData) ? bookingsData.map(order => ({ ...order, type: "booking" })) : []),
        ...(Array.isArray(quotationsData) ? quotationsData.map(order => ({ ...order, type: "quotation" })) : []),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      allOrders = await Promise.all(allOrders.map(async (order) => {
        if ((order.status === 'dispatched' || order.status === 'delivered') && order.type === "booking") {
          const transport = await fetchTransportDetails(order.order_id)
          if (transport) return { ...order, ...transport }
        }
        return order
      }))

      setOrders(allOrders)
      setHasSearched(true)
    } catch (error) {
      console.error("Error searching orders:", error)
      alert("Error searching orders. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getOrderTimeline = (order) => {
    const timeline = [{ status: "Order Placed", date: order.created_at, completed: true, icon: Package }]

    if (["booked", "paid", "packed", "dispatched", "delivered"].includes(order.status?.toLowerCase()))
      timeline.push({ status: "Confirmed / Booked", date: order.updated_at || order.created_at, completed: true, icon: CheckCircle })

    if (["packed", "dispatched", "delivered"].includes(order.status?.toLowerCase()))
      timeline.push({ status: "Packed", date: order.processing_date || order.updated_at, completed: true, icon: Package })

    if (["dispatched", "delivered"].includes(order.status?.toLowerCase()))
      timeline.push({
        status: "Dispatched",
        date: order.dispatch_date || order.updated_at,
        completed: true,
        icon: Truck,
        transport: { company: order.transport_name, tracking_number: order.lr_number, contact: order.transport_contact }
      })

    if (order.status?.toLowerCase() === "delivered")
      timeline.push({ status: "Delivered", date: order.delivery_date || order.updated_at, completed: true, icon: CheckCircle })

    return timeline
  }

  const downloadInvoice = async (order) => {
    try {
      const endpoint = order.type === "booking" 
        ? `/api/direct/invoice/${order.order_id}` 
        : `/api/direct/quotation/${order.quotation_id}`
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${order.customer_name || 'customer'}-${order.order_id || order.quotation_id}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading invoice:", error)
      alert("Error downloading invoice. Please try again.")
    }
  }

  const formatPrice = (price) => {
    const num = Number.parseFloat(price)
    return isNaN(num) ? "0" : Math.round(num).toLocaleString('en-IN')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const hasTransportInfo = (order) => 
    (order.status?.toLowerCase() === 'dispatched' || order.status?.toLowerCase() === 'delivered') &&
    (order.transport_name || order.lr_number)

  return (
    <>
      <GlobalStyles />
      <Navbar />

      <div className="min-h-screen bg-[#030712] pb-12 pt-20">
        <main className="max-w-lg mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            <div className="text-center mb-8">
              <span className="label">TRACK ORDERS</span>
              <h1 className="display text-4xl mt-2 mb-2">Your Orders</h1>
              <p className="text-slate-400 text-[15px]">Enter mobile number to view bookings & quotations</p>
            </div>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphic rounded-3xl p-5 sm:p-6 mb-10"
            >
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="tel" 
                  name="mobile_number" 
                  placeholder="10-digit mobile number"
                  value={searchForm.mobile_number} 
                  onChange={handleInputChange} 
                  maxLength={10}
                  className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-base placeholder:text-slate-500 focus:border-[#f59e0b] focus:outline-none"
                />
              </div>
              <button 
                onClick={searchOrders} 
                disabled={isLoading} 
                className="mt-4 w-full bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold py-4 rounded-2xl transition-all text-base active:scale-[0.985]"
              >
                {isLoading ? "Searching..." : "TRACK ORDERS"}
              </button>
            </motion.div>

            <AnimatePresence>
              {hasSearched && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {orders.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      No orders found for this number.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {orders.map((order) => {
                        const key = `${order.type}-${order.id || order.order_id}`
                        const status = order.status?.toLowerCase() || "booked"
                        const cfg = statusConfig[status] || statusConfig.booked
                        const isExpanded = expandedTimelines[key]
                        const timeline = getOrderTimeline(order)

                        return (
                          <motion.div key={key} className="glassmorphic rounded-3xl overflow-hidden">
                            {/* ... same card header as before ... */}
                            <div className="p-5 sm:p-6">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 justify-between">
                                    <h3 className="text-xl font-semibold">
                                      {order.type === "booking" ? order.order_id : `#${order.quotation_id}`}
                                    </h3>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full" 
                                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                      {status.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="mt-3">
                                    <div className="text-3xl font-semibold text-white">₹{formatPrice(order.total)}</div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
                                    <Calendar size={15} />
                                    <span>{formatDate(order.created_at)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                                    <MapPin size={15} />
                                    <span>{order.district}, {order.state}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Transport & Actions remain same */}
                              {hasTransportInfo(order) && (
                                <div className="mt-5 p-4 bg-black/40 rounded-2xl border border-white/10 text-sm">
                                  <p className="text-[#f59e0b] font-semibold mb-3">🚚 Transport Details</p>
                                  <div className="space-y-1">
                                    {order.transport_name && <div><strong>Company:</strong> {order.transport_name}</div>}
                                    {order.lr_number && <div><strong>LR Number:</strong> {order.lr_number}</div>}
                                    {order.transport_contact && (
                                      <div><strong>Contact:</strong> <a href={`tel:${order.transport_contact}`} className="text-[#f59e0b]">{order.transport_contact}</a></div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-between items-center mt-6">
                                <button onClick={() => downloadInvoice(order)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                                  <Download size={18} />
                                  <span className="font-medium">Invoice</span>
                                </button>

                                <button onClick={() => toggleTimeline(key)} className="flex items-center gap-1.5 text-slate-400 hover:text-white">
                                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                              </div>
                            </div>

                            {/* Timeline */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: "auto", opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-white/10 px-5 sm:px-6 pb-6"
                                >
                                  <div className="pt-6">
                                    <h4 className="text-sm font-semibold text-[#f59e0b] mb-6 tracking-widest">ORDER TIMELINE</h4>
                                    <div className="relative pl-8 space-y-8">
                                      {timeline.map((step, index) => {
                                        const Icon = step.icon
                                        return (
                                          <div key={index} className="relative">
                                            {index !== timeline.length - 1 && (
                                              <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-white/10" />
                                            )}
                                            <div className="flex items-start gap-4">
                                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center mt-0.5">
                                                <Icon size={16} className="text-[#f59e0b]" />
                                              </div>
                                              <div className="flex-1 pt-0.5">
                                                <div className="flex justify-between">
                                                  <p className="font-medium">{step.status}</p>
                                                  <span className="text-xs text-slate-500">{formatDate(step.date)}</span>
                                                </div>
                                                {step.transport?.company && (
                                                  <div className="mt-3 p-4 bg-black/30 rounded-2xl border border-white/10 text-sm">
                                                    <div className="font-medium text-[#f59e0b] mb-2">Transport Details</div>
                                                    {step.transport.company && <div>Company: {step.transport.company}</div>}
                                                    {step.transport.tracking_number && <div>LR No: {step.transport.tracking_number}</div>}
                                                    {step.transport.contact && (
                                                      <div>Contact: <a href={`tel:${step.transport.contact}`} className="text-[#f59e0b]">{step.transport.contact}</a></div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </>
  )
}

export default Status