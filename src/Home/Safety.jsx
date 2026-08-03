import { motion } from "framer-motion"
import { Shield, AlertTriangle, CheckCircle, XCircle, Flame, Droplets, Eye, Users, Heart, MapPin, Phone, Mail, ArrowRight } from "lucide-react"
import Navbar from "../Component/Navbar"

const C = {
  void:       "#030712", 
  glass:      "rgba(15, 23, 42, 0.45)",
  glassL:     "rgba(30, 41, 59, 0.65)",
  gold:       "#f59e0b", 
  goldL:      "#fef08a",
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
    body { background: #030712; color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; }
    
    .display { font-family: 'Syne', sans-serif; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; }
    .serif { font-family: 'Lora', serif; }
    .label { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase; color: #f59e0b; }
    
    .glassmorphic {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .btn-primary { 
      display: inline-flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg, #f59e0b, #d97706); color: #030712;
      font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; 
      font-size: 15px; padding: 14px 32px; border-radius: 12px; 
      border: none; cursor: pointer; transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
    }
    .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(245,158,11,0.4); }
  `}</style>
)

const dosData = [
  { icon: CheckCircle, num: "01", title: "Follow Instructions", description: "Always read and follow the instructions printed on each firework package carefully before use." },
  { icon: Shield, num: "02", title: "Buy Authorised Products", description: "Purchase fireworks only from licensed and reputable manufacturers like Sri Palaniyappa Crackers." },
  { icon: Eye, num: "03", title: "Use Open Spaces Only", description: "Light fireworks only in outdoor areas with ample open space, away from buildings and flammable materials." },
  { icon: Users, num: "04", title: "One Person, Safe Distance", description: "Only one designated adult should light fireworks. Maintain safe distance for others." },
  { icon: Droplets, num: "05", title: "Keep Water Nearby", description: "Always have water buckets or hose within reach for immediate fire suppression." },
  { icon: Heart, num: "06", title: "Supervise Children", description: "Mandatory adult supervision whenever children are near fireworks." },
]

const dontsData = [
  { icon: XCircle, num: "01", title: "No Homemade Fireworks", description: "Never attempt to make or modify fireworks. The risk is extremely high." },
  { icon: Flame, num: "02", title: "Never Relight Duds", description: "If a firework fails, do not relight it. Soak in water after 30 minutes." },
  { icon: AlertTriangle, num: "03", title: "Avoid Loose Clothing", description: "Wear close-fitting cotton clothing. Loose fabric can catch fire instantly." },
  { icon: XCircle, num: "04", title: "Don't Handle Used Ones", description: "Never pick up used fireworks — they may still be active." },
  { icon: Shield, num: "05", title: "No Pockets or Damp Storage", description: "Never carry in pockets or store near heat or moisture." },
  { icon: Eye, num: "06", title: "Never Use Indoors", description: "Fireworks are strictly for outdoor use only." },
]

export default function Safety() {
  return (
    <div className="min-h-screen cosmic-mesh overflow-x-hidden" style={{ background: C.void, color: C.ink }}>
      <GlobalStyles />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-16">
            <div className="mx-auto w-20 h-20 rounded-3xl glassmorphic flex items-center justify-center mb-6">
              <Shield size={48} style={{ color: C.gold }} />
            </div>
            <span className="label">KNOW BEFORE YOU IGNITE</span>
            <h1 className="display text-5xl md:text-6xl mt-4 mb-4">Safety Guidelines</h1>
            <p className="serif text-xl max-w-2xl mx-auto" style={{ color: C.slate }}>
              Your safety is our highest priority. Celebrate responsibly with these essential guidelines.
            </p>
          </div>

          {/* DO'S Section */}
          <section className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-1.5 bg-emerald-500 rounded" />
              <h2 className="display text-4xl">Safety Do's</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dosData.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glassmorphic rounded-3xl p-8 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <item.icon size={28} style={{ color: "#10b981" }} />
                  </div>
                  <div className="text-emerald-400 font-mono text-sm mb-2">STEP {item.num}</div>
                  <h3 className="display text-2xl mb-4">{item.title}</h3>
                  <p style={{ color: C.slate, lineHeight: 1.7 }}>{item.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* DON'TS Section */}
          <section className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-1.5 bg-red-500 rounded" />
              <h2 className="display text-4xl">Safety Don'ts</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dontsData.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glassmorphic rounded-3xl p-8 hover:border-red-500/50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform">
                    <item.icon size={28} style={{ color: "#ef4444" }} />
                  </div>
                  <div className="text-red-400 font-mono text-sm mb-2">STEP {item.num}</div>
                  <h3 className="display text-2xl mb-4">{item.title}</h3>
                  <p style={{ color: C.slate, lineHeight: 1.7 }}>{item.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Emergency Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="glassmorphic rounded-3xl p-12 text-center"
          >
            <AlertTriangle size={56} style={{ color: C.gold, margin: "0 auto 1.5rem" }} />
            <h2 className="display text-4xl mb-6">Emergency Guidelines</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-left bg-black/30 rounded-2xl p-8">
                <h4 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <Flame size={24} /> In Case of Fire
                </h4>
                <ul className="space-y-3 text-slate-300">
                  <li>• Use water or sand to extinguish</li>
                  <li>• Never use bare hands</li>
                  <li>• Call emergency services immediately</li>
                  <li>• Move away from unused fireworks</li>
                </ul>
              </div>

              <div className="text-left bg-black/30 rounded-2xl p-8">
                <h4 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <Heart size={24} /> In Case of Injury
                </h4>
                <ul className="space-y-3 text-slate-300">
                  <li>• Seek immediate medical attention</li>
                  <li>• Cool burns with running water</li>
                  <li>• Do not remove embedded particles</li>
                  <li>• Keep a first aid kit accessible</li>
                </ul>
              </div>
            </div>

            <p className="serif italic mt-10 max-w-lg mx-auto" style={{ color: C.slate }}>
              "Safety is not a guideline — it is a responsibility. Celebrate responsibly."
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}