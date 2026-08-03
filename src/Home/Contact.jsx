import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../Component/Navbar"
import { MapPin, Phone, Mail, Clock, Sparkles } from "lucide-react"
import { API_BASE_URL } from '../../Config'

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

export default function Contact() {
  const [showSuccess, setShowSuccess] = useState(false)

  const contactCards = [
    { icon: MapPin, title: "Our Shop Location", content: ["Vaanakkar Street, Salem", "Tamil Nadu"], color: C.gold },
    { icon: Phone, title: "Call Us", content: [{ text: "+91 81242 59430", href: "tel:+918124259430" }], color: C.gold },
    { icon: Mail, title: "Email Us", content: [{ text: "sreepalaniyappacrackers@gmail.com", href: "mailto:sreepalaniyappacrackers@gmail.com" }], color: C.gold },
  ]

  return (
    <>
      <GlobalStyles />
      <div className="min-h-screen cosmic-mesh" style={{ background: C.void, color: C.ink }}>
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-16">
              <div className="mx-auto w-20 h-20 glassmorphic rounded-3xl flex items-center justify-center mb-6">
                <Sparkles size={48} style={{ color: C.gold }} />
              </div>
              <span className="label">GET IN TOUCH</span>
              <h1 className="display text-5xl md:text-6xl mt-4 mb-4">Contact Us</h1>
              <p className="serif text-xl max-w-2xl mx-auto" style={{ color: C.slate }}>
                Ready to light up your celebrations? Reach out to Sri Palaniyappa Crackers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-20">
              {contactCards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glassmorphic rounded-3xl p-8 text-center hover:border-[#f59e0b]/50 transition-all"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6">
                    <card.icon size={32} className="text-white" />
                  </div>
                  <h3 className="display text-2xl mb-4">{card.title}</h3>
                  <div className="space-y-3 text-slate-300">
                    {card.content.map((item, idx) => (
                      typeof item === "string" ? <p key={idx}>{item}</p> : (
                        <a key={idx} href={item.href} className="block text-gold hover:text-amber-300 transition-colors">
                          {item.text}
                        </a>
                      )
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div className="max-w-2xl mx-auto glassmorphic rounded-3xl p-10">
              <h2 className="display text-3xl text-center mb-8">Wholesale Enquiry</h2>
              <form onSubmit={(e) => { e.preventDefault(); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 4000); }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input type="text" name="name" placeholder="Your Name" required className="bg-black/40 border border-white/10 rounded-2xl p-4 focus:border-gold" />
                  <input type="email" name="email" placeholder="Email" required className="bg-black/40 border border-white/10 rounded-2xl p-4 focus:border-gold" />
                </div>
                <input type="tel" name="mobile" placeholder="Mobile Number" required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:border-gold" />
                <textarea name="message" rows="5" placeholder="Your Message / Requirements" required className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:border-gold" />
                <button type="submit" className="btn-primary w-full py-4 text-lg">Submit Enquiry</button>
              </form>
            </motion.div>
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div initial={{scale:0.8}} animate={{scale:1}} className="glassmorphic p-12 rounded-3xl text-center">
              <h2 className="display text-3xl mb-3 text-gold">Enquiry Sent!</h2>
              <p style={{color: C.slate}}>We'll get back to you shortly.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}