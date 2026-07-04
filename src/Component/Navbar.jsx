import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Info, ShoppingCart, MapPin, ShieldCheck, PhoneCall, Menu, X, Sparkle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const C = {
  void: "#030712",
  gold: "#f59e0b",
  ink: "#f8fafc",
  border: "rgba(255,255,255,0.1)",
};

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "About", path: "/about-us", icon: Info },
  { name: "Price List", path: "/price-list", icon: ShoppingCart },
  { name: "Track", path: "/status", icon: MapPin },
  { name: "Safety", path: "/safety-tips", icon: ShieldCheck },
  { name: "Contact", path: "/contact-us", icon: PhoneCall },
];

const ITEM_SIZE = 62;
const ITEM_GAP = 12;
const FAB_SIZE = 68;
const FAB_BOTTOM = 32;

function getBottomOffset(reversedIndex) {
  return FAB_BOTTOM + FAB_SIZE + ITEM_GAP + reversedIndex * (ITEM_SIZE + ITEM_GAP);
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPriceListPage = location.pathname === "/price-list";

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveTab(path);
    setMobileOpen(false);
  };

  const reversed = [...navItems].reverse();

  return (
    <>
      {/* Desktop Navbar */}
      {!isPriceListPage && (
        <nav className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphic rounded-3xl px-8 py-5"
          >
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleNavigation("/")}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Sparkle className="w-6 h-6 text-black" />
                </div>
                <div className="font-bold text-2xl tracking-tight">SP Crackers</div>
              </div>

              {/* Navigation Links */}
              <div className="hidden lg:flex items-center gap-2">
                {navItems.map((item) => {
                  const isActive = activeTab === item.path;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.path)}
                      className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                        isActive ? "bg-white text-black" : "hover:bg-white/10"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>

              {/* Desktop Order Button */}
              <button
                onClick={() => handleNavigation("/price-list")}
                className="lg:block px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold rounded-2xl hover:scale-105 transition-transform"
              >
                Order
              </button>
            </div>
          </motion.div>
        </nav>
      )}

      {/* Mobile FAB Navigation */}
      <div className={isPriceListPage ? "" : "lg:hidden"}>
        <AnimatePresence>
          {mobileOpen &&
            reversed.map((item, ri) => {
              const Icon = item.icon;
              const isActive = activeTab === item.path;
              const bottomPx = getBottomOffset(ri);

              return (
                <motion.button
                  key={item.path}
                  initial={{ opacity: 0, scale: 0.6, bottom: FAB_BOTTOM }}
                  animate={{ opacity: 1, scale: 1, bottom: bottomPx }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => handleNavigation(item.path)}
                  style={{
                    position: "fixed",
                    right: 28,
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    borderRadius: "50%",
                    background: isActive ? "#f59e0b" : "rgba(255,255,255,0.1)",
                    border: isActive ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                    zIndex: 60,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isActive ? "#000" : "#fff",
                  }}
                >
                  <Icon size={22} />
                  <span style={{ fontSize: "9px", fontWeight: 700, marginTop: 2 }}>
                    {item.name}
                  </span>
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* Main FAB - Hamburger */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            position: "fixed",
            bottom: FAB_BOTTOM,
            right: 28,
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: "50%",
            background: mobileOpen ? "#111" : "#f59e0b",
            color: mobileOpen ? "#fff" : "#000",
            zIndex: 70,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="h-24 lg:h-0" />
    </>
  );
}