import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

/* ─── Palettes (crimson / saffron / purple / ember) ─── */
const PALETTES = [
  ["rgb(192,57,43)","rgb(231,76,60)","rgb(255,180,120)","rgb(255,220,160)"],
  ["rgb(230,126,34)","rgb(243,156,18)","rgb(255,200,60)","rgb(255,240,180)"],
  ["rgb(142,68,173)","rgb(155,89,182)","rgb(210,160,220)","rgb(240,220,255)"],
  ["rgb(192,57,43)","rgb(255,120,80)","rgb(255,200,100)","rgb(255,255,200)"],
]

const ROCKET_SCHEDULE = [400, 1200, 2100, 3000, 3900] // ms
const DURATION        = 4800                            // ms total

/* ─── Particle ─── */
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 4
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed - 1
    this.alpha  = 1
    this.radius = 1.5 + Math.random() * 2
    this.color  = color
    this.decay  = 0.012 + Math.random() * 0.015
    this.gravity= 0.07
    this.trail  = []
  }
  update() {
    this.trail.push({ x: this.x, y: this.y, a: this.alpha })
    if (this.trail.length > 6) this.trail.shift()
    this.vy += this.gravity
    this.x  += this.vx
    this.y  += this.vy
    this.alpha -= this.decay
    this.vx *= 0.98
  }
  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const t  = this.trail[i]
      const ta = t.a * (i / this.trail.length) * 0.35
      ctx.beginPath()
      ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = this.color.replace(")", `,${ta})`).replace("rgb", "rgba")
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.color.replace(")", `,${this.alpha})`).replace("rgb", "rgba")
    ctx.fill()
  }
}

/* ─── Rocket ─── */
class Rocket {
  constructor(W, H) {
    this.x  = W * 0.2 + Math.random() * W * 0.6
    this.y  = H + 10
    this.tx = W * 0.2 + Math.random() * W * 0.6
    this.ty = H * 0.15 + Math.random() * H * 0.4
    const dist  = Math.hypot(this.tx - this.x, this.ty - this.y)
    const speed = 6
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
      const pal   = PALETTES[Math.floor(Math.random() * PALETTES.length)]
      const count = 55 + Math.floor(Math.random() * 30)
      for (let i = 0; i < count; i++)
        particles.push(new Particle(this.x, this.y, pal[Math.floor(Math.random() * pal.length)]))
    }
  }
  draw(ctx) {
    if (this.burst) return
    this.trail.forEach((t, i) => {
      const a = (i / this.trail.length) * 0.5
      ctx.beginPath()
      ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,200,100,${a})`
      ctx.fill()
    })
    ctx.beginPath()
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = "#fff"
    ctx.fill()
  }
}

/* ═══════════════════════════════════════════════════════
   IntroLoader component
   Props:
     onComplete  — called when loader exits (navigate / setState)
     minDuration — ms before "Enter" button shows (default 4800)
   ═══════════════════════════════════════════════════════ */
export default function IntroLoader({ onComplete, minDuration = DURATION }) {
  const canvasRef  = useRef(null)
  const rafRef     = useRef(null)
  const startRef   = useRef(null)
  const rockets    = useRef([])
  const particles  = useRef([])

  const [progress, setProgress] = useState(0)
  const [ready,    setReady   ] = useState(false)   // "Enter" button
  const [exiting,  setExiting ] = useState(false)

  /* ── canvas animation ── */
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

      /* dim trail */
      ctx.fillStyle = "rgba(13,10,6,0.22)"
      ctx.fillRect(0, 0, W, H)

      /* launch rockets on schedule */
      while (scheduleIdx < ROCKET_SCHEDULE.length && elapsed >= ROCKET_SCHEDULE[scheduleIdx]) {
        rockets.current.push(new Rocket(W, H))
        scheduleIdx++
      }

      /* draw rockets */
      rockets.current.forEach(r => { r.update(particles.current); r.draw(ctx) })

      /* draw particles (back to front) */
      for (let i = particles.current.length - 1; i >= 0; i--) {
        particles.current[i].update()
        particles.current[i].draw(ctx)
        if (particles.current[i].alpha <= 0) particles.current.splice(i, 1)
      }

      /* progress */
      const p = Math.min(100, Math.round((elapsed / minDuration) * 100))
      setProgress(p)
      if (p >= 100) setReady(true)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [minDuration])

  /* ── exit ── */
  const exit = () => {
    setExiting(true)
    setTimeout(() => { onComplete?.() }, 700)
  }

  /* auto-exit 1 s after ready */
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(exit, 1000)
    return () => clearTimeout(t)
  }, [ready]) // eslint-disable-line

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="intro-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.65, ease: "easeInOut" } }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "#0d0a06",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* canvas */}
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}/>

          {/* centre card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 1.5rem" }}
          >
            {/* label */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.4)",
              color: "#e08070", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.22em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: 100, marginBottom: 20,
              fontFamily: "'Barlow', sans-serif",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#c0392b",
                animation: "spc-pulse 1.4s ease infinite",
              }}/>
              Sivakasi · Est. 2009
            </div>

            {/* heading */}
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: "clamp(2rem,6vw,3rem)", color: "#fff",
              lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 6,
            }}>
              Sree Palaniyappa<br/>
              <span style={{ color: "#c0392b" }}>Crackers</span>
            </h1>

            {/* tagline */}
            <p style={{
              fontFamily: "'Lora', serif", fontStyle: "italic",
              fontSize: 15, color: "rgba(255,255,255,0.4)",
              marginBottom: 32, letterSpacing: "0.01em",
            }}>
              "Every burst of light is a memory made"
            </p>

            {/* progress bar */}
            <div style={{
              width: 220, height: 2, background: "rgba(255,255,255,0.08)",
              borderRadius: 2, margin: "0 auto 10px", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", background: "#c0392b", borderRadius: 2,
                width: progress + "%", transition: "width 0.06s linear",
              }}/>
            </div>
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.3)",
              fontWeight: 600, letterSpacing: "0.1em",
              fontFamily: "'Barlow', sans-serif", marginBottom: 8,
            }}>
              {progress < 100 ? progress + "%" : "Welcome!"}
            </div>

            {/* enter button */}
            <AnimatePresence>
              {ready && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={exit}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    background: "#c0392b", color: "#fff",
                    fontFamily: "'Syne', sans-serif", fontWeight: 700,
                    fontSize: 13, letterSpacing: "0.06em",
                    padding: "12px 28px", borderRadius: 4, border: "none",
                    cursor: "pointer", marginTop: 8,
                  }}
                >
                  Enter the Store →
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <style>{`
            @keyframes spc-pulse {
              0%,100%{opacity:1;transform:scale(1)}
              50%{opacity:0.5;transform:scale(0.7)}
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}