import { motion } from "framer-motion"
import { Sparkles, Target, Eye, Shield, ArrowRight, Phone } from "lucide-react"
import Navbar from "../Component/Navbar"
import fire from '../fire.jpg'

const C = {
  void:       "#030712", 
  glass:      "rgba(15, 23, 42, 0.45)",
  gold:       "#f59e0b", 
  ink:        "#f8fafc", 
  slate:      "#cbd5e1", 
  muted:      "#64748b", 
  border:     "rgba(255, 255, 255, 0.07)",
}

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&family=Syne:wght@700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body { background: #030712; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; }
    .display { font-family: 'Syne', sans-serif; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; }
    .serif { font-family: 'Lora', serif; }
    .label { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase; color: #f59e0b; }
    .glassmorphic { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
  `}</style>
)

const companyValues = [
  {
    icon: Target,
    label: "01",
    title: "Our Mission",
    content: "We place customers at the heart of everything — delivering exceptional quality, thoughtful packaging, dependable service, and fair pricing."
  },
  {
    icon: Eye,
    label: "02",
    title: "Our Vision",
    content: "To be the most trusted fireworks name across India — reaching every home, every retailer, and every event planner who wants authentic Sivakasi craftsmanship."
  },
  {
    icon: Shield,
    label: "03",
    title: "Our Values",
    content: "Safety is non-negotiable. We uphold rigorous quality control and believe in innovation, transparency, and creating lasting experiences."
  },
]

export default function About() {
  return (
    <div className="min-h-screen cosmic-mesh overflow-x-hidden" style={{ background: C.void, color: C.ink }}>
      <GlobalStyles />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero Section */}
          <section className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                <img src={fire} alt="Fireworks display" className="w-full h-[420px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-72 h-72 border border-white/10 rounded-3xl -z-10" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
              <div>
                <span className="label">Since 2009 · Sivakasi</span>
                <h1 className="display text-5xl md:text-6xl mt-4">Discover <span className="text-gold">Sree Palaniyappa Fireworks</span></h1>
              </div>

              <div className="space-y-6 text-lg" style={{ color: C.slate }}>
                <p>Sree Palaniyappa Fireworks is your premier destination for premium quality crackers, illuminating celebrations across India with unmatched brilliance.</p>
                <p>From vibrant festivals to intimate gatherings, we deliver innovative, safe, and spectacular products crafted to create lasting memories.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {["Premium Quality", "Safety Certified", "Fast Delivery"].map((text) => (
                  <div key={text} className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                    {text}
                  </div>
                ))}
              </div>

              <a href="/contact-us" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold">
                Get in Touch <ArrowRight />
              </a>
            </motion.div>
          </section>

          {/* Stats Strip */}
          <div className="bg-zinc-900 py-8 rounded-3xl mb-20 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                ["200+", "Products"],
                ["500+", "Happy Clients"],
                ["100%", "Satisfaction"],
                ["15+", "Years"]
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="display text-4xl text-gold">{value}</div>
                  <div className="text-sm uppercase tracking-widest text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Values */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <span className="label">OUR FOUNDATION</span>
              <h2 className="display text-4xl mt-3">The Pillars We Stand On</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {companyValues.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glassmorphic rounded-3xl p-8"
                >
                  <div className="text-5xl font-bold text-white/10 mb-6">{item.label}</div>
                  <item.icon size={42} style={{ color: C.gold }} className="mb-6" />
                  <h3 className="display text-2xl mb-4">{item.title}</h3>
                  <p style={{ color: C.slate, lineHeight: 1.7 }}>{item.content}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  )
}