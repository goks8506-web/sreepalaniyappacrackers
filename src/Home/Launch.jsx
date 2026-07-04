import { useEffect, useRef, useState, useCallback } from "react"

const rand    = (a, b) => Math.random() * (b - a) + a
const randInt = (a, b) => Math.floor(rand(a, b))

const BURST_PALETTES = [
  ["#ff4500","#ff6a00","#ffb347","#ffe066","#fff"],
  ["#ff0080","#ff69b4","#ffb6c1","#fff"],
  ["#00cfff","#7efff5","#b2ffef","#fff"],
  ["#a259ff","#c084fc","#e9d5ff","#fff"],
  ["#39ff14","#7fff00","#adff2f","#fff"],
  ["#ffd700","#ffec8b","#fff8dc","#fff"],
]

// ── Fireworks Engine ────────────────────────────────────────
function useFireworksEngine(canvasRef, phase) {
  const animRef   = useRef(null)
  const particles = useRef([])
  const rockets   = useRef([])
  const frame     = useRef(0)
  const W = useRef(0), H = useRef(0)

  const burst = useCallback((x, y, palette) => {
    const pal = palette || BURST_PALETTES[randInt(0, BURST_PALETTES.length)]
    const count = randInt(110, 170)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.08, 0.08)
      const speed = rand(2.5, 11)
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: pal[randInt(0, pal.length)],
        alpha: 1, size: rand(1.8, 5),
        decay: rand(0.011, 0.021),
        gravity: rand(0.07, 0.16),
        tail: [],
        twinkle: Math.random() > 0.55,
        twinkleSpeed: rand(0.08, 0.2),
        twinklePhase: rand(0, Math.PI * 2),
      })
    }
    // Crisp ring
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * rand(7, 13),
        vy: Math.sin(angle) * rand(7, 13),
        color: "#fff", alpha: 1, size: rand(1.2, 2.8),
        decay: rand(0.024, 0.04), gravity: 0.03,
        tail: [], twinkle: false, twinkleSpeed: 0, twinklePhase: 0,
      })
    }
  }, [])

  const launchRocket = useCallback((tx, ty, pal) => {
    const sx = W.current * rand(0.3, 0.7), sy = H.current + 10
    const dur = rand(55, 88)
    rockets.current.push({
      x: sx, y: sy,
      vx: (tx - sx) / dur, vy: (ty - sy) / dur,
      trail: [], life: dur, palette: pal,
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      W.current = canvas.width
      H.current = canvas.height
    }
    resize()
    window.addEventListener("resize", resize)

    const ids = []

    if (phase === "burst") {
      const pts = [
        [.22,.13],[.5,.08],[.78,.13],[.14,.2],[.86,.2],
        [.38,.1],[.62,.1],[.3,.17],[.7,.17],[.5,.05],
        [.1,.22],[.9,.22],
      ]
      pts.forEach(([tx, ty], i) =>
        ids.push(setTimeout(() =>
          launchRocket(W.current * tx, H.current * ty, BURST_PALETTES[i % BURST_PALETTES.length]),
        i * 160))
      )
      ids.push(setInterval(() =>
        launchRocket(W.current * rand(.1,.9), H.current * rand(.04,.28), BURST_PALETTES[randInt(0, BURST_PALETTES.length)]),
      360))
    }

    const draw = () => {
      frame.current++
      ctx.fillStyle = "rgba(0,0,0,0.17)"
      ctx.fillRect(0, 0, W.current, H.current)

      rockets.current = rockets.current.filter(r => {
        r.trail.push({ x: r.x, y: r.y })
        if (r.trail.length > 18) r.trail.shift()
        r.x += r.vx; r.y += r.vy; r.life--

        r.trail.forEach((pt, i) => {
          const a  = (i / r.trail.length) * 0.75
          const sz = (i / r.trail.length) * 4
          ctx.beginPath(); ctx.arc(pt.x, pt.y, sz, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,180,60,${a})`; ctx.fill()
        })
        ctx.beginPath(); ctx.arc(r.x, r.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = "#fff"; ctx.shadowColor = "#ffaa00"; ctx.shadowBlur = 20
        ctx.fill(); ctx.shadowBlur = 0

        if (r.life <= 0) {
          burst(r.x, r.y, r.palette)
          ctx.beginPath(); ctx.arc(r.x, r.y, 65, 0, Math.PI * 2)
          const g = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 65)
          g.addColorStop(0, "rgba(255,255,255,0.92)")
          g.addColorStop(1, "rgba(255,255,255,0)")
          ctx.fillStyle = g; ctx.fill()
          return false
        }
        return true
      })

      particles.current = particles.current.filter(p => {
        p.tail.push({ x: p.x, y: p.y })
        if (p.tail.length > 6) p.tail.shift()
        p.x += p.vx; p.y += p.vy
        p.vy += p.gravity; p.vx *= 0.985; p.alpha -= p.decay
        if (p.alpha <= 0) return false

        const tm = p.twinkle
          ? 0.5 + 0.5 * Math.sin(frame.current * p.twinkleSpeed + p.twinklePhase)
          : 1

        p.tail.forEach((pt, i) => {
          ctx.beginPath(); ctx.arc(pt.x, pt.y, p.size * 0.45, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.globalAlpha = (i / p.tail.length) * p.alpha * 0.35 * tm
          ctx.fill()
        })
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha * tm
        ctx.shadowColor = p.color; ctx.shadowBlur = 8
        ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1
        return true
      })

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      ids.forEach(id => { clearTimeout(id); clearInterval(id) })
      window.removeEventListener("resize", resize)
      particles.current = []; rockets.current = []
    }
  }, [phase, burst, launchRocket])
}

// ── Minimal star field ──────────────────────────────────────
function Stars() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {Array.from({ length: 90 }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 137.5) % 100}%`,
          top:  `${(i * 79.3) % 100}%`,
          width:  i % 9 === 0 ? 2 : 1,
          height: i % 9 === 0 ? 2 : 1,
          borderRadius: "50%",
          background: "#fff",
          opacity: 0.35,
          animation: `twinkle ${2 + (i % 4) * 0.5}s ${(i * 0.08) % 3}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
}

// ── Clean city skyline ──────────────────────────────────────
function Skyline({ lit }) {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "55%", pointerEvents: "none", zIndex: 1 }}
    >
      <defs>
        <linearGradient id="skyGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ff4500" stopOpacity={lit ? "0.18" : "0.04"} />
          <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1440" height="320" fill="url(#skyGlow)" />

      {/* Far layer — thin silhouette */}
      {[
        [0,200,90,120],[100,185,60,135],[170,175,80,145],[265,190,55,130],
        [332,168,95,152],[440,180,65,140],[518,162,100,158],[635,178,60,142],
        [710,165,82,155],[806,182,65,138],[885,170,88,150],[988,188,58,132],
        [1060,162,78,158],[1150,178,68,142],[1232,192,80,128],[1330,200,85,120],
      ].map(([x, y, w, h], i) => (
        <g key={`f${i}`}>
          <rect x={x} y={y} width={w} height={h} fill="#060606" />
          {/* Simple window grid */}
          {Array.from({ length: Math.floor(h / 22) }, (_, r) =>
            Array.from({ length: Math.floor(w / 16) }, (_, c) => (
              <rect key={`${r}${c}`}
                x={x + 4 + c * 16} y={y + 6 + r * 22}
                width={7} height={10}
                fill={(r + c) % 4 === 0 ? (lit ? "#291000" : "#0f0800") : "#050505"}
                opacity={lit ? 0.9 : 0.5}
              />
            ))
          )}
        </g>
      ))}

      {/* Near layer — taller, darker */}
      {[
        [0,238,95,82],[105,222,110,98],[230,230,75,90],[318,210,130,110],
        [462,226,98,94],[574,205,140,115],[730,228,90,92],[835,214,118,106],
        [968,226,100,94],[1082,208,110,112],[1208,222,85,98],[1310,240,130,80],
      ].map(([x, y, w, h], i) => (
        <g key={`n${i}`}>
          <rect x={x} y={y} width={w} height={h} fill="#030303" />
          {i % 4 === 0 && (
            <>
              <line x1={x+w/2} y1={y} x2={x+w/2} y2={y-16} stroke="#1a1a1a" strokeWidth="1.5"/>
              <circle cx={x+w/2} cy={y-18} r="2" fill={lit ? "#ff3300" : "#111"}
                style={lit ? {animation:"antennaBlink 2s ease-in-out infinite"} : {}}/>
            </>
          )}
          {Array.from({ length: Math.floor(h / 26) }, (_, r) =>
            Array.from({ length: Math.floor(w / 20) }, (_, c) => (
              <rect key={`${r}${c}`}
                x={x + 5 + c * 20} y={y + 8 + r * 26}
                width={9} height={13}
                fill={(r * 2 + c) % 5 === 0 ? (lit ? "#331500" : "#150a00") : "#040404"}
                opacity={lit ? 0.95 : 0.5}
              />
            ))
          )}
        </g>
      ))}

      {/* Ground strip */}
      <rect x="0" y="310" width="1440" height="10" fill="#010101" />
      <line x1="0" y1="310" x2="1440" y2="310" stroke={lit ? "#1a0800" : "#0a0a0a"} strokeWidth="1" />
    </svg>
  )
}

// ── Sleek Rocket ────────────────────────────────────────────
function Rocket({ lit }) {
  return (
    <svg viewBox="0 0 48 110" width="48" height="110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rb" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#991100" />
          <stop offset="45%"  stopColor="#ff4400" />
          <stop offset="100%" stopColor="#661100" />
        </linearGradient>
        <linearGradient id="rf" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#882200" />
          <stop offset="100%" stopColor="#cc3300" />
        </linearGradient>
        <radialGradient id="rfl" cx="50%" cy="10%" r="80%">
          <stop offset="0%"   stopColor="#fff"    stopOpacity="0.95"/>
          <stop offset="30%"  stopColor="#ffee44" stopOpacity="0.85"/>
          <stop offset="70%"  stopColor="#ff6600" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff0000" stopOpacity="0"/>
        </radialGradient>
        <filter id="fb"><feGaussianBlur stdDeviation="1.8"/></filter>
      </defs>

      {/* Body */}
      <path d="M24 4 Q34 22 34 56 L14 56 Q14 22 24 4Z" fill="url(#rb)"/>
      {/* Nose */}
      <path d="M24 1 Q29 14 29 24 Q24 18 19 24 Q19 14 24 1Z" fill="#ff3300"/>
      {/* Porthole */}
      <circle cx="24" cy="35" r="6" fill="#000c22" stroke="#6699ff" strokeWidth="1.2"/>
      <circle cx="22.5" cy="33.5" r="1.8" fill="#fff" opacity="0.25"/>
      {/* Fins */}
      <path d="M14 50 L4 68 L14 62Z"  fill="url(#rf)"/>
      <path d="M34 50 L44 68 L34 62Z" fill="url(#rf)"/>
      {/* Boosters */}
      <rect x="8"  y="48" width="6" height="16" rx="2.5" fill="#881100"/>
      <rect x="34" y="48" width="6" height="16" rx="2.5" fill="#881100"/>

      {/* Flame */}
      {lit && (
        <>
          <ellipse cx="24" cy="68" rx={9} ry={20}
            fill="url(#rfl)" opacity="0.95"
            style={{animation:"ff 0.09s ease-in-out infinite alternate"}}/>
          <ellipse cx="24" cy="68" rx="18" ry="28"
            fill="#ff4400" opacity="0.12" filter="url(#fb)"/>
          {/* Booster flames */}
          <ellipse cx="11" cy="66" rx="3.5" ry="9" fill="#ffaa00" opacity="0.7"/>
          <ellipse cx="37" cy="66" rx="3.5" ry="9" fill="#ffaa00" opacity="0.7"/>
        </>
      )}
    </svg>
  )
}

// ── Reveal text ─────────────────────────────────────────────
function Word({ text, delay, gradient }) {
  return (
    <span style={{ display: "block" }}>
      {text.split("").map((ch, i) => (
        <span key={i} style={{
          display: "inline-block",
          opacity: 0,
          fontSize: "clamp(36px,9.5vw,108px)",
          fontWeight: 900,
          fontFamily: "'Cinzel', serif",
          background: gradient,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "0.04em",
          animation: `drop .5s cubic-bezier(.23,1.5,.6,1) both, glimmer 3s linear ${1 + i * 0.04}s infinite`,
          animationDelay: `${delay + i * 0.042}s`,
          animationFillMode: "forwards",
        }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  )
}

// ── Main ────────────────────────────────────────────────────
export default function Launch({ onComplete }) {
  const canvasRef = useRef(null)

  // phases: idle → warmup → ignition → liftoff → burst → reveal → exit
  const [phase,       setPhase]       = useState("idle")
  const [lit,         setLit]         = useState(false)
  const [rocketY,     setRocketY]     = useState("0px")
  const [rocketTrans, setRocketTrans] = useState("none")
  const [showRocket,  setShowRocket]  = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [exiting,     setExiting]     = useState(false)
  const [progress,    setProgress]    = useState(0)

  useFireworksEngine(canvasRef, phase === "burst" ? "burst" : "idle")

  useEffect(() => {
    const ids = []
    const t = (fn, ms) => { const id = setTimeout(fn, ms); ids.push(id); return id }

    // Warm-up: flame appears
    t(() => { setPhase("warmup"); setLit(true) }, 600)

    // Ignition: brief pause with glow
    t(() => setPhase("ignition"), 1400)

    // Liftoff: rocket flies up
    t(() => {
      setPhase("liftoff")
      setRocketTrans("transform 1.7s cubic-bezier(0.22,1,0.36,1)")
      setRocketY("-130vh")
    }, 2000)

    // Burst: rocket gone, fireworks start
    t(() => {
      setPhase("burst")
      setShowRocket(false)
    }, 3400)

    // Reveal
    t(() => setShowContent(true), 4000)

    // Progress
    const totalMs = 9800
    const start   = Date.now()
    const tick    = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / totalMs) * 100, 100)
      setProgress(pct)
      if (pct >= 100) clearInterval(tick)
    }, 40)
    ids.push(tick)

    // Exit
    t(() => setExiting(true), 9200)
    t(() => onComplete && onComplete(), 9800)

    return () => ids.forEach(id => { clearTimeout(id); clearInterval(id) })
  }, [])

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#000",
      overflow: "hidden",
      transform: exiting ? "translateY(-100%)" : "translateY(0)",
      transition: "transform 0.72s cubic-bezier(0.76,0,0.24,1)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Crimson+Text:ital,wght@0,400;1,400&display=swap');

        @keyframes twinkle    { 0%,100%{opacity:.18;transform:scale(1)} 50%{opacity:.85;transform:scale(1.5)} }
        @keyframes ff         { 0%{transform:scaleX(.86) scaleY(.92)} 100%{transform:scaleX(1.14) scaleY(1.08)} }
        @keyframes antennaBlink { 0%,100%{opacity:.4} 50%{opacity:1} }

        @keyframes drop {
          0%   { opacity:0; transform:translateY(-36px) rotate(-6deg); }
          100% { opacity:1; transform:translateY(0)     rotate(0deg);  }
        }
        @keyframes glimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes fadeUp {
          0%   { opacity:0; transform:translateY(16px); }
          100% { opacity:1; transform:translateY(0);    }
        }
        @keyframes pulseRing {
          0%   { transform:scale(0.9); opacity:.7; }
          100% { transform:scale(1.6); opacity:0;  }
        }
        @keyframes barShine {
          0%   { left:-100%; }
          100% { left: 200%; }
        }
        @keyframes emberUp {
          0%   { transform:translateY(0) translateX(0)   rotate(0deg);   opacity:1; }
          100% { transform:translateY(-70px) translateX(var(--dx)) rotate(360deg); opacity:0; }
        }
        @keyframes exhaustRing {
          0%   { opacity:.7; transform:translateY(0)   scaleX(1); }
          100% { opacity:0;  transform:translateY(36px) scaleX(3); }
        }
        @keyframes ignFlash {
          0%,100% { opacity:.4; } 50% { opacity:.9; }
        }
      `}</style>

      {/* Stars */}
      <Stars />

      {/* Fireworks canvas */}
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, zIndex:2, pointerEvents:"none" }} />

      {/* City skyline */}
      <Skyline lit={lit} />

      {/* ── Ignition ground glow ── */}
      {phase === "ignition" && (
        <div style={{
          position:"absolute", bottom:60, left:"50%",
          transform:"translateX(-50%)",
          width:200, height:200, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(255,120,0,0.35) 0%, transparent 70%)",
          zIndex:4, pointerEvents:"none",
          animation:"ignFlash 0.35s ease-in-out 4",
        }}/>
      )}

      {/* ── Rocket ── */}
      {showRocket && (
        <div style={{
          position:"absolute",
          left:"50%",
          bottom: 58,
          zIndex: 6,
          transform: `translateX(-50%) translateY(${rocketY})`,
          transition: rocketTrans,
          filter: lit
            ? "drop-shadow(0 0 22px #ff6600) drop-shadow(0 0 50px #ff440070)"
            : "none",
        }}>
          <Rocket lit={lit} />

          {/* Exhaust rings */}
          {lit && phase !== "liftoff" && ["0s","0.28s","0.56s"].map((d, i) => (
            <div key={i} style={{
              position:"absolute", bottom:-8, left:"50%",
              transform:"translateX(-50%)",
              width: 24 + i * 14, height: 10,
              borderRadius:"50%",
              background:`rgba(255,${90+i*35},0,${0.38-i*0.1})`,
              filter:"blur(5px)",
              animation:`exhaustRing .85s ${d} ease-out infinite`,
            }}/>
          ))}

          {/* Embers */}
          {lit && Array.from({length:10}, (_,i) => (
            <div key={i} style={{
              "--dx": `${(i%2===0?1:-1)*(8+i*6)}px`,
              position:"absolute", bottom: -4-i*3, left:`${28+i*4}%`,
              width:3, height:3, borderRadius:"50%",
              background:["#ff4500","#ffaa00","#ff6600","#ffdd00","#fff"][i%5],
              boxShadow:`0 0 6px ${["#ff4500","#ffaa00","#ff6600","#ffdd00","#fff"][i%5]}`,
              animation:`emberUp ${0.6+i*0.12}s ${i*0.08}s ease-out infinite`,
            }}/>
          ))}

          {/* Pulse rings at ignition */}
          {phase === "ignition" && [0,1].map(i => (
            <div key={i} style={{
              position:"absolute", bottom:-16, left:"50%",
              transform:"translateX(-50%)",
              width:80, height:80, borderRadius:"50%",
              border:"1px solid rgba(255,100,0,0.5)",
              animation:`pulseRing 0.7s ${i*0.35}s ease-out infinite`,
            }}/>
          ))}
        </div>
      )}

      {/* ── Content reveal ── */}
      {showContent && (
        <div style={{
          position:"absolute", inset:0, zIndex:9,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:"0 24px", textAlign:"center",
          pointerEvents:"none",
        }}>

          {/* Top rule */}
          <div style={{
            width:"min(260px,68vw)", height:1,
            background:"linear-gradient(90deg, transparent, rgba(255,100,0,.7), transparent)",
            marginBottom:20,
            animation:"fadeUp .6s ease both",
          }}/>

          {/* Provenance */}
          <p style={{
            fontFamily:"'Crimson Text', Georgia, serif",
            fontStyle:"italic",
            fontSize:"clamp(11px,2vw,15px)",
            color:"rgba(255,170,100,.75)",
            letterSpacing:"0.28em",
            textTransform:"uppercase",
            margin:"0 0 14px",
            animation:"fadeUp .7s .08s ease both",
            opacity:0, animationFillMode:"forwards",
          }}>
            Sivakasi's Finest &nbsp;·&nbsp; Est. 2009
          </p>

          {/* Title */}
          <h1 style={{ margin:"0 0 4px", lineHeight:1.0 }}>
            <Word
              text="MADHU NISHA"
              delay={0.18}
              gradient="linear-gradient(135deg, #ff6600 0%, #ffcc00 38%, #ff4400 68%, #ff8800 100%)"
            />
            <Word
              text="CRACKERS"
              delay={0.58}
              gradient="linear-gradient(135deg, #ff4400 0%, #ffaa00 38%, #ff2200 68%, #ff6600 100%)"
            />
          </h1>

          {/* Thin divider */}
          <div style={{
            display:"flex", alignItems:"center", gap:10, margin:"18px 0",
            animation:"fadeUp .6s 1.15s ease both",
            opacity:0, animationFillMode:"forwards",
          }}>
            <div style={{width:48, height:"0.5px", background:"linear-gradient(90deg,transparent,rgba(255,110,0,.6))"}}/>
            <span style={{fontSize:18, lineHeight:1}}>🎆</span>
            <div style={{width:4, height:4, borderRadius:"50%", background:"#ff8844", opacity:.7}}/>
            <span style={{fontSize:18, lineHeight:1}}>🎇</span>
            <div style={{width:48, height:"0.5px", background:"linear-gradient(90deg,rgba(255,110,0,.6),transparent)"}}/>
          </div>

          {/* Tagline */}
          <p style={{
            fontFamily:"'Crimson Text', Georgia, serif",
            fontSize:"clamp(13px,2.4vw,18px)",
            color:"rgba(255,205,160,.8)",
            letterSpacing:"0.08em",
            maxWidth:480, lineHeight:1.75,
            margin:"0 0 28px",
            animation:"fadeUp .8s 1.3s ease both",
            opacity:0, animationFillMode:"forwards",
          }}>
            Premium quality fireworks crafted in the heart of Sivakasi —<br/>
            lighting up every celebration since 2009.
          </p>

          {/* CTA pill */}
          <div style={{
            animation:"fadeUp .6s 1.6s ease both",
            opacity:0, animationFillMode:"forwards",
          }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"10px 30px",
              borderRadius:2,
              border:"1px solid rgba(255,100,0,.32)",
              background:"rgba(255,55,0,.06)",
              backdropFilter:"blur(6px)",
              color:"rgba(255,155,90,.85)",
              fontFamily:"'Cinzel', serif",
              fontSize:"clamp(8px,1.5vw,11px)",
              letterSpacing:"0.38em",
              textTransform:"uppercase",
            }}>
              <div style={{
                width:5, height:5, borderRadius:"50%",
                background:"#ff4500",
                boxShadow:"0 0 8px #ff4500",
                animation:"antennaBlink 1.2s ease-in-out infinite",
              }}/>
              Entering Showroom
            </div>
          </div>

          {/* Bottom rule */}
          <div style={{
            width:"min(260px,68vw)", height:1,
            background:"linear-gradient(90deg, transparent, rgba(255,100,0,.7), transparent)",
            marginTop:22,
            animation:"fadeUp .6s 1.8s ease both",
            opacity:0, animationFillMode:"forwards",
          }}/>
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:10,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"11px 22px",
        borderBottom:"1px solid rgba(255,70,0,.08)",
        background:"rgba(0,0,0,.5)",
        backdropFilter:"blur(8px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{
            width:5, height:5, borderRadius:"50%",
            background: lit ? "#ff4500" : "#1f1f1f",
            boxShadow: lit ? "0 0 8px #ff4500" : "none",
            transition:"all .4s",
            animation: lit ? "antennaBlink 1.2s ease-in-out infinite" : "none",
          }}/>
          <span style={{
            fontFamily:"'Cinzel',serif",
            fontSize:8,
            letterSpacing:"0.32em",
            color:"rgba(255,120,60,.45)",
            textTransform:"uppercase",
          }}>
            Madhu Nisha Crackers
          </span>
        </div>
        <span style={{
          fontSize:8,
          color:"rgba(255,80,0,.3)",
          fontFamily:"monospace",
          letterSpacing:"0.08em",
        }}>
          {phase.toUpperCase()}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, zIndex:10,
        background:"linear-gradient(to top, rgba(0,0,0,.85), transparent)",
      }}>
        <div style={{
          display:"flex", justifyContent:"space-between",
          padding:"7px 22px 5px",
          fontSize:8,
          color:"rgba(255,255,255,.15)",
          fontFamily:"monospace",
          letterSpacing:"0.1em",
          textTransform:"uppercase",
        }}>
          <span>Igniting experience</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{ height:1.5, background:"rgba(255,255,255,.04)", position:"relative", overflow:"hidden" }}>
          <div style={{
            height:"100%",
            width:`${progress}%`,
            background: progress > 90
              ? "linear-gradient(90deg,#22c55e,#4ade80)"
              : "linear-gradient(90deg,#7f1d1d,#dc2626,#ff4500,#ffaa00)",
            transition:"width .1s linear, background .5s",
            boxShadow:"0 0 10px #ff450070",
            position:"relative",
          }}>
            <div style={{
              position:"absolute", top:0, bottom:0, width:"35%",
              background:"linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent)",
              animation:"barShine 1.2s linear infinite",
            }}/>
          </div>
        </div>
      </div>
    </div>
  )
}