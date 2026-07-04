import { motion } from "framer-motion";
import { useState, useEffect } from 'react';

const C = {
  void:       "#030712",
  glass:      "rgba(15, 23, 42, 0.8)",
  gold:       "#f59e0b",
  goldL:      "#fef08a",
  ink:        "#f8fafc",
  slate:      "#cbd5e1",
  muted:      "#64748b",
};

const LoadingSpinner = () => {
  const [showSlowNetworkMessage, setShowSlowNetworkMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowNetworkMessage(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: "fixed", 
      inset: 0, 
      display: "flex", 
      alignItems: "center",
      justifyContent: "center", 
      zIndex: 100,
      background: C.void,
    }}>
      <div className="glassmorphic rounded-3xl p-12 text-center max-w-md" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          style={{ 
            width: 80, 
            height: 80, 
            margin: "0 auto 2rem",
            border: `4px solid rgba(255,255,255,0.1)`,
            borderTop: `4px solid ${C.gold}`,
            borderRadius: "50%" 
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="display text-3xl mb-3" style={{ color: C.ink }}>
            Loading Products
          </h2>
          <p style={{ 
            color: C.slate, 
            fontSize: "15px", 
            maxWidth: 280, 
            margin: "0 auto", 
            lineHeight: 1.6 
          }}>
            {showSlowNetworkMessage
              ? "Your network is slow. Please check your connection and try again."
              : "Fetching the finest fireworks from Sivakasi…"}
          </p>
        </motion.div>

        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <div className="w-2 h-2 rounded-full" style={{ background: C.gold }} />
          <span style={{
            fontFamily: "'Syne', sans-serif", 
            fontWeight: 700,
            fontSize: "13px", 
            letterSpacing: "0.12em",
            textTransform: "uppercase", 
            color: C.gold,
          }}>
            SP CRACKERS
          </span>
          <div className="w-2 h-2 rounded-full" style={{ background: C.gold }} />
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingSpinner;