import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, Home, Users, List, Shield, Phone, MapIcon } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.pathname)

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(location.pathname)
  }, [location.pathname])

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "About", path: "/about-us", icon: Users },
    { name: "Prices", path: "/price-list", icon: List },
    { name: "Tracking", path: "/status", icon: MapIcon },
    { name: "Safety", path: "/safety-tips", icon: Shield },
    { name: "Contact", path: "/contact-us", icon: Phone },
  ]

  const handleNavigation = (path) => {
    navigate(path, { replace: true })
    window.scrollTo(0, 0)
    setActiveTab(path)
  }

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-100 px-6 py-4"
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleNavigation("/")}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  <span className="hidden sm:inline">Sree Palaniyappa Crackers</span>
                  <span className="inline sm:hidden">SP Crackers</span>
                </h1>
                <p className="text-xs text-orange-600 font-medium hidden md:block">Premium Fireworks</p>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleNavigation(item.path)}
                  className={`relative px-4 py-2 font-medium transition-all duration-300 rounded-xl group h-10 flex items-center justify-center ${
                    activeTab === item.path
                      ? "text-orange-600 bg-orange-50"
                      : "text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                  }`}
                >
                  {item.name}
                  {activeTab === item.path && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Order Now Button - Always visible */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.5 }}
              onClick={() => handleNavigation("/price-list")}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-4 py-2 md:px-6 md:py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Order Now</span>
              <span className="inline sm:hidden">Order</span>
            </motion.button>
          </div>
        </motion.div>
      </nav>

      {/* Bottom Navigation - Mobile and Tablet Only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 hidden hundred:hidden onefifty:hidden mobile:block max-w-md w-full px-5"
      >
        <div className="bg-white/95 backdrop-blur-xl shadow-lg rounded-2xl border border-orange-100 p-2 flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.path

            return (
              <div key={item.name} className="relative flex-1">
                {isActive && (
                  <motion.div
                    layoutId="activeBubble"
                    className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <button
                  onClick={() => handleNavigation(item.path)}
                  className="relative w-full p-3 flex flex-col items-center justify-center"
                >
                  <Icon className={`w-6 h-6 ${isActive ? "text-white" : "text-gray-400"} z-10`} />
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Spacer for mobile content */}
      <div className="h-20 sm:h-20 lg:h-0"></div>
    </>
  )
}