import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const C = {
  crimson: "#c0392b",
  crimsonD: "#96281b",
  saffron: "#e67e22",
  ivory: "#fdf8f0",
  cream: "#faf3e4",
  parchment: "#f5e9c9",
  ink: "#2c2c2e",
  muted: "#7c7c88",
  border: "#e8dcc8",
  green: "#2e7d32",
};

const SPIN_COLORS = [
  "#c0392b", "#e67e22", "#8e44ad", "#16a085",
  "#2980b9", "#d35400", "#27ae60", "#c0392b",
];

const CONFETTI_COLORS = [
  "#c0392b", "#e67e22", "#f1c40f", "#2ecc71",
  "#3498db", "#9b59b6", "#e74c3c", "#1abc9c",
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns an appropriate canvas font-size (px) for a given label. */
function getLabelFontSize(label) {
  const len = label.length;
  if (len <= 8)  return 12;
  if (len <= 12) return 10.5;
  if (len <= 16) return 9.5;
  return 8.5;
}

/**
 * Fire a two-wave confetti burst that originates from the centre of `originEl`.
 * Particles are appended to <body> and self-remove after their animation.
 */
function launchConfetti(originEl) {
  if (!originEl) return;
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;

  function spawnParticles(count, speedMin, speedMax, yBias, delayMax, sizeMin, sizeMax) {
    for (let i = 0; i < count; i++) {
      const el    = document.createElement("div");
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size  = sizeMin + Math.random() * (sizeMax - sizeMin);
      const angle = Math.random() * 2 * Math.PI;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const dx    = Math.cos(angle) * speed;
      const dy    = Math.sin(angle) * speed - yBias;
      const rot   = Math.random() * 720 - 360;
      const dur   = 0.8 + Math.random() * 0.5;
      const delay = Math.random() * delayMax;
      const isRect = Math.random() > 0.5;

      el.style.cssText = `
        position: fixed;
        left: ${cx - size / 2}px;
        top:  ${cy - size / 2}px;
        width:  ${size}px;
        height: ${isRect ? size * 0.45 : size}px;
        background: ${color};
        border-radius: ${isRect ? "1px" : "50%"};
        pointer-events: none;
        z-index: 99999;
        opacity: 1;
        transition:
          left    ${dur}s cubic-bezier(.2,.8,.3,1) ${delay}s,
          top     ${dur}s cubic-bezier(.2,.8,.3,1) ${delay}s,
          transform ${dur}s cubic-bezier(.2,.8,.3,1) ${delay}s,
          opacity ${0.4 + Math.random() * 0.3}s ease ${0.6 + delay}s;
      `;
      document.body.appendChild(el);

      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          el.style.left      = `${cx - size / 2 + dx}px`;
          el.style.top       = `${cy - size / 2 + dy + 120}px`;
          el.style.transform = `rotate(${rot}deg) scale(0.3)`;
          el.style.opacity   = "0";
          setTimeout(() => el.remove(), (dur + delay + 0.5) * 1000);
        })
      );
    }
  }

  // Wave 1 — big radial burst
  spawnParticles(80, 120, 400, 80, 0.15, 5, 12);

  // Wave 2 — softer secondary burst after a short delay
  setTimeout(() => spawnParticles(40, 60, 180, 50, 0.08, 4, 8), 300);
}

// ─── Component ──────────────────────────────────────────────────────────────

const LuckySpinModal = memo(({
  isOpen,
  onClose,
  freeProducts,
  onAddFreeProduct,
  onSkip,
  alreadyHasFree,
}) => {
  const canvasRef        = useRef(null);
  const animFrameRef     = useRef(null);
  const [isSpinning,     setIsSpinning]     = useState(false);
  const [result,         setResult]         = useState(null);
  const [currentRotation,setCurrentRotation]= useState(0);

  const segments = useMemo(() => {
    if (!freeProducts || freeProducts.length === 0) return [];
    return freeProducts.slice(0, 8);
  }, [freeProducts]);

  // ── Draw ─────────────────────────────────────────────────────────────────

  const drawWheel = useCallback((rot = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    const ctx   = canvas.getContext("2d");
    const size  = canvas.width;
    const cx    = size / 2;
    const cy    = size / 2;
    const r     = size / 2 - 6;
    const count = segments.length;
    const arc   = (2 * Math.PI) / count;

    ctx.clearRect(0, 0, size, size);

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
    ctx.fillStyle = C.parchment;
    ctx.fill();

    // Segments
    for (let i = 0; i < count; i++) {
      const start = rot + i * arc - Math.PI / 2;
      const end   = start + arc;

      // Slice fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle   = SPIN_COLORS[i % SPIN_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth   = 2.5;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";

      const rawLabel = segments[i]?.productname || `Prize ${i + 1}`;
      const label    = rawLabel.substring(0, 20);          // hard cap
      const fs       = getLabelFontSize(label);
      ctx.font       = `bold ${fs}px 'Syne', sans-serif`;

      const words = label.split(" ");
      if (words.length >= 2 && label.length > 10) {
        // Two-line wrapping for long names
        const mid   = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(" ");
        const line2 = words.slice(mid).join(" ");
        const lineH = fs + 2;
        ctx.fillText(line1, r - 10, -lineH / 2 + 2);
        ctx.fillText(line2, r - 10,  lineH / 2 + 2);
      } else {
        ctx.fillText(label, r - 10, 4);
      }

      ctx.restore();
    }

    // Centre hub
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    ctx.fillStyle   = "#fff";
    ctx.fill();
    ctx.strokeStyle = C.crimson;
    ctx.lineWidth   = 3;
    ctx.stroke();
    ctx.fillStyle   = C.crimson;
    ctx.font        = "bold 9px 'Syne', sans-serif";
    ctx.textAlign   = "center";
    ctx.fillText("SPIN", cx, cy - 2);
    ctx.fillText("WIN!", cx, cy + 10);
  }, [segments]);

  // ── Reset on open ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setIsSpinning(false);
      setCurrentRotation(0);
      setTimeout(() => drawWheel(0), 80);
    }
  }, [isOpen, drawWheel]);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ── Spin logic ────────────────────────────────────────────────────────────

  const handleSpin = () => {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);
    setResult(null);

    const count      = segments.length;
    const arc        = (2 * Math.PI) / count;
    const winIndex   = Math.floor(Math.random() * count);
    const targetAngle = -(winIndex * arc) - arc / 2 + Math.PI * 2 * 5.5;
    const totalSpin  = targetAngle + (Math.random() * 0.3 - 0.15);
    const duration   = 4500;
    const startTime  = performance.now();
    const startRot   = currentRotation;

    const animate = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 4);
      const rot      = startRot + totalSpin * ease;

      setCurrentRotation(rot);
      drawWheel(rot);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setResult(segments[winIndex]);
        // 🎉 Fire confetti from the wheel canvas
        launchConfetti(canvasRef.current);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // ── Claim ─────────────────────────────────────────────────────────────────

  const handleClaim = () => {
    if (result) onAddFreeProduct(result);
    onClose();
  };

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position:        "fixed",
          inset:           0,
          zIndex:          65,
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          padding:         "1rem",
          background:      "rgba(28,28,30,0.7)",
          backdropFilter:  "blur(8px)",
        }}
        onClick={onSkip}
      >
        <motion.div
          initial={{ scale: 0.8, y: 40, rotateX: 15 }}
          animate={{ scale: 1,   y: 0,  rotateX: 0  }}
          exit={{    scale: 0.8, y: 40               }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background:   C.ivory,
            border:       `2px solid ${C.crimson}`,
            borderRadius: "10px",
            boxShadow:    `10px 10px 0 ${C.crimsonD}`,
            maxWidth:     "22rem",
            width:        "100%",
            padding:      "1.75rem",
            fontFamily:   "'Barlow', sans-serif",
            overflow:     "hidden",
            position:     "relative",
          }}
        >
          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <span style={{
              display:       "inline-block",
              background:    C.crimson,
              color:         "#fff",
              fontFamily:    "'Syne', sans-serif",
              fontWeight:    700,
              fontSize:      "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding:       "4px 14px",
              borderRadius:  "100px",
              marginBottom:  "0.6rem",
            }}>
              🎁 Lucky Draw
            </span>

            <h2 style={{
              fontFamily:    "'Syne', sans-serif",
              fontWeight:    800,
              fontSize:      "1.3rem",
              color:         C.ink,
              marginBottom:  "0.25rem",
              letterSpacing: "-0.02em",
            }}>
              Spin &amp; Win a Free Gift!
            </h2>

            <p style={{ color: C.muted, fontSize: "12px", fontFamily: "'Lora', serif", fontStyle: "italic" }}>
              {alreadyHasFree
                ? "You already claimed your free gift!"
                : segments.length > 0
                  ? `${segments.length} surprise gifts available — spin the wheel!`
                  : "No free products available right now."}
            </p>

            {alreadyHasFree && (
              <div style={{
                marginTop:   10,
                padding:     "8px 12px",
                background:  "rgba(46,125,50,0.08)",
                border:      "1.5px solid rgba(46,125,50,0.3)",
                borderRadius:"6px",
                color:       C.green,
                fontFamily:  "'Syne', sans-serif",
                fontWeight:  700,
                fontSize:    "12px",
              }}>
                Only 1 free product per order is allowed
              </div>
            )}
          </div>

          {/* ── Wheel ── */}
          {!alreadyHasFree && (
            <div style={{
              position:      "relative",
              display:       "flex",
              justifyContent:"center",
              marginBottom:  "1.25rem",
            }}>
              {/* Pointer arrow */}
              <div style={{
                position:        "absolute",
                top:             -2,
                left:            "50%",
                transform:       "translateX(-50%)",
                width:           0,
                height:          0,
                borderLeft:      "12px solid transparent",
                borderRight:     "12px solid transparent",
                borderTop:       `22px solid ${C.crimson}`,
                zIndex:          2,
                filter:          `drop-shadow(0 2px 4px ${C.crimsonD}66)`,
              }} />

              <canvas
                ref={canvasRef}
                width={240}
                height={240}
                style={{
                  borderRadius: "50%",
                  border:       `3px solid ${C.crimson}`,
                  boxShadow:    `0 0 0 5px ${C.parchment}, 0 0 0 7px ${C.border}`,
                  display:      "block",
                }}
              />
            </div>
          )}

          {/* ── Win result ── */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                style={{
                  background:   "rgba(46,125,50,0.07)",
                  border:       "1.5px solid rgba(46,125,50,0.35)",
                  borderRadius: "6px",
                  padding:      "12px 16px",
                  marginBottom: "1rem",
                  textAlign:    "center",
                  position:     "relative",
                  overflow:     "hidden",
                }}
              >
                <p style={{
                  fontFamily:    "'Syne', sans-serif",
                  fontWeight:    700,
                  color:         C.green,
                  fontSize:      "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom:  4,
                }}>
                  🎉 You Won!
                </p>
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  color:      C.ink,
                  fontSize:   "14px",
                  lineHeight: 1.3,
                }}>
                  {result.productname}
                </p>
                <p style={{ fontSize: "12px", color: C.green, fontWeight: 400, marginTop: 4 }}>
                  Added FREE to your cart · ₹0
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Buttons ── */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onSkip}
              style={{
                flex:        1,
                padding:     "10px 0",
                background:  "transparent",
                color:       C.crimson,
                border:      `2px solid ${C.crimson}`,
                borderRadius:"4px",
                cursor:      "pointer",
                fontFamily:  "'Syne', sans-serif",
                fontWeight:  700,
                fontSize:    "13px",
              }}
            >
              Skip
            </button>

            {alreadyHasFree ? (
              <button
                onClick={onSkip}
                style={{
                  flex:        2,
                  padding:     "10px 0",
                  background:  C.green,
                  color:       "#fff",
                  border:      "none",
                  borderRadius:"4px",
                  cursor:      "pointer",
                  fontFamily:  "'Syne', sans-serif",
                  fontWeight:  700,
                  fontSize:    "13px",
                }}
              >
                Continue →
              </button>
            ) : result ? (
              <button
                onClick={handleClaim}
                style={{
                  flex:        2,
                  padding:     "10px 0",
                  background:  C.green,
                  color:       "#fff",
                  border:      "none",
                  borderRadius:"4px",
                  cursor:      "pointer",
                  fontFamily:  "'Syne', sans-serif",
                  fontWeight:  700,
                  fontSize:    "13px",
                }}
              >
                Claim &amp; Checkout →
              </button>
            ) : (
              <button
                onClick={handleSpin}
                disabled={isSpinning || segments.length === 0}
                style={{
                  flex:        2,
                  padding:     "10px 0",
                  background:  isSpinning || segments.length === 0 ? C.parchment : C.crimson,
                  color:       isSpinning || segments.length === 0 ? C.muted     : "#fff",
                  border:      "none",
                  borderRadius:"4px",
                  cursor:      isSpinning || segments.length === 0 ? "not-allowed" : "pointer",
                  fontFamily:  "'Syne', sans-serif",
                  fontWeight:  700,
                  fontSize:    "14px",
                  letterSpacing:"0.04em",
                  transition:  "all 0.2s",
                }}
              >
                {isSpinning ? "Spinning…" : "🎰 Spin!"}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default LuckySpinModal;