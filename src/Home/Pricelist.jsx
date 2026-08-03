import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaMinus, FaArrowLeft, FaArrowRight, FaInfoCircle, FaExpand, FaCompress, FaDownload } from "react-icons/fa";
import { ShoppingCart, Search, Filter, X, Download, Gift, Tag, Bold } from "lucide-react";
import Navbar from "../Component/Navbar";
import { API_BASE_URL } from "../../Config";
import RocketLoader from "../Component/RocketLoader";
import ToasterNotification from "../Component/ToasterNotification";
import SuccessAnimation from "../Component/SuccessAnimation";
import ModernCarousel from "../Component/ModernCarousel";
import LoadingSpinner from "../Component/LoadingSpinner";
import jsPDF from 'jspdf';
import "../App.css";
import need from '../spc.jpg';

const C = {
  void:       "#030712", 
  glass:      "rgba(15, 23, 42, 0.45)",
  glassL:     "rgba(30, 41, 59, 0.65)",
  gold:       "#f59e0b", 
  goldL:      "#fef08a",
  neonCyan:   "#06b6d4",
  neonPurple: "#8b5cf6",
  ink:        "#f8fafc", 
  slate:      "#cbd5e1", 
  muted:      "#64748b", 
  border:     "rgba(255, 255, 255, 0.07)", 
  borderH:    "rgba(255, 255, 255, 0.18)",
}
const MIN_PURCHASE = 2000;

const GLOBAL_STYLES_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&family=Syne:wght@700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { background: #030712; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  .display { font-family: 'Syne', sans-serif; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; }
  .serif { font-family: 'Lora', serif; }
  .label { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase; color: #f59e0b; }
  .cosmic-mesh { 
    background-image: 
      radial-gradient(at 10% 15%, rgba(6, 182, 212, 0.05) 0px, transparent 50%),
      radial-gradient(at 90% 85%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
  }
  .glassmorphic {
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.07);
  }
  .pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(245, 158, 11, 0.08); color: #f59e0b; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; padding: 6px 16px; border-radius: 100px; border: 1px solid rgba(245, 158, 11, 0.15); }
  .pill-green { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
  .pill-brand { background: rgba(6, 182, 212, 0.1); color: #06b6d4; border-color: rgba(6, 182, 212, 0.2); }
  .btn-primary { display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #030712; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; padding: 16px 36px; border-radius: 12px; border: none; cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 8px 30px rgba(245, 158, 11, 0.25); }
  .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, #fef08a, #f59e0b); }
  .btn-outline { display: inline-flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.03); color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  .btn-outline:hover { background: rgba(255, 255, 255, 0.08); border-color: #f59e0b; color: #f59e0b; transform: translateY(-2px); }
  .type-chip { padding: 12px 24px; border-radius: 14px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 14px; white-space: nowrap; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(255,255,255,0.06); background: rgba(15, 23, 42, 0.4); color: #64748b; }
  .type-chip:hover { border-color: rgba(255,255,255,0.15); color: #cbd5e1; }
  .type-chip.active { background: #f59e0b; color: #030712; border-color: #f59e0b; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2); }
  .brand-chip { padding: 10px 20px; border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px; white-space: nowrap; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(255,255,255,0.06); background: rgba(15, 23, 42, 0.4); color: #64748b; }
  .brand-chip:hover { border-color: rgba(255,255,255,0.15); color: #cbd5e1; }
  .brand-chip.active { background: #06b6d4; color: #030712; border-color: #06b6d4; box-shadow: 0 8px 20px rgba(6, 182, 212, 0.2); }
  .hscroll::-webkit-scrollbar { height: 6px; }
  .hscroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
  .hscroll::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
  @keyframes pipelineShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .pipeline-fill {
    background: linear-gradient(90deg, #f59e0b 0%, #fef08a 50%, #f59e0b 100%);
    background-size: 200% auto;
    animation: pipelineShimmer 2s linear infinite;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .pipeline-fill-complete {
    background: linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%);
    background-size: 200% auto;
    animation: pipelineShimmer 2s linear infinite;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("pricelist-styles")) {
  const styleEl = document.createElement("style");
  styleEl.id = "pricelist-styles";
  styleEl.textContent = GLOBAL_STYLES_CSS;
  document.head.appendChild(styleEl);
}

const roundPrice = (v) => Math.round(parseFloat(v) || 0);
const formatPercentage = (v) => Math.round(Number.parseFloat(v)).toString();
const formatPrice = (price) => String(roundPrice(price));
const capitalize = str =>
  str ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
const serialSort = (a, b) =>
  new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare(
    a.serial_number, b.serial_number
  );

const ORDERED_TYPES = [
  "One sound crackers", "One Sound Crackers Premium", "Chorsa and Gaints","Delux Crackers",
  "Bijili Crackers","Bombs", "Paper Bombs","Twinkling Star","Rockets",
  "Kids Special","Matches","Flower Pots", "Colour Fountain Mini", "Colour Fountain Mega","Crackling Fountain",
  "Ground Chakkars", "New Arrivals", "Vip Special Crackers",
  "Sparklers","Premium Sparklers","Sky Shot Mini","Sky Shot Single", "Grand Sky Shot","Fun And Crazy Sky Shot", 
  "Repeating Shots", "Multi Shots", "Comets Sky Shots","Premium Set Out", "Fancy pencil",
  "Fountain and Fancy Novelties","Guns and Caps","Gift Boxes",
];

const MinPurchasePipeline = memo(({ subtotalRaw, onCartOpen, isUnlocked }) => {
  const progress = Math.min((subtotalRaw / MIN_PURCHASE) * 100, 100);
  const remaining = Math.max(0, MIN_PURCHASE - subtotalRaw);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="glassmorphic"
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        right: 12,
        margin: "0 auto",
        width: "auto",
        maxWidth: "42rem",
        borderRadius: "16px",
        zIndex: 55,
        color: C.ink,
        padding: "0.85rem 1.25rem",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        cursor: isUnlocked ? "pointer" : "default",
      }}
      onClick={isUnlocked ? onCartOpen : undefined}
    >
      <div style={{ 
        display: "flex", 
        flexDirection: "row",
        alignItems: "center", 
        justifyContent: "space-between", 
        marginBottom: "0.6rem", 
        gap: 12 
      }}>
        <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
          {isUnlocked ? (
            <span className="display" style={{ fontSize: "clamp(13px, 3.5vw, 16px)", color: C.gold, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              🎉 Open Cart
            </span>
          ) : (
            <span style={{ fontWeight: 700, fontSize: "clamp(12px, 3.2vw, 15px)", color: C.slate, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Add <span style={{ color: C.gold }}>₹{formatPrice(remaining)}</span> more
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: "clamp(14px, 3.8vw, 18px)", color: C.ink }}>
            ₹{formatPrice(subtotalRaw)}
            <span style={{ fontSize: "clamp(10px, 2.5vw, 12px)", color: C.muted }}>/₹{MIN_PURCHASE}</span>
          </span>
          {isUnlocked && (
            <span style={{
              borderRadius: "6px",
              background: C.gold,
              color: C.void,
              padding: "3px 8px", 
              fontSize: "11px",
              fontWeight: 800,
              whiteSpace: "nowrap"
            }}>Cart →</span>
          )}
        </div>
      </div>
      <div style={{
        height: 4,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 100,
        overflow: "hidden",
        position: "relative",
      }}>
        <div
          className={isUnlocked ? "pipeline-fill pipeline-fill-complete" : "pipeline-fill"}
          style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: 100,
          }}
        />
      </div>
    </motion.div>
  );
});
MinPurchasePipeline.displayName = "MinPurchasePipeline";

const ProductCard = memo(({ product, count, onAdd, onRemove, onShowDetails, onImageClick }) => {
  const originalPrice = roundPrice(product.price);
  const discount = originalPrice * (product.discount / 100);
  const finalPrice = product.discount > 0
    ? formatPrice(originalPrice - discount)
    : formatPrice(originalPrice);

  const isSelected = count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glassmorphic"
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        borderColor: isSelected ? C.gold : C.border,
        boxShadow: isSelected ? `0 10px 30px rgba(245, 158, 11, 0.05)` : "none",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = C.gold;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isSelected ? C.gold : C.border;
        e.currentTarget.style.transform = "";
      }}
    >
      <div style={{ position: "relative" }}>
        <ModernCarousel media={product.images} onImageClick={() => onImageClick(product.images)} />
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6, flexWrap: "wrap", zIndex: 10 }}>
          {product.discount > 0 && <span className="bg-yellow-600/70 w-15 flex justify-center rounded-full p-1 backdrop-blur-md">{formatPercentage(product.discount)}%</span>}
        </div>
        <button
          onClick={() => onShowDetails(product)}
          className="glassmorphic"
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            width: 34, height: 34, borderRadius: "10px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <FaInfoCircle style={{ color: C.gold, fontSize: 16 }} />
        </button>
      </div>
      <div className="p-6">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ color: C.gold, fontSize: "12px", trackingWith: "wider", fontWeight: 800 }}>
            {product.serial_number}
          </p>
        </div>
        
        <h3 style={{
          fontWeight: 800, fontSize: "16px", color: C.ink,
          marginBottom: "0.5rem", display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3,
        }}>{product.productname}</h3>
        
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px", marginBottom: "1.25rem" }}>
          {product.discount > 0 && (
            <span style={{ color: C.muted, fontSize: "13px", textDecoration: "line-through", fontWeight: 600 }}>
              ₹{formatPrice(originalPrice)}
            </span>
          )}
          <span style={{ fontWeight: 900, fontSize: "20px", color: C.gold, trackingWith: "tight" }}>₹{finalPrice}</span>
          <span style={{ fontSize: "11px", color: C.muted }}>/{product.per}</span>
        </div>
        
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", width: "100%" }}>
          <AnimatePresence mode="wait">
            {isSelected ? (
              <motion.div key="qty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: C.gold, borderRadius: "10px", padding: 4, width: "100%"
                }}>
                <button onClick={() => onRemove(product)} style={{
                  width: 28, height: 28, background: "rgba(3,7,18,0.2)",
                  border: "none", borderRadius: "8px", color: C.void,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FaMinus style={{ fontSize: 9 }} />
                </button>
                <span style={{
                  color: C.void, fontWeight: 800,
                  fontSize: "14px", minWidth: "1.5rem", textAlign: "center",
                }}>{count}</span>
                <button onClick={() => onAdd(product)} style={{
                  width: 28, height: 28, background: "rgba(3,7,18,0.2)",
                  border: "none", borderRadius: "8px", color: C.void,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FaPlus style={{ fontSize: 9 }} />
                </button>
              </motion.div>
            ) : (
              <motion.button key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => onAdd(product)} className="btn-outline"
                style={{ justifyContent: "center", padding: "10px", fontSize: "13px", width: '100%' }}>
                Add to Cart
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = "ProductCard";

const SPIN_COLORS = [
  "#1e293b", "#334155", "#0f172a", "#1e1b4b",
  "#311042", "#4c0519", "#064e3b", "#022c22"
];

function launchCrackerBurst(originEl) {
  if (!originEl) return;
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const CRACKER_COLORS = [
    "#f59e0b", "#06b6d4", "#8b5cf6", "#10b981", 
    "#ec4899", "#3b82f6", "#ef4444", "#f43f5e"
  ];

  function spawnBurstShell(particleCount, baseSpeed, sparkRadius, delay) {
    setTimeout(() => {
      for (let i = 0; i < particleCount; i++) {
        const el = document.createElement("div");
        const color = CRACKER_COLORS[Math.floor(Math.random() * CRACKER_COLORS.length)];
        const size = 4 + Math.random() * 5;
        
        const angle = Math.random() * 2 * Math.PI;
        const speed = (0.5 + Math.random() * 0.5) * baseSpeed;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed - (Math.random() * 20);
        
        const rotation = Math.random() * 360;
        const duration = 0.5 + Math.random() * 0.5;

        el.style.cssText = `
          position: fixed;
          left: ${cx}px;
          top: ${cy}px;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999;
          box-shadow: 0 0 10px ${color}, 0 0 15px #fff;
          opacity: 1;
          transition:
            left ${duration}s cubic-bezier(0.1, 0.8, 0.25, 1),
            top ${duration}s cubic-bezier(0.1, 0.8, 0.25, 1),
            transform ${duration}s ease-out,
            opacity ${duration}s cubic-bezier(0.8, 0, 1, 1);
        `;
        document.body.appendChild(el);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.left = `${cx + dx}px`;
            el.style.top = `${cy + dy}px`;
            el.style.transform = `rotate(${rotation}deg) scale(0.1)`;
            el.style.opacity = "0";
            setTimeout(() => el.remove(), duration * 1000);
          });
        });
      }
    }, delay);
  }

  spawnBurstShell(50, 200, 120, 0);
  spawnBurstShell(30, 280, 180, 120);
}

function getDynamicWheelFontSize(labelLength, segmentCount) {
  let baseSize = segmentCount > 6 ? 12 : 14;
  if (labelLength > 15) baseSize -= 1.5;
  return Math.max(9, baseSize);
}

const LuckySpinModal = memo(({ isOpen, onClose, freeProducts, onAddFreeProduct, onSkip, alreadyHasFree }) => {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const animFrameRef = useRef(null);

  const segments = useMemo(() => {
    if (!freeProducts || freeProducts.length === 0) return [];
    return freeProducts.slice(0, 8);
  }, [freeProducts]);

  const drawWheel = useCallback((rot = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;
    const ctx = canvas.getContext("2d");
    
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 10;
    const count = segments.length;
    const arc = (2 * Math.PI) / count;
    
    ctx.clearRect(0, 0, size, size);
    
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();

    for (let i = 0; i < count; i++) {
      const start = rot + i * arc - Math.PI / 2;
      const end = start + arc;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = SPIN_COLORS[i % SPIN_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#f8fafc";
      
      const rawLabel = segments[i]?.productname || `Gift ${i + 1}`;
      const cleanLabel = rawLabel.substring(0, 24);
      
      const fontSize = getDynamicWheelFontSize(cleanLabel.length, count);
      ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans'`;

      const words = cleanLabel.split(" ");
      if (words.length >= 2 && cleanLabel.length > 12) {
        const mid = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, mid).join(" ");
        const secondLine = words.slice(mid).join(" ");
        ctx.fillText(firstLine, r - 20, -fontSize / 2);
        ctx.fillText(secondLine, r - 20, fontSize / 2 + 2);
      } else {
        ctx.fillText(cleanLabel, r - 20, fontSize / 3);
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
    ctx.fillStyle = "#030712";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 11px 'Syne'";
    ctx.textAlign = "center";
    ctx.fillText("SPIN", cx, cy - 2);
    ctx.fillText("WIN", cx, cy + 10);
  }, [segments]);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setIsSpinning(false);
      setCurrentRotation(0);
      setTimeout(() => drawWheel(0), 100);
    }
  }, [isOpen, drawWheel]);

  const handleSpin = () => {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);
    setResult(null);
    
    const count = segments.length;
    const arc = (2 * Math.PI) / count;
    const winIndex = Math.floor(Math.random() * count);
    
    const targetAngle = -(winIndex * arc) - (arc / 2) + (Math.PI * 2 * 6);
    const totalSpin = targetAngle + (Math.random() * 0.2 - 0.1);
    const duration = 4000;
    const startTime = performance.now();
    const startRot = currentRotation;
    
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const rot = startRot + totalSpin * ease;
      
      setCurrentRotation(rot);
      drawWheel(rot);
      
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setResult(segments[winIndex]);
        launchCrackerBurst(canvasRef.current);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleClaim = () => { if (result) onAddFreeProduct(result); };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 65,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
          background: "rgba(3,7,18,0.6)", backdropFilter: "blur(12px)",
        }}
        onClick={onSkip}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          onClick={e => e.stopPropagation()}
          className="glassmorphic"
          style={{
            borderRadius: "24px", boxShadow: `0 30px 60px rgba(0,0,0,0.6)`,
            maxWidth: "25rem", width: "100%", padding: "2rem",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <span className="pill" style={{ marginBottom: "0.75rem" }}>🎁 Lucky Draw</span>
            <h2 className="display text-xl" style={{ color: C.ink, marginBottom: "0.5rem" }}>Spin &amp; Win a Gift!</h2>
            <p style={{ color: C.slate, fontSize: "14px" }}>
              {alreadyHasFree
                ? "You already claimed your free gift!"
                : segments.length > 0
                  ? `${segments.length} surprise allocations available — launch spin.`
                  : "No promotional units loaded."}
            </p>
          </div>
          
          {!alreadyHasFree && (
            <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <div style={{
                position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)",
                width: 0, height: 0,
                borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
                borderTop: `18px solid ${C.gold}`,
                zIndex: 2,
              }} />
              <canvas ref={canvasRef} width={280} height={280} style={{
                borderRadius: "50%",
                display: "block",
                width: "250px", height: "250px"
              }} />
            </div>
          )}
          
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: `1px solid rgba(16,185,129,0.2)`,
                  borderRadius: "12px", padding: "14px",
                  marginBottom: "1.25rem", textAlign: "center",
                }}
              >
                <p style={{ color: C.green, fontSize: "11px", fontWeight: 800, trackingWith: "widest", uppercase: "true", marginBottom: 4 }}>🎉 COMPLEMENTARY ALLOCATION</p>
                <p style={{ fontWeight: 800, color: C.ink, fontSize: "15px" }}>
                  {result.productname}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onSkip} className="btn-outline" style={{ flex: 1, justifyContent: "center", borderRadius: "12px" }}>Skip</button>
            {alreadyHasFree ? (
              <button onClick={onSkip} className="btn-primary" style={{ flex: 2, justifyContent: "center", borderRadius: "12px" }}>Continue</button>
            ) : result ? (
              <button onClick={handleClaim} className="btn-primary" style={{ flex: 2, justifyContent: "center", borderRadius: "12px", background: "linear-gradient(135deg, #10b981, #059669)" }}>Claim &amp; Continue</button>
            ) : (
              <button onClick={handleSpin} disabled={isSpinning || segments.length === 0} className="btn-primary" style={{ flex: 2, justifyContent: "center", borderRadius: "12px" }}>
                {isSpinning ? "Spinning…" : "🎰 Trigger Spin"}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
LuckySpinModal.displayName = "LuckySpinModal";

const Pricelist = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [freeCartItem, setFreeCartItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isExpandedCart, setIsExpandedCart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMinOrderModal, setShowMinOrderModal] = useState(false);
  const [minOrderMessage, setMinOrderMessage] = useState("");
  const [showToaster, setShowToaster] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    customer_name: "", address: "", district: "", state: "",
    mobile_number: "", email: "", customer_type: "User",
  });
  const [selectedType, setSelectedType] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [brandSearchInput, setBrandSearchInput] = useState("");
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [promocode, setPromocode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [promocodes, setPromocodes] = useState([]);
  const [showLoader, setShowLoader] = useState(false);
  const searchDebounce = useRef(null);
  const brandDebounce = useRef(null);
  const promoDebounce = useRef(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiBudget, setAiBudget] = useState("");
  const [aiPreferences, setAiPreferences] = useState({
    kids: false, sound: false, night: false, kidsnight: false,
  });
  const [suggestedCart, setSuggestedCart] = useState({});
  const typeScrollRef = useRef(null);

  const handleSearchInputChange = useCallback((e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setSearchTerm(val), 220);
  }, []);

  const handleBrandSearchInputChange = useCallback((e) => {
    const val = e.target.value;
    setBrandSearchInput(val);
    setSelectedBrand("All");
    clearTimeout(brandDebounce.current);
    brandDebounce.current = setTimeout(() => setBrandSearchTerm(val), 220);
  }, []);

  const clearSearch = useCallback(() => { setSearchInput(""); setSearchTerm(""); }, []);
  const clearBrandSearch = useCallback(() => { setBrandSearchInput(""); setBrandSearchTerm(""); }, []);

  const showError = useCallback((message) => {
    setMinOrderMessage(message);
    setShowMinOrderModal(true);
    setTimeout(() => setShowMinOrderModal(false), 5000);
  }, []);

  const freeProductsList = useMemo(
    () => products.filter(p =>
      (typeof p.status === "string" && p.status.toLowerCase() === "free") ||
      p.free === true || p.is_free === true
    ),
    [products]
  );

  const brandList = useMemo(() => {
    const brands = new Set();
    products.forEach(p => { if (p.brand && p.brand.trim()) brands.add(p.brand.trim()); });
    return ["All", ...Array.from(brands).sort()];
  }, [products]);

  const downloadPDF = useCallback(async () => {
    if (!products.length) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yOffset = 20;
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.setTextColor(192, 57, 43);
    doc.text('SRI PALANIYAPPA CRACKERS', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 70);
    doc.text('Website - www.sripalaniyappacrackers.com', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 8;
    doc.text('Retail Pricelist - 2026', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 8;
    doc.text('Contact Number - +91 81242 5943', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 20;

    const fetchImageAsBase64 = (url) => new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image(); img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX = 80; let w = img.naturalWidth, h = img.naturalHeight;
          if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
          else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null); img.src = url;
    });

    const imageCache = {};
    const allProducts = ORDERED_TYPES.flatMap(type => {
      const typeKey = type.replace(/ /g, "_").toLowerCase();
      return products.filter(p => p.product_type.toLowerCase() === typeKey);
    });
    await Promise.all(allProducts.map(async (product) => {
      const images = Array.isArray(product.images) ? product.images : [];
      const imgUrl = images.find(img => img && !img.includes('/video/') && !img.toLowerCase().endsWith('.gif'));
      if (imgUrl) imageCache[product.serial_number] = await fetchImageAsBase64(imgUrl);
    }));

    const ROW_HEIGHT = 18; const IMG_SIZE = 14;
    for (const type of ORDERED_TYPES) {
      const typeKey = type.replace(/ /g, "_").toLowerCase();
      const typeProducts = products.filter(p => p.product_type.toLowerCase() === typeKey).sort(serialSort);
      if (!typeProducts.length) continue;
      const sectionHeaderHeight = 10;
      if (yOffset + sectionHeaderHeight > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); yOffset = 20; }
      doc.setFillColor(220, 220, 220); doc.rect(10, yOffset, pageWidth - 20, sectionHeaderHeight, 'F');
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40);
      doc.text(capitalize(type), 14, yOffset + 7); yOffset += sectionHeaderHeight + 1;
      const colHeaderHeight = 8;
      doc.setFillColor(192, 57, 43); doc.rect(10, yOffset, pageWidth - 20, colHeaderHeight, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      const cols = { sl: 12, code: 23, img: 39, name: 61, rate: 131, disc: 152, per: 176 };
      doc.text('Sl', cols.sl, yOffset + 5.5); doc.text('Code', cols.code, yOffset + 5.5);
      doc.text('Image', cols.img, yOffset + 5.5); doc.text('Product Name', cols.name, yOffset + 5.5);
      doc.text('Rate', cols.rate, yOffset + 5.5); doc.text('Disc. Rate', cols.disc, yOffset + 5.5);
      doc.text('Per', cols.per, yOffset + 5.5); yOffset += colHeaderHeight + 1;
      let slNo = 1;
      for (const product of typeProducts) {
        if (yOffset + ROW_HEIGHT > doc.internal.pageSize.getHeight() - 15) { doc.addPage(); yOffset = 20; }
        const discount = roundPrice(product.price) * (product.discount / 100);
        const discountedRate = roundPrice(product.price) - discount;
        if (slNo % 2 === 0) { doc.setFillColor(255, 247, 237); doc.rect(10, yOffset, pageWidth - 20, ROW_HEIGHT, 'F'); }
        doc.setDrawColor(220, 220, 220); doc.rect(10, yOffset, pageWidth - 20, ROW_HEIGHT);
        [21, 37, 59, 129, 150, 173].forEach(x => doc.line(x, yOffset, x, yOffset + ROW_HEIGHT));
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(50, 50, 50);
        const textY = yOffset + ROW_HEIGHT / 2 + 1.5;
        doc.text(String(slNo++), cols.sl, textY);
        doc.text(product.serial_number || '', cols.code, textY);
        const nameLines = doc.splitTextToSize(product.productname, 66);
        const nameY = nameLines.length > 1 ? yOffset + 5 : textY;
        doc.text(nameLines.slice(0, 2), cols.name, nameY);
        doc.setTextColor(192, 57, 43);
        doc.text(`Rs.${formatPrice(product.price)}`, cols.rate, textY);
        doc.setTextColor(46, 125, 50);
        doc.text(`Rs.${formatPrice(discountedRate)}`, cols.disc, textY);
        doc.setTextColor(50, 50, 50);
        doc.text(product.per || '', cols.per, textY);
        const imgData = imageCache[product.serial_number];
        if (imgData) {
          try { doc.addImage(imgData, 'JPEG', cols.img - 1, yOffset + (ROW_HEIGHT - IMG_SIZE) / 2, IMG_SIZE, IMG_SIZE); } catch {}
        } else {
          doc.setFillColor(245, 245, 245);
          doc.rect(cols.img - 1, yOffset + (ROW_HEIGHT - IMG_SIZE) / 2, IMG_SIZE, IMG_SIZE, 'F');
          doc.setFontSize(6); doc.setTextColor(180, 180, 180);
          doc.text('No img', cols.img + 2, yOffset + ROW_HEIGHT / 2 + 1);
        }
        yOffset += ROW_HEIGHT;
      }
      yOffset += 6;
    }
    doc.save('SPC_Pricelist_2026.pdf');
  }, [products]);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const savedCart = localStorage.getItem("firecracker-cart");
        if (savedCart) setCart(JSON.parse(savedCart));
        const savedFree = localStorage.getItem("firecracker-free-cart");
        if (savedFree) {
          const parsed = JSON.parse(savedFree);
          setFreeCartItem(Array.isArray(parsed) ? (parsed[0] || null) : parsed);
        }
        const [statesRes, productsRes, promocodesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/locations/states`),
          fetch(`${API_BASE_URL}/api/products`),
          fetch(`${API_BASE_URL}/api/promocodes`),
        ]);
        const [statesData, productsData, promocodesData] = await Promise.all([
          statesRes.json(), productsRes.json(), promocodesRes.json(),
        ]);
        setStates(Array.isArray(statesData) ? statesData : []);
        const naturalSort = (a, b) =>
          new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }).compare(a.productname, b.productname);
        const seenSerials = new Set();
        const normalizedProducts = productsData.data
          .filter(p => !seenSerials.has(p.serial_number) && seenSerials.add(p.serial_number))
          .map(product => ({
            ...product,
            images: product.image
              ? (typeof product.image === "string" ? JSON.parse(product.image) : product.image)
              : [],
          }))
          .sort(naturalSort);
        setProducts(normalizedProducts);
        setPromocodes(Array.isArray(promocodesData) ? promocodesData : []);
      } catch (err) { console.error(err); }
      finally { setTimeout(() => setIsLoading(false), 1500); }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (customerDetails.state) {
      fetch(`${API_BASE_URL}/api/locations/states/${customerDetails.state}/districts`)
        .then(res => res.json()).then(data => setDistricts(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
    }
  }, [customerDetails.state]);

  useEffect(() => { localStorage.setItem("firecracker-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("firecracker-free-cart", JSON.stringify(freeCartItem)); }, [freeCartItem]);

  const handleApplyPromo = useCallback((code) => {
    if (!code) { setAppliedPromo(null); return; }
    const found = promocodes.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (!found) { showError("Invalid promocode."); return; }
    if (found.end_date && new Date(found.end_date) < new Date()) {
      showError("This promocode has expired."); return;
    }
    setAppliedPromo(found);
  }, [promocodes, showError]);

  useEffect(() => {
    clearTimeout(promoDebounce.current);
    promoDebounce.current = setTimeout(() => {
      if (promocode && promocode !== "custom") handleApplyPromo(promocode);
      else setAppliedPromo(null);
    }, 500);
    return () => clearTimeout(promoDebounce.current);
  }, [promocode, handleApplyPromo]);

  const addToCart = useCallback((product) => {
    if (!product?.serial_number) return;
    if (typeof product.status === "string" && product.status.toLowerCase() === "free") return;
    setCart(prev => ({ ...prev, [product.serial_number]: (prev[product.serial_number] || 0) + 1 }));
  }, []);

  const removeFromCart = useCallback((product) => {
    if (!product?.serial_number) return;
    setCart(prev => {
      const count = (prev[product.serial_number] || 1) - 1;
      const updated = { ...prev };
      if (count <= 0) delete updated[product.serial_number];
      else updated[product.serial_number] = count;
      return updated;
    });
  }, []);

  const updateCartQuantity = useCallback((product, quantity) => {
    if (!product?.serial_number) return;
    if (quantity < 0) quantity = 0;
    setCart(prev => {
      const updated = { ...prev };
      if (quantity === 0) delete updated[product.serial_number];
      else updated[product.serial_number] = quantity;
      return updated;
    });
  }, []);

  const removeFreeItem = useCallback(() => setFreeCartItem(null), []);

  const addToSuggestedCart = useCallback((product) => {
    if (!product?.serial_number) return;
    setSuggestedCart(prev => ({ ...prev, [product.serial_number]: (prev[product.serial_number] || 0) + 1 }));
  }, []);

  const removeFromSuggestedCart = useCallback((product) => {
    if (!product?.serial_number) return;
    setSuggestedCart(prev => {
      const count = (prev[product.serial_number] || 1) - 1;
      const updated = { ...prev };
      if (count <= 0) delete updated[product.serial_number];
      else updated[product.serial_number] = count;
      return updated;
    });
  }, []);

  const generateSuggestions = useCallback(() => {
    const budget = Number(aiBudget);
    if (!budget || budget <= 0) { showError("Please enter a valid budget"); return; }
    const categories = {
      kids: ["new_arrivals", "fancy_pencil", "twinkling_star", "guns_and_caps", "matches", "kids_special"],
      sound: ["bombs", "paper_bombs", "chorsa_and_gaints", "one_sound_crackers_premium", "one_sound_crackers", "delux_crackers", "bijili_crackers", "vip_special_crackers"],
      night: ["repeating_shots", "multi_shots", "comets_sky_shots", "sky_shot_mini", "sky_shot_single", "grand_sky_shot", "fun_and_crazy_sky_shot", "premium_set_out", "rockets", "new_arrivals"],
      kidsnight: ["fountain_and_fancy_novelties", "flower_pots", "ground_chakkars", "sparklers", "premium_sparklers", "colour_fountain_mini", "colour_fountain_mega", "crackling_fountain"],
    };
    const selectedPrefs = ["night", "kids", "sound", "kidsnight"].filter(p => aiPreferences[p]);
    if (!selectedPrefs.length) { showError("Select at least one preference"); return; }

    const budgetPerPref = budget / selectedPrefs.length;
    const tempCart = {};
    const sparklerSizeCount = {};
    const getSparklerSize = name => { const m = name?.match(/(\d+)\s*cm/i); return m ? m[1] : null; };

    const MAX_QTY_RATIO = 0.2;
    const MIN_REMAINING_RATIO = 0.02;

    for (const pref of selectedPrefs) {
      const types = categories[pref];
      const byType = {};
      for (const type of types) byType[type] = [];

      products.filter(p =>
        types.includes(p.product_type?.toLowerCase()) &&
        !(typeof p.status === "string" && p.status.toLowerCase() === "free")
      ).forEach(p => {
        const type = p.product_type?.toLowerCase();
        if (byType[type]) byType[type].push({ ...p, finalPrice: roundPrice(p.price) * (1 - (p.discount || 0) / 100) });
      });

      for (const type of types) {
        byType[type].sort(() => Math.random() - 0.5).sort((a, b) => {
          const d = a.finalPrice - b.finalPrice;
          return Math.abs(d) < 50 ? Math.random() - 0.5 : d;
        });
      }

      const canAddSparkler = (p) => {
        if (p.product_type !== "sparklers" && p.product_type !== "premium_sparklers") return true;
        const size = getSparklerSize(p.productname) || "unknown";
        return (sparklerSizeCount[size] || 0) < 3;
      };
      const registerSparkler = (p) => {
        if (p.product_type !== "sparklers" && p.product_type !== "premium_sparklers") return;
        const size = getSparklerSize(p.productname) || "unknown";
        sparklerSizeCount[size] = (sparklerSizeCount[size] || 0) + 1;
      };

      let prefSpent = 0;

      for (const type of types) {
        const candidate = byType[type].find(p => p.finalPrice > 0 && !tempCart[p.serial_number] && canAddSparkler(p));
        if (!candidate) continue;
        const remaining = budgetPerPref - prefSpent;
        if (candidate.finalPrice > remaining) continue;
        tempCart[candidate.serial_number] = 1;
        prefSpent += candidate.finalPrice;
        registerSparkler(candidate);
      }

      const allCandidates = types.flatMap(type => byType[type]).filter(p => p.finalPrice > 0);
      allCandidates.sort((a, b) => a.finalPrice - b.finalPrice);
      const cheapestPrice = allCandidates.length ? allCandidates[0].finalPrice : Infinity;
      const stopThreshold = Math.min(budgetPerPref * MIN_REMAINING_RATIO, cheapestPrice * 0.9);

      let safetyLimit = 2000;
      while (budgetPerPref - prefSpent > stopThreshold && safetyLimit-- > 0) {
        const remaining = budgetPerPref - prefSpent;
        const shuffled = [...allCandidates].sort(() => Math.random() - 0.5);
        let added = false;

        for (const p of shuffled) {
          if (p.finalPrice > remaining) continue;
          const currentQty = tempCart[p.serial_number] || 0;
          const maxQty = Math.max(1, Math.floor((budgetPerPref * MAX_QTY_RATIO) / p.finalPrice));
          if (currentQty >= maxQty) continue;
          if (currentQty === 0 && !canAddSparkler(p)) continue;

          tempCart[p.serial_number] = currentQty + 1;
          prefSpent += p.finalPrice;
          if (currentQty === 0) registerSparkler(p);
          added = true;
          break;
        }

        if (!added) break;
      }
    }

    setSuggestedCart(tempCart);
  }, [aiBudget, aiPreferences, products, showError]);

  const handleAiNext = useCallback(() => {
    if (aiStep === 0 && !aiBudget) return showError("Please enter a budget.");
    if (aiStep < 2) setAiStep(s => s + 1);
    else generateSuggestions();
  }, [aiStep, aiBudget, generateSuggestions, showError]);

  const handleAiBack = useCallback(() => {
    if (aiStep > 0) { if (aiStep === 2) setSuggestedCart({}); setAiStep(s => s - 1); }
  }, [aiStep]);

  const addSuggestedToCart = useCallback(() => {
    setCart(prev => {
      const updated = { ...prev };
      Object.entries(suggestedCart).forEach(([serial, qty]) => {
        updated[serial] = (updated[serial] || 0) + qty;
      });
      return updated;
    });
    setShowAiModal(false); setAiStep(0); setAiBudget("");
    setAiPreferences({ kids: false, sound: false, night: false, kidsnight: false });
    setSuggestedCart({});
  }, [suggestedCart]);

  const totals = useMemo(() => {
    let net = 0, productDiscount = 0, subtotal = 0, promoDiscount = 0;
    for (const serial in cart) {
      const qty = cart[serial];
      const p = products.find(x => x.serial_number === serial);
      if (!p) continue;
      const orig = roundPrice(p.price);
      const disc = orig * (p.discount / 100);
      const after = orig - disc;
      net += orig * qty;
      productDiscount += disc * qty;
      subtotal += after * qty;
      if (appliedPromo && (!appliedPromo.product_type || p.product_type === appliedPromo.product_type))
        promoDiscount += (after * qty * appliedPromo.discount) / 100;
    }
    const afterPromo = subtotal - promoDiscount;
    const fee = afterPromo * 0.01;
    const total = afterPromo + fee;
    const save = productDiscount + promoDiscount;
    return {
      net: formatPrice(net),
      save: formatPrice(save),
      total: formatPrice(total),
      promo_discount: formatPrice(promoDiscount),
      product_discount: formatPrice(productDiscount),
      processing_fee: formatPrice(fee),
      originalTotal: subtotal,
      totalDiscount: productDiscount,
      subtotalRaw: subtotal,
    };
  }, [cart, products, appliedPromo]);

  const isCartUnlocked = totals.subtotalRaw >= MIN_PURCHASE;

  const handleCheckoutClick = useCallback(() => {
    if (!Object.keys(cart).length) { showError("Your cart is empty."); return; }
    if (!isCartUnlocked) {
      showError(`Minimum purchase is ₹${MIN_PURCHASE}. Add ₹${formatPrice(MIN_PURCHASE - totals.subtotalRaw)} more to proceed.`);
      return;
    }
    setIsCartOpen(false);
    if (totals.subtotalRaw > 3000) {
      setShowSpinModal(true);
    } else {
      setShowModal(true);
    }
  }, [cart, totals.subtotalRaw, isCartUnlocked, showError]);

  const handleSpinSkip = useCallback(() => {
    setShowSpinModal(false);
    setShowModal(true);
  }, []);

  const handleAddFreeProduct = useCallback((product) => {
    setFreeCartItem({ ...product, price: 0, is_free: true, quantity: 1 });
    setShowSpinModal(false);
    setShowModal(true);
  }, []);

  const handleRocketComplete = useCallback(() => {
    setShowLoader(false);
    setIsBookingLoading(false);
    setIsCartOpen(false);
    setShowModal(false);
    setShowSpinModal(false);
    setShowDetailsModal(false);
    setShowMinOrderModal(false);
    setIsExpandedCart(false);
    setCart({});
    setFreeCartItem(null);
    setCustomerDetails({
      customer_name: "", address: "", district: "", state: "",
      mobile_number: "", email: "", customer_type: "User",
    });
    setAppliedPromo(null);
    setPromocode("");
    setShowSuccess(true);
    setShowToaster(true);
  }, []);

  const handleFinalCheckout = useCallback(async () => {
    setIsBookingLoading(true);
    const order_id = `ORD-${Date.now()}`;
    const selectedProducts = Object.entries(cart).map(([serial, qty]) => {
      const product = products.find(p => p.serial_number === serial);
      return {
        id: product.id, product_type: product.product_type, quantity: qty,
        per: product.per, price: roundPrice(product.price), discount: product.discount,
        serial_number: product.serial_number, productname: product.productname,
        status: product.status,
      };
    });
    const freeProductPayload = freeCartItem ? [{
      id: freeCartItem.id, product_type: freeCartItem.product_type, quantity: 1,
      per: freeCartItem.per, price: 0, discount: 0,
      serial_number: freeCartItem.serial_number, productname: freeCartItem.productname,
      status: "free", is_free: true,
    }] : [];
    const allProducts = [...selectedProducts, ...freeProductPayload];
    if (!allProducts.length) { showError("Your cart is empty."); setIsBookingLoading(false); return; }
    if (!customerDetails.customer_name || !customerDetails.address ||
        !customerDetails.district || !customerDetails.state || !customerDetails.mobile_number) {
      showError("Please fill all required customer details."); setIsBookingLoading(false); return;
    }
    const mobile = customerDetails.mobile_number.replace(/\D/g, "").slice(-10);
    if (mobile.length !== 10) { showError("Mobile number must be 10 digits."); setIsBookingLoading(false); return; }
    const selectedState = customerDetails.state?.trim();
    const minOrder = states.find(s => s.name === selectedState)?.min_rate;
    if (minOrder && totals.originalTotal < minOrder) {
      showError(`Minimum order for ${selectedState} is ₹${minOrder}. Your total is ₹${formatPrice(totals.originalTotal)}.`);
      setIsBookingLoading(false); return;
    }
    try {
      setShowLoader(true);

      const bookingResponse = await fetch(`${API_BASE_URL}/api/direct/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id,
          products: allProducts,
          net_rate: Number(totals.net),
          you_save: Number(totals.save),
          processing_fee: Number(totals.processing_fee),
          total: Number(totals.total),
          promo_discount: Number(totals.promo_discount || "0"),
          free_item: freeCartItem ? {
            serial_number: freeCartItem.serial_number,
            productname: freeCartItem.productname,
            price: 0,
          } : null,
          customer_type: customerDetails.customer_type,
          customer_name: customerDetails.customer_name,
          address: customerDetails.address,
          mobile_number: mobile,
          email: customerDetails.email,
          district: customerDetails.district,
          state: customerDetails.state,
          promocode: appliedPromo?.code || null,
        }),
      });

      if (!bookingResponse.ok) {
        const errData = await bookingResponse.json();
        showError(errData.message || "Booking failed.");
        setShowLoader(false);
        setIsBookingLoading(false);
        return;
      }

      const bookingData = await bookingResponse.json();
      const confirmedOrderId = bookingData.order_id;

      const pdfResponse = await fetch(`${API_BASE_URL}/api/direct/invoice/${confirmedOrderId}`);
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const safeName = (customerDetails.customer_name || "order").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        link.download = `${safeName}-${confirmedOrderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      handleRocketComplete();

    } catch (err) {
      showError("Something went wrong during checkout.");
      setShowLoader(false);
      setIsBookingLoading(false);
    }
  }, [cart, products, freeCartItem, customerDetails, states, totals, appliedPromo, showError, handleRocketComplete]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "mobile_number") {
      const cleaned = value.replace(/\D/g, "").slice(-10);
      setCustomerDetails(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setCustomerDetails(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleShowDetails = useCallback((product) => {
    setSelectedProduct(product); setShowDetailsModal(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedProduct(null); setShowDetailsModal(false);
  }, []);

  const handleImageClick = useCallback((media) => {
    const items = Array.isArray(media) ? media : [];
    setSelectedImages(items); setCurrentImageIndex(0); setShowImageModal(true);
  }, []);

  const handleCloseImageModal = useCallback(() => {
    setShowImageModal(false); setSelectedImages([]); setCurrentImageIndex(0);
  }, []);

  const productTypes = useMemo(() => {
    const available = [...new Set(
      products
        .filter(p => p.product_type !== "gift_box_dealers")
        .map(p => p.product_type || "Others")
    )];
    const filtered = ORDERED_TYPES.filter(t => available.includes(t.replace(/ /g, "_").toLowerCase()));
    return ["All", ...filtered];
  }, [products]);

  const grouped = useMemo(() => {
    const result = products.filter(p =>
      p.product_type !== "gift_box_dealers" &&
      !(typeof p.status === "string" && p.status.toLowerCase() === "free") &&
      (selectedType === "All" || p.product_type === selectedType.replace(/ /g, "_").toLowerCase()) &&
      (selectedBrand === "All" || (p.brand && p.brand.trim() === selectedBrand)) &&
      (!searchTerm || p.productname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!brandSearchTerm || (p.brand && p.brand.toLowerCase().includes(brandSearchTerm.toLowerCase())))
    ).reduce((acc, p) => {
      const key = p.product_type || "Others";
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    }, {});
    const orderedResult = {};
    ORDERED_TYPES.map(t => t.replace(/ /g, "_").toLowerCase()).forEach(t => {
      if (result[t]) orderedResult[t] = result[t].sort(serialSort);
    });
    return orderedResult;
  }, [products, selectedType, selectedBrand, searchTerm, brandSearchTerm]);

  const suggestedTotals = useMemo(() => {
    let total = 0;
    for (const serial in suggestedCart) {
      const qty = suggestedCart[serial];
      const p = products.find(x => x.serial_number === serial);
      if (!p) continue;
      total += (roundPrice(p.price) * (1 - p.discount / 100)) * qty;
    }
    return formatPrice(total);
  }, [suggestedCart, products]);

  const cartItemCount = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart]
  );

  if (isLoading) return <LoadingSpinner />;

  const SummaryRows = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px" }}>
      {[
        { label: "Net Total", val: `₹${totals.net}`, color: C.ink },
        { label: "Product Discount", val: `−₹${totals.product_discount}`, color: "#ef4444" },
        ...(appliedPromo ? [{ label: `Promo (${appliedPromo.code})`, val: `−₹${totals.promo_discount}`, color: "#ef4444" }] : []),
        { label: "You Save", val: `−₹${totals.save}`, color: "#10b981" },
        { label: "Processing Fee (1%)", val: `₹${totals.processing_fee}`, color: C.slate },
      ].map(({ label, val, color }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", color, fontWeight: 500 }}>
          <span>{label}</span><span>{val}</span>
        </div>
      ))}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontWeight: 800, fontSize: "16px",
        paddingTop: "0.75rem", borderTop: `1px solid rgba(255,255,255,0.06)`, color: C.gold,
      }}>
        <span>Total Payable</span><span>₹{totals.total}</span>
      </div>
    </div>
  );

  const PromoSelector = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {promocode === "custom" && (
        <input type="text" value="" onChange={e => setPromocode(e.target.value)}
          placeholder="Enter tracking coupon"
          style={{
            width: "100%", padding: "10px 14px",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
            background: "rgba(3,7,18,0.3)",
            fontSize: "13px", color: C.ink,
          }} />
      )}
      {appliedPromo && (
        <p style={{
          color: C.green, fontSize: "12px", fontWeight: 600,
          background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)",
          borderRadius: "8px", padding: "8px 12px",
        }}>
          ✓ {appliedPromo.code} — {formatPercentage(appliedPromo.discount)}% Certification Applied
        </p>
      )}
    </div>
  );

  return (
    <>
      {cartItemCount > 0 && (
        <MinPurchasePipeline
          subtotalRaw={totals.subtotalRaw}
          onCartOpen={() => setIsCartOpen(true)}
          isUnlocked={isCartUnlocked}
        />
      )} 
      
      <div className={`${isCartOpen ? 'mobile:hidden' : ''}`}>
        <Navbar/>
      </div>

      <ToasterNotification show={showToaster} onClose={() => setShowToaster(false)} />
      <SuccessAnimation show={showSuccess} onDismiss={() => setShowSuccess(false)} />

      <LuckySpinModal
        isOpen={showSpinModal}
        onClose={handleSpinSkip}
        freeProducts={freeProductsList}
        onAddFreeProduct={handleAddFreeProduct}
        onSkip={handleSpinSkip}
        alreadyHasFree={!!freeCartItem}
      />

      <AnimatePresence>
        {showLoader && <RocketLoader onComplete={handleRocketComplete} />}

        {showMinOrderModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[96] px-4 backdrop-blur-md"
            style={{ background: "rgba(3,7,18,0.6)" }}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="glassmorphic p-8 text-center"
              style={{ borderRadius: "20px", maxWidth: "380px", width: "100%", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
              <div style={{
                width: 44, height: 44, background: `rgba(239,68,68,0.08)`,
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: "10px", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 1.25rem",
              }}>
                <X style={{ color: "#ef4444", width: 20, height: 20 }} />
              </div>
              <h3 className="display text-xl" style={{ color: C.ink, marginBottom: "0.5rem" }}>Validation Error</h3>
              <p style={{ color: C.slate, fontSize: "14px", lineHeight: 1.6, marginBottom: "1.5rem" }}>{minOrderMessage}</p>
              <button onClick={() => setShowMinOrderModal(false)} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>Acknowledge</button>
            </motion.div>
          </motion.div>
        )}

        {showDetailsModal && selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md"
            style={{ background: "rgba(3,7,18,0.6)" }}
            onClick={handleCloseDetails}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glassmorphic max-w-lg w-full max-h-[85vh] overflow-y-auto"
              style={{ borderRadius: "20px", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
              <div style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                  <div>
                    <h2 className="display text-2xl" style={{ color: C.ink, marginBottom: "0.5rem" }}>
                      {selectedProduct.productname}
                    </h2>
                    {selectedProduct.brand && (
                      <span className="pill pill-brand" style={{ marginBottom: 8 }}>
                        <Tag style={{ width: 12, height: 12 }} /> {selectedProduct.brand}
                      </span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                      {selectedProduct.discount > 0 && <span className="pill">{formatPercentage(selectedProduct.discount)}% OFF</span>}
                      <span style={{ fontWeight: 900, fontSize: "24px", color: C.gold, trackingWith: "tight" }}>
                        ₹{formatPrice(roundPrice(selectedProduct.price) * (1 - selectedProduct.discount / 100))}
                      </span>
                    </div>
                  </div>
                  <button onClick={handleCloseDetails} className="glassmorphic" style={{
                    width: 34, height: 34, borderRadius: "10px",
                    color: C.slate, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>×</button>
                </div>
                <ModernCarousel media={selectedProduct.images} onImageClick={handleImageClick} />
                <h3 className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: C.gold }}>Specification Parameters</h3>
                <p className="mb-6 text-sm leading-relaxed" style={{ color: C.slate }}>
                  {selectedProduct.description || "A premium quality firework crafted for your most memorable celebrations."}
                </p>
                <button onClick={() => { addToCart(selectedProduct); handleCloseDetails(); }} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <FaPlus style={{ width: 12, height: 12 }} /> Add to Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-md"
            style={{ background: "rgba(3,7,18,0.5)" }}
            onClick={() => { setIsCartOpen(false); setIsExpandedCart(false); }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="mobile:rounded-t-2xl mobile:w-full glassmorphic"
              style={{
                borderRadius: "24px 24px 0 0",
                boxShadow: `0 -10px 50px rgba(0,0,0,0.5)`,
                width: "100%",
                maxWidth: isExpandedCart ? "56rem" : "32rem",
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(3,7,18,0.2)",
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32,
                    background: `rgba(245,158,11,0.05)`,
                    border: `1px solid rgba(245,158,11,0.2)`, borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <ShoppingCart style={{ width: 14, height: 14, color: C.gold }} />
                  </div>
                  <div>
                    <p className="display" style={{ fontSize: "15px", color: C.ink }}>Selected Products</p>
                    <p style={{ fontSize: "11px", color: C.slate }}>
                      {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}{freeCartItem ? " + 1 promotional module 🎁" : ""}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {!isExpandedCart && Object.keys(cart).length > 0 && (
                    <button onClick={() => setIsExpandedCart(true)} className="glassmorphic" style={{
                      width: 28, height: 28, borderRadius: "8px",
                      color: C.slate, cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <FaExpand style={{ fontSize: 10 }} />
                    </button>
                  )}
                  <button onClick={() => { setIsCartOpen(false); setIsExpandedCart(false); }} className="glassmorphic" style={{
                    width: 28, height: 28, borderRadius: "8px",
                    color: C.slate, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>×</button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: 8, WebkitOverflowScrolling: "touch" }}>
                {Object.keys(cart).length === 0 && !freeCartItem ? (
                  <div style={{ textAlign: "center", padding: "3rem 0" }}>
                    <ShoppingCart style={{ width: 24, height: 24, color: C.muted, margin: "0 auto 0.75rem", opacity: 0.3 }} />
                    <p className="display text-base" style={{ color: C.muted }}>Registry Empty</p>
                    <p className="serif" style={{ color: C.muted, fontSize: "13px", fontStyle: "italic", marginTop: 4 }}>
                      Add items to populate logistics parameters
                    </p>
                  </div>
                ) : (
                  <>
                    {Object.entries(cart).map(([serial, qty]) => {
                      const product = products.find(p => p.serial_number === serial);
                      if (!product) return null;
                      const origPrice = roundPrice(product.price);
                      const discountAmt = (origPrice * product.discount) / 100;
                      const priceAfterDiscount = formatPrice(origPrice - discountAmt);
                      const imageSrc = Array.isArray(product.images)
                        ? product.images.filter(item => !item.includes("/video/") && !item.toLowerCase().endsWith(".gif"))[0] || need
                        : need;
                      return (
                        <motion.div key={serial} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="glassmorphic"
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px", borderRadius: "14px",
                          }}>
                          <img src={imageSrc} alt={product.productname}
                            style={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover", cursor: "pointer", flexShrink: 0 }}
                            onClick={() => handleImageClick(product.images)} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontWeight: 700, fontSize: "14px", color: C.ink,
                              display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
                            }}>{product.productname}</p>
                            <p style={{ fontSize: "13px", color: C.gold, fontWeight: 700, marginTop: 2 }}>
                              ₹{priceAfterDiscount} × {qty} = <span style={{ color: C.ink }}>₹{formatPrice((origPrice - discountAmt) * qty)}</span>
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <button className="glassmorphic" onClick={() => removeFromCart(product)} style={{
                              width: 26, height: 26, color: C.slate, borderRadius: "6px", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}><FaMinus style={{ fontSize: 8 }} /></button>
                            <span style={{ fontWeight: 700, fontSize: "13px", minWidth: 16, textAlign: "center", color: C.ink }}>{qty}</span>
                            <button onClick={() => addToCart(product)} className="glassmorphic" style={{
                              width: 26, height: 26, color: C.slate, borderRadius: "6px", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}><FaPlus style={{ fontSize: 8 }} /></button>
                          </div>
                        </motion.div>
                      );
                    })}

                    {freeCartItem && (
                      <>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 0 4px", borderTop: `1px dashed rgba(255,255,255,0.06)`, marginTop: 6,
                        }}>
                          <Gift style={{ width: 12, height: 12, color: C.green }} />
                          <span style={{
                            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "10px",
                            letterSpacing: "0.15em", uppercase: "true", color: C.green,
                          }}>Promotional Allocation</span>
                        </div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="glassmorphic"
                          style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "10px", borderRadius: "14px",
                            background: "rgba(16,185,129,0.02)", borderColor: "rgba(16,185,129,0.15)"
                          }}>
                          <img
                            src={Array.isArray(freeCartItem.images) && freeCartItem.images.length > 0
                              ? freeCartItem.images.filter(i => !i.includes("/video/") && !i.toLowerCase().endsWith(".gif"))[0] || need
                              : need}
                            alt={freeCartItem.productname}
                            style={{ width: 40, height: 44, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: "13px", color: C.ink, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{freeCartItem.productname}</p>
                            <span style={{ display: "inline-block", marginTop: 3, color: C.green, fontSize: "11px", fontWeight: 800 }}>🎁 FREE ENTRY</span>
                          </div>
                          <button onClick={removeFreeItem} className="glassmorphic" style={{
                            width: 24, height: 24, borderRadius: "6px", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", color: C.slate,
                          }}>×</button>
                        </motion.div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div style={{
                padding: "1.25rem 1.5rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(3,7,18,0.2)",
                display: "flex", flexDirection: "column", gap: 12, flexShrink: 0,
              }}>
                {!isExpandedCart && (
                  <>
                    <PromoSelector />
                  </>
                )}

                <SummaryRows />

                {isExpandedCart ? (
                  <button onClick={() => setIsExpandedCart(false)} className="btn-outline" style={{ width: "100%", justifyContent: "center", borderRadius: "12px" }}>
                    <FaCompress style={{ fontSize: 11 }} /> Minimize Registry Panel
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => { setCart({}); setFreeCartItem(null); }} className="btn-outline"
                      style={{ flex: 1, justifyContent: "center", borderRadius: "12px" }}>
                      Clear
                    </button>
                    <button
                      onClick={handleCheckoutClick}
                      disabled={!isCartUnlocked}
                      className="btn-primary"
                      style={{
                        flex: 2.5, justifyContent: "center", borderRadius: "12px",
                        opacity: isCartUnlocked ? 1 : 0.4,
                        cursor: isCartUnlocked ? "pointer" : "not-allowed",
                        background: isCartUnlocked ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#475569",
                      }}
                    >
                      {isCartUnlocked ? "Checkout" : `Locked`}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showImageModal && selectedImages.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center"
            style={{ background: "rgba(3,7,18,0.9)", backdropFilter: "blur(6px)" }}
            onClick={handleCloseImageModal}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              onClick={e => e.stopPropagation()} className="relative max-w-4xl w-full mx-4 max-h-[85vh]">
              <AnimatePresence mode="wait">
                <motion.div key={currentImageIndex}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {selectedImages[currentImageIndex]?.includes("/video/")
                    ? <video src={selectedImages[currentImageIndex]} autoPlay muted loop
                        style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "16px" }} />
                    : <img src={selectedImages[currentImageIndex] || need} alt="Product"
                        style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "16px" }} />}
                </motion.div>
              </AnimatePresence>
              <button onClick={handleCloseImageModal} className="glassmorphic" style={{
                position: "absolute", top: 16, right: 16, width: 36, height: 36,
                borderRadius: "10px", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>×</button>
              {selectedImages.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex(prev => prev === 0 ? selectedImages.length - 1 : prev - 1)}
                    className="glassmorphic"
                    style={{
                      position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                      width: 36, height: 36, borderRadius: "10px",
                      color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}><FaArrowLeft style={{ fontSize: 12 }} /></button>
                  <button onClick={() => setCurrentImageIndex(prev => prev === selectedImages.length - 1 ? 0 : prev + 1)}
                    className="glassmorphic"
                    style={{
                      position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                      width: 36, height: 36, borderRadius: "10px",
                      color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}><FaArrowRight style={{ fontSize: 12 }} /></button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {showAiModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md"
            style={{ background: "rgba(3,7,18,0.5)" }}
            onClick={() => {
              setShowAiModal(false); setAiStep(0); setAiBudget("");
              setAiPreferences({ kids: false, sound: false, night: false, kidsnight: false });
              setSuggestedCart({});
            }}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glassmorphic max-w-md w-full max-h-[85vh] overflow-y-auto"
              style={{ borderRadius: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "2rem 2rem 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.25rem" }}>
                  <div className="glassmorphic" style={{
                    width: 44, height: 44, borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.25rem", borderColor: C.borderH
                  }}>🤖</div>
                  <div>
                    <h2 className="display text-lg" style={{ color: C.ink }}>Smart  Purchase</h2>
                    <p style={{ fontSize: "13px", color: C.muted }}>Automated programmatic inventory allocation</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= aiStep ? C.gold : "rgba(255,255,255,0.05)", transition: "all 0.3s",
                    }} />
                  ))}
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
                  marginBottom: "1.5rem",
                }}>
                  {["Threshold", "Parameters", "Manifest"].map((label, i) => (
                    <span key={i} style={{ color: i === aiStep ? C.gold : C.muted }}>{label}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "0 2rem 2rem" }}>
                <AnimatePresence mode="wait">
                  {aiStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: "1.5rem" }}>
                      <p style={{ color: C.slate, fontSize: "14px", marginBottom: "1.25rem" }}>
                        Specify clear threshold allocation budget target:
                      </p>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.muted, fontWeight: 700 }}>₹</span>
                        <input type="number" value={aiBudget} onChange={e => setAiBudget(e.target.value)}
                          style={{
                            width: "100%", paddingLeft: 32, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px",
                            background: "rgba(3,7,18,0.4)", fontSize: "16px", color: C.ink, outline: "none",
                          }}
                          placeholder="0.00" />
                      </div>
                    </motion.div>
                  )}
                  {aiStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: "1.5rem" }}>
                      <p style={{ color: C.slate, fontSize: "14px", marginBottom: "1.25rem" }}>
                        Select dynamic event distribution models:
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                          { key: 'kids', emoji: '🧒', label: 'Kids Friendly', desc: 'Twinkling Star, Fancy Pencil, Novelties' },
                          { key: 'sound', emoji: '💥', label: 'Sound Crackers', desc: 'Bombs, Atom Bombs, One Sound' },
                          { key: 'night', emoji: '🚀', label: 'Night Sky Display', desc: 'Rockets, Repeating Shots, Sky Shots' },
                          { key: 'kidsnight', emoji: '✨', label: 'Kids Night Crackers', desc: 'Sparklers, Flower Pots, Fountains' },
                        ].map(({ key, emoji, label, desc }) => (
                          <label key={key} style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "12px 14px",
                            border: `1px solid ${aiPreferences[key] ? C.gold : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "12px",
                            background: aiPreferences[key] ? "rgba(245,158,11,0.04)" : "rgba(3,7,18,0.2)",
                            cursor: "pointer", transition: "all 0.2s",
                          }}>
                            <input type="checkbox" checked={aiPreferences[key]}
                              onChange={e => setAiPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                              style={{ display: "none" }} />
                            <span style={{ fontSize: "1.25rem" }}>{emoji}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 700, fontSize: "14px", color: aiPreferences[key] ? C.gold : C.ink }}>{label}</p>
                              <p style={{ fontSize: "11px", color: C.muted }} ramp>{desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {aiStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                        <div>
                          <p style={{ fontWeight: 700, color: C.ink }}>{Object.keys(suggestedCart).length} Units Aggregated</p>
                          <p style={{ fontSize: "13px", color: C.gold }}>Evaluation: ≈ ₹{suggestedTotals}</p>
                        </div>
                        <button onClick={generateSuggestions} className="btn-outline" style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "8px" }}>Regenerate</button>
                      </div>
                      {Object.keys(suggestedCart).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2rem 0", color: C.muted }}>
                          <p style={{ fontSize: "14px" }}>No profiles match specifications.</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "35vh", overflowY: "auto" }}>
                          {Object.entries(suggestedCart).map(([serial, qty]) => {
                            const product = products.find(p => p.serial_number === serial);
                            if (!product) return null;
                            const origPr = roundPrice(product.price);
                            const discAmt = (origPr * product.discount) / 100;
                            const priceAfterDiscount = formatPrice(origPr - discAmt);
                            const imageSrc = Array.isArray(product.images) && product.images.length > 0
                              ? product.images.find(img => !img.includes("/video/")) || product.images[0]
                              : need;
                            return (
                              <div key={serial} className="glassmorphic" style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "10px", borderRadius: "12px",
                              }}>
                                <img src={imageSrc} alt={product.productname}
                                  style={{ width: 44, height: 44, borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{
                                    fontWeight: 700, fontSize: "13px", color: C.ink,
                                    display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
                                  }}>{product.productname}</p>
                                  <p style={{ fontSize: "12px", color: C.gold, marginTop: 2 }}>₹{priceAfterDiscount} × {qty}</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                  <button onClick={() => removeFromSuggestedCart(product)} className="glassmorphic" style={{
                                    width: 24, height: 24, borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.slate
                                  }}><FaMinus style={{ fontSize: 8 }} /></button>
                                  <span style={{ fontWeight: 700, fontSize: "13px", minWidth: 20, textAlign: "center" }}>{qty}</span>
                                  <button onClick={() => addToSuggestedCart(product)} className="glassmorphic" style={{
                                    width: 24, height: 24, borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.slate
                                  }}><FaPlus style={{ fontSize: 8 }} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {Object.keys(suggestedCart).length > 0 && (
                        <button onClick={addSuggestedToCart} className="btn-primary"
                          style={{ width: "100%", justifyContent: "center", marginTop: "1.25rem", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>
                          ✓ Append to Active Manifest
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                  {aiStep > 0
                    ? <button onClick={handleAiBack} className="btn-outline" style={{ padding: "10px 20px", borderRadius: "10px" }}>Back</button>
                    : <div />}
                  <button onClick={handleAiNext} className="btn-primary" style={{ padding: "10px 24px", borderRadius: "10px" }}>
                    {aiStep < 2 ? "Next" : "Generate"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="hundred:pt-10 mobile:-translate-y-1" style={{paddingBottom: "8rem", maxWidth: "80rem", margin: "0 auto", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: "3rem" }}>
          <div>
            <p className="label">Carts</p>
            <h1 className="display text-3xl md:text-5xl mobile:text-xl" style={{ color: C.ink, marginTop: 4 }}>Happy Shopping</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full">
            <div className="flex min-w-[200px] relative">
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                placeholder="Search products"
                className="w-[200px] bg-[rgba(15,23,42,0.4)] border border-[rgba(255,255,255,0.06)] 
                          rounded-2xl text-white py-3 px-5 pl-11 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowAiModal(true)}
              className="btn-outline whitespace-nowrap px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-colors"
            >
              🤖 <span>Smart-AI</span>
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "1.5rem" }}>
          <p className="label" style={{ marginBottom: "0.5rem" }}>Categories</p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="hidden lg:flex glassmorphic"
              onClick={() => typeScrollRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
              style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "10px", cursor: "pointer", alignItems: "center", justifyContent: "center", color: C.gold }}
            >
              <FaArrowLeft style={{ fontSize: 11 }} />
            </button>
            <div ref={typeScrollRef} className="hscroll" style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "4px 0 8px", flex: 1 }}>
              {productTypes.map(type => (
                <button key={type} onClick={() => setSelectedType(type)} className={`type-chip ${selectedType === type ? "active" : ""}`}>
                  {type}
                </button>
              ))}
            </div>
            <button className="hidden lg:flex glassmorphic"
              onClick={() => typeScrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
              style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "10px", cursor: "pointer", alignItems: "center", justifyContent: "center", color: C.gold }}
            >
              <FaArrowRight style={{ fontSize: 11 }} />
            </button>
          </div>
        </motion.div>

        {brandList.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "3rem" }}>
            <p className="label" style={{ marginBottom: "0.5rem" }}>Brands</p>
            <div className="hscroll" style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "4px 0 8px" }}>
              {brandList.map(brand => {
                const isSelected = selectedBrand === brand;
                return (
                  <button key={brand} onClick={() => { setSelectedBrand(brand); setBrandSearchInput(""); setBrandSearchTerm(""); }}
                    className={`brand-chip ${isSelected ? "active" : ""}`}>
                    {brand === "All" ? "All" : brand}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "4rem" }}>
          <button onClick={downloadPDF} className="btn-outline" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <FaDownload style={{ fontSize: "14px", color: C.gold }} /> Download Pricelist
          </button>
        </div>

        {Object.entries(grouped).map(([type, items], groupIndex) => (
          <motion.section key={type} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ marginBottom: "5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ width: 3, height: 24, background: C.gold, borderRadius: "2px", flexShrink: 0 }} />
              <h2 className="display text-xl md:text-2xl" style={{ color: C.ink, textTransform: "capitalize" }}>
                {type.replace(/_/g, " ")}
              </h2>
              <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, ${C.border}, transparent)` }} />
              <span className="pill text-[11px]">
                {items.length} units
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {items.map((product) => (
                <ProductCard
                  key={product.serial_number}
                  product={product}
                  count={cart[product.serial_number] || 0}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                  onShowDetails={handleShowDetails}
                  onImageClick={handleImageClick}
                />
              ))}
            </div>
          </motion.section>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div style={{ textAlign: "center", padding: "6rem 0" }}>
            <p className="display text-xl" style={{ color: C.muted }}>Zero Records Returned</p>
            <p className="serif" style={{ color: C.muted, fontSize: "14px", marginTop: 6, fontStyle: "italic" }}>No entries resolve against parameters.</p>
            <button onClick={() => { clearSearch(); clearBrandSearch(); setSelectedBrand("All"); setSelectedType("All"); }}
              className="btn-outline" style={{ marginTop: "1.5rem" }}>
              Reset Filters
            </button>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md bg-void/60"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glassmorphic max-w-md w-full max-h-[80vh] overflow-y-auto"
              style={{ borderRadius: "24px", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
              <div style={{ padding: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
                  <div style={{
                    width: 36, height: 36, background: `rgba(245,158,11,0.05)`,
                    border: "1px solid rgba(245,158,11,0.15)", borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ShoppingCart style={{ width: 16, height: 14, color: C.gold }} />
                  </div>
                  <div>
                    <h2 className="display text-lg" style={{ color: C.ink }}>Clearing Protocol</h2>
                    <p style={{ fontSize: "12px", color: C.muted }}>Fill customer credentials to authenticate order registry</p>
                  </div>
                </div>

                {freeCartItem && (
                  <div style={{
                    background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)",
                    borderRadius: "10px", padding: "10px 14px", marginBottom: "1rem",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <Gift style={{ width: 14, height: 14, color: C.green, flexShrink: 0 }} />
                    <p style={{ fontSize: "12px", color: C.green, fontWeight: 700 }}>
                      Promotional Item Loaded: "{freeCartItem.productname}"
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {["customer_name", "address", "mobile_number", "email"].map(field => (
                    <div key={field}>
                      <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: C.gold, fontSize: "10px" }}>
                        {field.replace(/_/g, " ")}{field !== "email" ? " *" : ""}
                      </p>
                      <input name={field} type={field === "email" ? "email" : "text"}
                        placeholder={`Provide ${field.replace(/_/g, " ")}`}
                        value={customerDetails[field]} onChange={handleInputChange}
                        style={{
                          width: "100%", padding: "12px 14px",
                          border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
                          background: "rgba(3,7,18,0.4)", fontSize: "14px", color: C.ink, outline: "none",
                        }}
                        required={field !== "email"} />
                    </div>
                  ))}
                  <div>
                    <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: C.gold, fontSize: "10px" }}>State Jurisdiction *</p>
                    <select name="state" value={customerDetails.state}
                      onChange={e => setCustomerDetails(prev => ({ ...prev, state: e.target.value, district: "" }))}
                      style={{
                        width: "100%", padding: "12px 14px",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
                        background: "rgba(3,7,18,0.4)", fontSize: "14px", color: C.ink, outline: "none",
                      }} required>
                      <option value="">Select State</option>
                      {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  {customerDetails.state && (
                    <div>
                      <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: C.gold, fontSize: "10px" }}>City Core Matrix *</p>
                      <select name="district" value={customerDetails.district} onChange={handleInputChange}
                        style={{
                          width: "100%", padding: "12px 14px",
                          border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
                          background: "rgba(3,7,18,0.4)", fontSize: "14px", color: C.ink, outline: "none",
                        }} required>
                        <option value="">Select Locality</option>
                        {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="glassmorphic" style={{ padding: "1rem", borderRadius: "14px" }}>
                    <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: C.gold }}>Registry Summary</p>
                    <SummaryRows />
                  </div>
                </div>

                <div style={{ marginTop: "1.5rem", display: "flex", gap: 12 }}>
                  <button onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, justifyContent: "center", borderRadius: "12px" }}>
                    Cancel
                  </button>
                  <button onClick={handleFinalCheckout} disabled={isBookingLoading} className="btn-primary"
                    style={{
                      flex: 1.5, justifyContent: "center", borderRadius: "12px",
                      opacity: isBookingLoading ? 0.7 : 1,
                    }}>
                    {isBookingLoading ? "Processing…" : "Confirm Registry"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Pricelist;