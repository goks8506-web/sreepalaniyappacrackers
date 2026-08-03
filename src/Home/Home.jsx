import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Sparkles, Rocket, Volume2, Bomb, Disc, CloudSun,
  Heart, SmilePlus, Clock, ArrowRight, Gift, Copy,
  ShoppingCart, X, AlertTriangle
} from "lucide-react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { FaInfoCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa"
import Navbar from "../Component/Navbar"
import "../App.css"
import { API_BASE_URL } from "../../Config"
import about from "../spc.jpg"
import need from "../spc.jpg"

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

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&family=Syne:wght@700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body { background: #030712; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
    
    .display { font-family: 'Syne', sans-serif; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; }
    .serif { font-family: 'Lora', serif; }
    .label { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase; color: #f59e0b; }
    
    .cosmic-mesh { 
      background-image: 
        radial-gradient(at 10% 15%, rgba(6, 182, 212, 0.05) 0px, transparent 50%),
        radial-gradient(at 90% 85%, rgba(139, 92, 246, 0.05) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(245, 158, 11, 0.02) 0px, transparent 70%);
    }
    
    .glassmorphic {
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
    
    .pill { 
      display: inline-flex; 
      align-items: center; 
      gap: 8px; 
      background: rgba(245, 158, 11, 0.08); 
      color: #f59e0b; 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      font-weight: 700; 
      font-size: 12px; 
      letter-spacing: 0.05em; 
      text-transform: uppercase; 
      padding: 6px 16px; 
      border-radius: 100px; 
      border: 1px solid rgba(245, 158, 11, 0.15); 
    }
    
    .btn-primary { 
      display: inline-flex; 
      align-items: center; 
      gap: 12px; 
      background: linear-gradient(135deg, #f59e0b, #d97706); 
      color: #030712; 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      font-weight: 700; 
      font-size: 15px; 
      padding: 16px 36px; 
      border-radius: 12px; 
      border: none; 
      cursor: pointer; 
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
      box-shadow: 0 8px 30px rgba(245, 158, 11, 0.25); 
    }
    .btn-primary:hover { 
      transform: translateY(-3px); 
      box-shadow: 0 12px 35px rgba(245, 158, 11, 0.4); 
      background: linear-gradient(135deg, #fef08a, #f59e0b); 
    }
    
    .btn-outline { 
      display: inline-flex; 
      align-items: center; 
      gap: 12px; 
      background: rgba(255, 255, 255, 0.03); 
      color: #f8fafc; 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      font-weight: 700; 
      font-size: 14px; 
      padding: 14px 32px; 
      border-radius: 12px; 
      border: 1px solid rgba(255, 255, 255, 0.1); 
      cursor: pointer; 
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
    }
    .btn-outline:hover { 
      background: rgba(255, 255, 255, 0.08); 
      border-color: #f59e0b; 
      color: #f59e0b;
      transform: translateY(-2px); 
    }
    
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #030712; }
    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
    ::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
    .hscroll { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.1) #030712; }
  `}</style>
)

const categories = [
  { name: "Sparklers",             icon: Sparkles,  description: "Cascading golden showers for intimate celebrations" },
  { name: "Rockets",               icon: Rocket,    description: "Sky-piercing bursts of aerial brilliance" },
  { name: "Single Sound Crackers", icon: Volume2,   description: "Crisp festive reports with traditional character" },
  { name: "Atom Bombs",            icon: Bomb,      description: "Earth-shaking percussion for grand occasions" },
  { name: "Ground Chakkars",       icon: Disc,      description: "Whirling rings of light at ground level" },
  { name: "Sky Shots",             icon: CloudSun,  description: "Magnificent aerial canvases across the night sky" },
]
const statsData = [
  { label: "Customer Satisfaction", value: 100, icon: Heart,     suffix: "%" },
  { label: "Products Available",     value: 200, icon: Sparkles,  suffix: "+" },
  { label: "Happy Clients",          value: 500, icon: SmilePlus, suffix: "+" },
  { label: "Years of Experience",   value: 15,  icon: Clock,     suffix: "+" },
]
const navLinks = ["Home", "About Us", "Price List", "Safety Tips", "Contact Us"]

const genPositions = (count) => {
  const positions = []
  const sw = typeof window !== "undefined" ? window.innerWidth  : 1920
  const sh = typeof window !== "undefined" ? window.innerHeight : 1080
  if (sw < 768) {
    for (let i = 0; i < count; i++) positions.push({ x: 0, y: -sh * 0.2 + i * 120 })
  } else {
    const pad = 150, mx = sw - pad * 2, my = sh - pad * 2
    for (let i = 0; i < count; i++) {
      let p, ok = false, t = 0
      while (!ok && t < 50) { p = { x: Math.random() * mx - mx / 2, y: Math.random() * my - my / 2 }; ok = positions.every(e => Math.hypot(p.x - e.x, p.y - e.y) >= 200); t++ }
      if (p) positions.push(p)
    }
  }
  return positions
}

const LOADER_PALETTES = [
  ["rgb(245,158,11)", "rgb(217,119,6)", "rgb(254,240,138)", "rgb(255,255,255)"],
  ["rgb(6,182,212)", "rgb(8,145,178)", "rgb(165,243,252)", "rgb(255,255,255)"],
  ["rgb(139,92,246)", "rgb(109,40,217)", "rgb(216,180,254)", "rgb(255,255,255)"],
]
const ROCKET_SCHEDULE = [400, 1200, 2100, 3000, 3900]
const LOADER_DURATION = 4800

class LoaderParticle {
  constructor(x, y, color) {
    this.x = x; this.y = y
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 5
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed - 0.5
    this.alpha   = 1
    this.radius  = 1.5 + Math.random() * 2
    this.color   = color
    this.decay   = 0.012 + Math.random() * 0.014
    this.gravity = 0.06
    this.trail   = []
  }
  update() {
    this.trail.push({ x: this.x, y: this.y, a: this.alpha })
    if (this.trail.length > 6) this.trail.shift()
    this.vy += this.gravity
    this.x  += this.vx
    this.y  += this.vy
    this.alpha -= this.decay
    this.vx *= 0.97
  }
  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const t  = this.trail[i]
      const ta = t.a * (i / this.trail.length) * 0.3
      ctx.beginPath()
      ctx.arc(t.x, t.y, this.radius * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = this.color.replace(")", `,${ta})`).replace("rgb", "rgba")
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.color.replace(")", `,${this.alpha})`).replace("rgb", "rgba")
    ctx.fill()
  }
}

class LoaderRocket {
  constructor(W, H) {
    this.x  = W * 0.3 + Math.random() * W * 0.4
    this.y  = H + 10
    this.tx = W * 0.2 + Math.random() * W * 0.6
    this.ty = H * 0.15 + Math.random() * H * 0.3
    const dist  = Math.hypot(this.tx - this.x, this.ty - this.y)
    const speed = 8
    this.vx    = (this.tx - this.x) / dist * speed
    this.vy    = (this.ty - this.y) / dist * speed
    this.trail = []
    this.burst = false
  }
  update(particles) {
    if (this.burst) return
    this.trail.push({ x: this.x, y: this.y })
    if (this.trail.length > 12) this.trail.shift()
    this.x += this.vx
    this.y += this.vy
    if (this.y <= this.ty) {
      this.burst = true
      const pal   = LOADER_PALETTES[Math.floor(Math.random() * LOADER_PALETTES.length)]
      const count = 70 + Math.floor(Math.random() * 20)
      for (let i = 0; i < count; i++)
        particles.push(new LoaderParticle(this.x, this.y, pal[Math.floor(Math.random() * pal.length)]))
    }
  }
  draw(ctx) {
    if (this.burst) return
    this.trail.forEach((t, i) => {
      const a = (i / this.trail.length) * 0.4
      ctx.beginPath()
      ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(245,158,11,${a})`
      ctx.fill()
    })
    ctx.beginPath()
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = "#fff"
    ctx.fill()
  }
}

function IntroLoader({ onComplete }) {
  const canvasRef   = useRef(null)
  const rafRef      = useRef(null)
  const startRef    = useRef(null)
  const rocketsRef  = useRef([])
  const particlesRef = useRef([])

  const [progress, setProgress] = useState(0)
  const [ready,    setReady   ] = useState(false)
  const [exiting,  setExiting ] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")
    let W, H

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    let scheduleIdx = 0

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current

      ctx.fillStyle = "rgba(3,7,18,0.2)"
      ctx.fillRect(0, 0, W, H)

      while (scheduleIdx < ROCKET_SCHEDULE.length && elapsed >= ROCKET_SCHEDULE[scheduleIdx]) {
        rocketsRef.current.push(new LoaderRocket(W, H))
        scheduleIdx++
      }

      rocketsRef.current.forEach(r => { r.update(particlesRef.current); r.draw(ctx) })

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        particlesRef.current[i].update()
        particlesRef.current[i].draw(ctx)
        if (particlesRef.current[i].alpha <= 0) particlesRef.current.splice(i, 1)
      }

      const p = Math.min(100, Math.round((elapsed / LOADER_DURATION) * 100))
      setProgress(p)
      if (p >= 100) setReady(true)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [])

  const exit = () => {
    setExiting(true)
    setTimeout(() => { onComplete?.() }, 700)
  }

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(exit, 1000)
    return () => clearTimeout(t)
  }, [ready])

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="intro-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "#030712",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}/>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="glassmorphic"
            style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "3rem", borderRadius: "24px", maxWidth: "480px", width: "90%" }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
              color: "#f59e0b", fontSize: 12, fontWeight: 800,
              letterSpacing: "0.25em", textTransform: "uppercase",
              padding: "6px 18px", borderRadius: 100, marginBottom: 28,
            }}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Sivakasi · Est. 2009
            </div>

            <h1 className="display" style={{
              fontSize: "30px", color: "#f8fafc",
              marginBottom: 16,
            }}>
              Sri Palaniyappa<br/>
              <span style={{ color: "#f59e0b" }}>Crackers</span>
            </h1>

            <p className="serif" style={{
              fontStyle: "italic", fontSize: 18, color: "#cbd5e1",
              marginBottom: 44, opacity: 0.8,
            }}>
              "Every burst of light is a memory made"
            </p>

            <div style={{
              width: "100%", height: 3, background: "rgba(255,255,255,0.05)",
              borderRadius: 3, margin: "0 auto 16px", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", background: "linear-gradient(90deg, #d97706, #f59e0b)",
                width: progress + "%", transition: "width 0.05s linear",
              }}/>
            </div>
            <div style={{
              fontSize: 13, color: "#64748b",
              fontWeight: 700, letterSpacing: "0.15em",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {progress < 100 ? progress + "%" : "Aura Loaded"}
            </div>

            <AnimatePresence>
              {ready && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={exit}
                  className="btn-primary"
                  style={{ marginTop: 28, width: "100%", justifyContent: "center" }}
                >
                  Enter the Store
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Firework = ({ delay = 0, startPosition, endPosition, burstPosition, colors, onBurstComplete, promocode, onCopyPromo, copiedPromos }) => {
  const sw = typeof window !== "undefined" ? window.innerWidth : 1920
  useEffect(() => {
    if (onBurstComplete) { const t = setTimeout(onBurstComplete, delay + 3000); return () => clearTimeout(t) }
  }, [delay, onBurstComplete])
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div className="absolute w-2.5 h-8 rounded-full bg-gradient-to-b"
        style={{ left: startPosition.x, top: startPosition.y, from: colors.primary, to: colors.secondary, boxShadow: `0 0 30px ${colors.primary}` }}
        animate={{ x: [0, endPosition.x - startPosition.x], y: [0, endPosition.y - startPosition.y], opacity: [1, 1, 0], scale: [1, 1.1, 0.5] }}
        transition={{ duration: 1.6, delay, ease: "easeOut" }}
      />
      <motion.div className="absolute" style={{ left: burstPosition.x, top: burstPosition.y, transform: "translate(-50%,-50%)" }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7, 0] }} transition={{ duration: 4, delay: delay + 1.6 }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const a = i * 12 * Math.PI / 180, d = sw < 768 ? sw * 0.1 : sw * 0.15
          return <motion.div key={`p${i}`} className="absolute w-3 h-3 rounded-full"
            style={{ background: colors.burst[i % colors.burst.length], boxShadow: `0 0 20px ${colors.burst[i % colors.burst.length]}` }}
            animate={{ x: [0, Math.cos(a) * d * 0.4, Math.cos(a) * d], y: [0, Math.sin(a) * d * 0.4, Math.sin(a) * d], opacity: [1, 0.8, 0], scale: [1, 1.3, 0] }}
            transition={{ duration: 3, delay: delay + 1.6, ease: "easeOut" }} />
        })}
      </motion.div>
      {promocode && !copiedPromos.includes(promocode.code) && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: delay + 3.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute pointer-events-auto p-6 rounded-2xl text-center glassmorphic"
          style={{ left: burstPosition.x, top: burstPosition.y, transform: "translate(-50%,-50%)", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", zIndex: 45, minWidth: sw < 768 ? "250px" : "300px" }}>
          <div className="flex flex-col items-center gap-2">
            <div className="label text-xs">Vanguard Pass</div>
            <div className="font-extrabold text-3xl tracking-tight" style={{ color: C.ink }}>{promocode.code}</div>
            <div className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mt-2 bg-amber-500/10 border border-amber-500/20" style={{ color: C.gold }}>{promocode.discount}% Voucher Issued</div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { navigator.clipboard.writeText(promocode.code); onCopyPromo(promocode.code) }}
              className="mt-4 w-full py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold" style={{ background: C.gold, color: C.void }}>
              <Copy className="w-4 h-4" /> Redeem Code
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

const RocketBadgeAnimation = ({ isActive, onComplete, promocodes, onCopyPromo, copiedPromos }) => {
  const [fw, setFw] = useState([])
  const [done, setDone] = useState(false)
  const [showX, setShowX] = useState(false)
  const [triggered, setTriggered] = useState(false)
  const [positions, setPositions] = useState([])
  const sw = typeof window !== "undefined" ? window.innerWidth : 1920
  const sh = typeof window !== "undefined" ? window.innerHeight : 1080
  const palettes = [
    { primary: C.gold, secondary: C.goldL, center: C.gold, burst: [C.gold, C.goldL, "#fff"] },
    { primary: C.neonCyan, secondary: "#fff", center: C.neonCyan, burst: [C.neonCyan, "#fff"] },
    { primary: C.neonPurple, secondary: "#fff", center: C.neonPurple, burst: [C.neonPurple, "#fff"] },
  ]
  useEffect(() => { if (promocodes.length > 0) setPositions(genPositions(promocodes.length)) }, [promocodes.length])
  useEffect(() => {
    if (isActive && promocodes.length > 0 && !triggered) { setTriggered(true); fire(0) }
  }, [isActive, promocodes.length, triggered])
  const fire = idx => {
    if (idx >= promocodes.length) { setTimeout(() => { setDone(true); onComplete() }, 1000); return }
    const pos = positions[idx] || { x: 0, y: 0 }, burst = { x: sw / 2 + pos.x, y: sh / 2 + pos.y }
    setFw(p => [...p, { index: idx, startPosition: { x: sw / 2, y: sh - 100 }, endPosition: burst, burstPosition: burst, colors: palettes[idx % palettes.length], promocode: promocodes[idx] }])
    if (idx === 0) setShowX(true)
    setTimeout(() => fire(idx + 1), 3000)
  }
  const closeAll = () => { setFw([]); setShowX(false); promocodes.forEach(p => { if (!copiedPromos.includes(p.code)) onCopyPromo(p.code) }) }
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-40 bg-void/50 backdrop-blur-md">
          {showX && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={closeAll}
              className="fixed top-8 right-8 z-50 pointer-events-auto w-12 h-12 rounded-xl flex items-center justify-center glassmorphic shadow-2xl">
              <X className="w-5 h-5" />
            </motion.button>
          )}
          {fw.map(f => (
            <Firework key={`fw-${f.index}`} delay={0}
              startPosition={f.startPosition} endPosition={f.endPosition}
              burstPosition={f.burstPosition} colors={f.colors}
              promocode={f.promocode} onCopyPromo={onCopyPromo} copiedPromos={copiedPromos} />
          ))}
          {done && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="fixed bottom-8 right-8 z-50 pointer-events-auto">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = "/price-list"} className="btn-primary">
                <ShoppingCart className="w-4 h-4" /> Browse Platform <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const ModernCarousel = ({ media }) => {
  const [idx, setIdx] = useState(0)
  const tx = useRef(null)
  const items = useMemo(() => {
    const raw = media && typeof media === "string" ? JSON.parse(media) : Array.isArray(media) ? media : []
    return raw.sort((a, b) => {
      const pri = s => s.startsWith("data:video/") ? 2 : s.startsWith("data:image/gif") || s.endsWith(".gif") ? 1 : 0
      return pri(typeof a === "string" ? a : "") - pri(typeof b === "string" ? b : "")
    })
  }, [media])
  const isVid = s => typeof s === "string" && s.startsWith("data:video/")
  const prev = () => setIdx(i => i === 0 ? items.length - 1 : i - 1)
  const next = () => setIdx(i => i === items.length - 1 ? 0 : i + 1)
  if (!items.length) return (
    <div className="w-full h-64 rounded-2xl mb-6 overflow-hidden flex items-center justify-center border bg-slate-900/40"
      style={{ borderColor: C.border }}>
      <img src={need} alt="placeholder" className="object-contain h-full opacity-20" />
    </div>
  )
  return (
    <div className="relative w-full h-64 rounded-2xl mb-6 overflow-hidden group border"
      style={{ borderColor: C.border }}
      onTouchStart={e => { tx.current = e.touches[0].clientX }}
      onTouchMove={e => { if (!tx.current) return; const d = tx.current - e.touches[0].clientX; if (Math.abs(d) > 50) { d > 0 ? next() : prev(); tx.current = null } }}
      onTouchEnd={() => { tx.current = null }}>
      <div className="absolute inset-0 bg-slate-900/60" />
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
          {isVid(items[idx])
            ? <video src={items[idx]} autoPlay muted loop className="w-full h-full object-cover" />
            : <img src={items[idx] || "/placeholder.svg"} alt="Product" className="w-full h-full object-cover" />}
        </motion.div>
      </AnimatePresence>
      {items.length > 1 && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-void/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border bg-void/40"
            style={{ borderColor: C.borderH }}>
            <FaArrowLeft style={{ color: C.gold, fontSize: "11px" }} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border bg-void/40"
            style={{ borderColor: C.borderH }}>
            <FaArrowRight style={{ color: C.gold, fontSize: "11px" }} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className="w-2 h-2 rounded-full transition-all"
                style={{ background: i === idx ? C.gold : "rgba(255,255,255,0.25)" }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const StatCard = ({ icon: Icon, value, label, suffix, delay }) => {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 })
  useEffect(() => {
    if (inView && count === 0) {
      let s = 0; const t = setInterval(() => { s += Math.ceil(value / 50); if (s >= value) { setCount(value); clearInterval(t) } else setCount(s) }, Math.max(Math.floor(1200 / value), 30))
    }
  }, [inView, value, count])
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} viewport={{ once: true }}
      className="relative overflow-hidden rounded-2xl p-8 glassmorphic"
      style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.35)"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.background = "rgba(15, 23, 42, 0.7)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ""; e.currentTarget.style.background = C.glass }}>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 border bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Icon className="w-6 h-6" style={{ color: C.gold }} />
        </div>
        <div className="mb-2 flex items-baseline justify-center">
          <span className="text-4xl font-black tracking-tight" style={{ color: C.ink }}>{count}</span>
          <span className="text-2xl font-extrabold ml-0.5" style={{ color: C.gold }}>{suffix}</span>
        </div>
        <p className="text-xs font-bold tracking-wider uppercase" style={{ color: C.slate }}>{label}</p>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const [loaded, setLoaded]             = useState(false)
  const [banners, setBanners]           = useState([])
  const [slide, setSlide]               = useState(0)
  const [fastRunning, setFastRunning]   = useState([])
  const [selProduct, setSelProduct]     = useState(null)
  const [showModal, setShowModal]       = useState(false)
  const [promocodes, setPromocodes]     = useState([])
  const [showRocket, setShowRocket]     = useState(false)
  const [copiedPromos, setCopiedPromos] = useState([])
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] })
  const heroY       = useTransform(scrollYProgress, [0, 1], ["0%", "12%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/banners`).then(r => r.json()).then(d => setBanners(d.filter(b => b.is_active))).catch(console.error)
    const i = setInterval(() => fetch(`${API_BASE_URL}/api/banners`).then(r => r.json()).then(d => setBanners(d.filter(b => b.is_active))), 1200000)
    return () => clearInterval(i)
  }, [])
  useEffect(() => {
    const load = () => fetch(`${API_BASE_URL}/api/products`).then(r => r.json()).then(d => setFastRunning(d.data.filter(p => p.fast_running))).catch(console.error)
    load(); const i = setInterval(load, 5000); return () => clearInterval(i)
  }, [])
  useEffect(() => {
    const load = () => fetch(`${API_BASE_URL}/api/promocodes`).then(r => r.json()).then(d => setPromocodes(d.filter(p => p.is_active !== false))).catch(console.error)
    load(); const i = setInterval(load, 30000); return () => clearInterval(i)
  }, [])
  useEffect(() => {
    if (banners.length > 1) { const i = setInterval(() => setSlide(p => (p + 1) % banners.length), 5000); return () => clearInterval(i) }
  }, [banners])

  if (!loaded) return <IntroLoader onComplete={() => setLoaded(true)} />

  return (
    <div ref={containerRef} className="min-h-screen overflow-x-hidden cosmic-mesh" style={{ background: C.void, color: C.ink }}>
      <GlobalStyles />
      <Navbar />

      <RocketBadgeAnimation isActive={showRocket} onComplete={() => { }}
        promocodes={promocodes} onCopyPromo={code => setCopiedPromos(p => [...p, code])} copiedPromos={copiedPromos} />

      <AnimatePresence>
        {showModal && selProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-lg bg-void/60"
            onClick={() => { setShowModal(false); setSelProduct(null) }}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl max-h-[85vh] overflow-y-auto glassmorphic"
              style={{ borderRadius: "24px", boxShadow: "0 30px 60px rgba(0,0,0,0.7)" }}>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="display text-2xl mb-2" style={{ color: C.ink }}>{selProduct.productname}</h2>
                    <div className="flex items-center gap-4">
                      <span className="pill">{selProduct.discount}% OFF</span>
                      <span className="text-2xl font-black tracking-tight" style={{ color: C.gold }}>₹{((selProduct.price * (100 - selProduct.discount)) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => { setShowModal(false); setSelProduct(null) }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all glassmorphic hover:text-white">×</button>
                </div>
                <ModernCarousel media={selProduct.image} />
                <h3 className="text-sm font-bold tracking-wider uppercase mb-3" style={{ color: C.gold }}>Description Parameters</h3>
                <p className="mb-8 text-base leading-relaxed" style={{ color: C.slate }}>
                  {selProduct.description || "A premium quality firework crafted for your most memorable celebrations."}
                </p>
                <button onClick={() => navigate("/price-list")} className="btn-primary w-full justify-center">
                  Send Specification Enquiry <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section 
        style={{ y: heroY, opacity: heroOpacity }} 
        className="relative pt-20 md:pt-32 pb-8 md:pb-12 px-4 sm:px-8 lg:px-12"
      >
        <div className="max-w-6xl mx-auto">
          <div 
            className="relative rounded-t-2xl overflow-hidden w-full glassmorphic"
            style={{
              height: "clamp(150px, 38vw, 420px)",   // Reduced on mobile
              boxShadow: "0 30px 70px rgba(0,0,0,0.8)"
            }}
          >
            <AnimatePresence mode="wait">
              {banners.map((b, i) => slide === i && (
                <motion.div 
                  key={b.id} 
                  initial={{ opacity: 0, scale: 1.02 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }} 
                  transition={{ duration: 0.5 }} 
                  className="absolute h-full inset-0 flex items-center justify-center bg-slate-950/40"
                >
                  <img 
                    src={b.image_url.startsWith("https") ? b.image_url : `${API_BASE_URL}${b.image_url}`} 
                    alt={`Banner ${b.id}`} 
                    className="w-full h-full object-contain max-w-full max-h-full p-2"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-void/40 via-transparent to-transparent" />
                </motion.div>
              ))}
            </AnimatePresence>

            {banners.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                {banners.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSlide(i)} 
                    className="h-1.5 rounded-full transition-all bg-white"
                    style={{
                      width: i === slide ? "28px" : "8px",
                      opacity: i === slide ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 border-x border-b bg-slate-900/20 backdrop-blur-xl rounded-b-2xl" style={{ borderColor: C.border }}>
            {[["200+", "Products"], ["500+", "Clients"], ["100%", "Satisfied"], ["15+", "Years"]].map(([v, l], i) => (
              <div key={i} className="py-4 md:py-5 text-center border-r last:border-0" style={{ borderColor: C.border }}>
                <div className="font-extrabold text-xl md:text-2xl text-white tracking-tight">{v}</div>
                <div className="text-xs uppercase font-bold tracking-widest mt-1" style={{ color: C.slate }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="py-2 px-4 sm:px-8 lg:px-12 border-y bg-slate-950/20 backdrop-blur-md" style={{ borderColor: C.border }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <p className="label mb-2">Curated Inventories</p>
              <h2 className="display text-3xl md:text-5xl" style={{ color: C.ink }}>Fast-Running Products</h2>
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-1.5 rounded-full" style={{ background: C.gold }} />
              <div className="w-3 h-1.5 rounded-full rgba(255,255,255,0.1)" />
            </div>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory hscroll">
            {fastRunning.map((product, i) => {
              const orig = parseFloat(product.price)
              const final = (orig - orig * product.discount / 100).toFixed(2)
              return (
                <motion.div key={product.serial_number}
                  initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04 }} viewport={{ once: true }}
                  className="flex-none w-[290px] snap-center rounded-2xl border bg-void overflow-hidden"
                  style={{ borderColor: C.border, transition: "all 0.3s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "translateY(-5px)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "" }}>
                  <div className="relative">
                    <ModernCarousel media={product.image} />
                    <div className="absolute top-4 left-4"><span className="pill bg-amber-500/10 backdrop-blur-md">{product.discount}% OFF</span></div>
                    <button onClick={() => { setSelProduct(product); setShowModal(true) }}
                      className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md border bg-void/30"
                      style={{ borderColor: C.borderH }}>
                      <FaInfoCircle style={{ color: C.gold, fontSize: "14px" }} />
                    </button>
                  </div>
                  <div className="p-6">
                    <h3 className="font-extrabold text-base mb-3 line-clamp-1" style={{ color: C.ink }}>{product.productname}</h3>
                    <div className="flex items-baseline gap-2 mb-5">
                      <span className="text-xs line-through" style={{ color: C.muted }}>₹{orig}</span>
                      <span className="text-2xl font-black tracking-tight" style={{ color: C.gold }}>₹{final}</span>
                      <span className="text-xs font-semibold" style={{ color: C.slate }}>/{product.per}</span>
                    </div>
                    <button onClick={() => navigate("/price-list")} className="btn-primary w-full justify-center text-sm py-3 rounded-xl">
                      Shop Now <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-32 px-4 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="relative">
              <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: C.border }}>
                <img src={about || "/placeholder.svg"} alt="Sri Palaniyappa Crackers" className="w-full h-96 object-cover opacity-80" />
              </div>
              <div className="absolute -top-5 -left-5 w-20 h-20 rounded-2xl flex flex-col items-center justify-center glassmorphic shadow-2xl">
                <span className="font-black text-2xl text-white leading-none">15</span>
                <span className="text-[10px] font-bold tracking-wider mt-1" style={{ color: C.gold }}>YEARS</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 25 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="space-y-8">
              <div>
                <p className="label mb-2">Our Architecture</p>
                <h2 className="display text-3xl md:text-5xl" style={{ color: C.ink }}>
                  Welcome to <br/><span style={{ color: C.gold }}>Sri Palaniyappa Crackers</span>
                </h2>
              </div>
              <div className="space-y-5 text-base leading-relaxed" style={{ color: C.slate }}>
                <p>Sri Palaniyappa Crackers has transitioned from an uncompromised manufacturing core into one of Sivakasi's premier seasonal operations — designed securely around the criteria of safety and premium verification standards.</p>
                <p>We preserve explicit tracking matrices along standard corporate distribution networks, catering baseline value structures to wedding organizations, regional milestones, and institutional galas.</p>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-2xl glassmorphic">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: C.gold }} />
                <p className="text-xs leading-relaxed" style={{ color: C.slate }}>Notice: In strict alignment with legislative protocols, e-commerce clearing functions are wholly absent. Systems function for structural registry cataloguing only — contact our office desks explicitly for manifest requests.</p>
              </div>
              <button onClick={() => navigate("/about-us")} className="btn-outline">Our Full History <ArrowRight className="w-4 h-4" /></button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-28 px-4 sm:px-8 lg:px-12 border-t bg-slate-950/20 backdrop-blur-md" style={{ borderColor: C.border }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-4">
            <div>
              <p className="label mb-2">Structural Categories</p>
              <h2 className="display text-3xl md:text-5xl" style={{ color: C.ink }}>The Grand Catalogues</h2>
            </div>
            <p className="serif italic text-base" style={{ color: C.slate, maxWidth: "280px" }}>
              Six configured categories matched according to distinct baseline event blueprints.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(({ name, icon: Icon, description }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04 }} viewport={{ once: true }}
                className="rounded-2xl p-6 flex flex-col justify-between glassmorphic"
                style={{ transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.background = "rgba(15, 23, 42, 0.7)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ""; e.currentTarget.style.background = C.glass }}>
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-white/5"
                      style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      <Icon className="w-5 h-5" style={{ color: C.gold }} />
                    </div>
                    <span className="text-3xl font-black opacity-15 tracking-tight" style={{ color: C.gold }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg mb-2" style={{ color: C.ink }}>{name}</h3>
                  <p className="text-sm leading-relaxed mb-8" style={{ color: C.slate }}>{description}</p>
                </div>
                <button onClick={() => navigate("/price-list")} className="btn-outline text-xs py-3 justify-center w-full rounded-xl">
                  Explore Parameters <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-4 sm:px-8 lg:px-12 relative overflow-hidden bg-void border-t" style={{ borderColor: C.border }}>
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none select-none">
          <span className="display font-black text-white tracking-widest text-[14rem]">MANIFEST</span>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <p className="label mb-3">Institutional Logistics</p>
            <h2 className="display text-4xl md:text-6xl mb-8" style={{ color: C.ink }}>
              Illuminating Your <br/>Highest Milestones
            </h2>
            <p className="mb-12 text-base mx-auto max-w-xl leading-relaxed" style={{ color: C.slate }}>
              Examine our industrial volume structures, aggregate your specific structural logistics, and log a baseline intent portfolio. Response verifications exit within twenty-four operational hours.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <button onClick={() => navigate("/price-list")} className="btn-primary">
                View Corporate Catalogues <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate("/contact-us")} className="btn-outline">
                Contact Desk
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-28 px-4 sm:px-8 lg:px-12 border-t bg-slate-950/20 backdrop-blur-md" style={{ borderColor: C.border }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="label mb-2">Operational Analytics</p>
            <h2 className="display text-3xl md:text-4xl" style={{ color: C.ink }}>Established Market Parameters</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsData.map((s, i) => <StatCard key={i} {...s} delay={i * 0.06} />)}
          </div>
        </div>
      </section>

      <footer className="border-t bg-slate-950/40 backdrop-blur-xl" style={{ borderColor: C.border }}>
        <div className="px-4 sm:px-8 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b bg-void/50" style={{ borderColor: C.border }}>
          <span className="text-white font-extrabold tracking-wider text-sm uppercase">Sri Palaniyappa Crackers</span>
          <span className="text-xs font-bold tracking-widest" style={{ color: C.gold }}>SIVAKASI · EST. 2009</span>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-widest mb-5">Corporate Frame</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: C.slate }}>Premium structural fireworks crafted matching strict high-tier regulatory parameters. Anchoring monumental architectures of light safely across generations.</p>
              <button onClick={() => navigate("/about-us")} className="text-xs font-bold flex items-center gap-2 transition-colors" style={{ color: C.gold }}>
                Corporate Parameters <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-widest mb-5">Communications Desk</h3>
              <div className="space-y-3 text-sm" style={{ color: C.slate }}>
                <p><span className="text-white font-bold">Office Core:</span><br />Vaanakkar street, Salem, Tamil Nadu</p>
                <a href="tel:+918124259430" className="block hover:text-white transition-colors">+91 81242 59430</a>
                <a href="mailto:sreepalaniyappacrackers@gmail.com" className="block hover:text-white transition-colors">sreepalaniyappacrackers@gmail.com</a>
              </div>
            </div>
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-widest mb-5">Navigation Registry</h3>
              <ul className="space-y-3 text-sm">
                {navLinks.map(link => (
                  <li key={link}>
                    <a href={link === "Home" ? `/` : `/${link.toLowerCase().replace(/ /g, "-")}`}
                      className="hover:text-white flex items-center gap-2 transition-colors" style={{ color: C.slate }}>
                      <span style={{ color: C.gold }}>·</span> {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="text-center space-y-4 pt-8 border-t border-white/5">
            <p className="text-xs leading-relaxed mx-auto max-w-3xl" style={{ color: C.muted }}>
              Statutory Declaration: Adhering meticulously to the 2018 supreme judicial parameters of India, digital programmatic clearing structures for firecrackers are entirely unauthorized. Items mapped on this node operate strictly for manifest inventory cataloguing configurations.
            </p>
            <p className="text-xs" style={{ color: C.muted }}>
              © 2026 <span style={{ color: C.gold }}>Sri Palaniyappa Crackers</span>. All rights reserved. Architecture engineered by <span style={{ color: C.gold }}>SPD Solutions</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}