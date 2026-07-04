import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";

// SuccessAnimation
// Props:
//   show      — boolean controlling visibility (parent manages this)
//   onDismiss — called after the auto-dismiss timer; parent should set show=false
const SuccessAnimation = ({ show, onDismiss }) => {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDismiss?.(), 3600);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="success-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(10px)",
            padding: "1rem",
          }}
          onClick={() => onDismiss?.()}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              maxWidth: "22rem",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 32px 64px rgba(0,0,0,0.28)",
            }}
          >
            {/* Checkmark circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.25, 1] }}
              transition={{ delay: 0.1, duration: 0.55, ease: "easeOut" }}
              style={{
                width: 96,
                height: 96,
                background: "linear-gradient(135deg, #27ae60, #2e7d32)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <CheckCircle style={{ width: 52, height: 52, color: "#fff" }} />
            </motion.div>

            {/* Confetti dots */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  x: Math.cos((i / 12) * 2 * Math.PI) * (40 + i * 4),
                  y: Math.sin((i / 12) * 2 * Math.PI) * (40 + i * 4) - 20,
                }}
                transition={{ delay: 0.4 + i * 0.04, duration: 0.8 }}
                style={{
                  position: "absolute",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: ["#c0392b","#e67e22","#27ae60","#f39c12","#1565c0","#9b59b6"][i % 6],
                  top: "50%",
                  left: "50%",
                  pointerEvents: "none",
                }}
              />
            ))}

            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "1.45rem",
                color: "#2c2c2e",
                marginBottom: "0.5rem",
                letterSpacing: "-0.02em",
              }}
            >
              Order Booked!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontFamily: "'Lora', serif",
                fontSize: "14px",
                color: "#4a4a52",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
                fontStyle: "italic",
              }}
            >
              Your order has been placed successfully.<br />
              We'll contact you shortly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                color: "#e67e22",
              }}
            >
              <Sparkles style={{ width: 15, height: 15 }} />
              Thank you for choosing Sree Palaniyappa Crackers
              <Sparkles style={{ width: 15, height: 15 }} />
            </motion.div>

            {/* Progress bar showing auto-dismiss */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ delay: 0.9, duration: 2.5, ease: "linear" }}
              style={{
                marginTop: "1.5rem",
                height: 3,
                background: "#27ae60",
                borderRadius: "2px",
                transformOrigin: "left",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessAnimation;