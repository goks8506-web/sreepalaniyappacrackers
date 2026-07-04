import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CheckCircle } from "lucide-react"

const RocketLoader = ({ onComplete }) => {
  const [stage, setStage] = useState("flying") // 'flying', 'burst', 'success'

  useEffect(() => {
    const timer1 = setTimeout(() => setStage("burst"), 1800)
    const timer2 = setTimeout(() => setStage("success"), 2300)
    const timer3 = setTimeout(() => {
      if (onComplete) onComplete()
    }, 4800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Rocket Line Animation */}
        <AnimatePresence>
          {stage === "flying" && (
            <motion.div
              initial={{ y: 300, x: -200, rotate: 45 }}
              animate={{ y: 0, x: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="relative"
            >
              <motion.div
                animate={{
                  scaleY: [1, 1.1, 1],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{ duration: 0.15, repeat: 12 }}
                className="relative"
              >
                <div className="w-1 h-16 bg-gradient-to-t from-gray-400 via-gray-300 to-gray-200 rounded-full relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-red-500"></div>
                  <div className="absolute -bottom-1 -left-1 w-0 h-0 border-t-3 border-r-2 border-t-orange-500 border-r-transparent"></div>
                  <div className="absolute -bottom-1 -right-1 w-0 h-0 border-t-3 border-l-2 border-t-orange-500 border-l-transparent"></div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.7, 1, 0] }}
                transition={{ duration: 0.2, repeat: 9 }}
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2"
              >
                <div className="w-3 h-12 bg-gradient-to-t from-orange-600 via-yellow-400 to-red-500 rounded-full opacity-80"></div>
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-gradient-to-t from-yellow-300 to-white rounded-full"></div>
              </motion.div>

              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    scale: [0, 1, 1.5],
                    y: [0, -20 - i * 5],
                    x: [0, (i % 2 === 0 ? -1 : 1) * (5 + i)],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: 2,
                    delay: i * 0.1,
                  }}
                  className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Burst Effect */}
        <AnimatePresence>
          {stage === "burst" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-[110]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 3, 2] }}
                transition={{ duration: 0.6 }}
                className="w-24 h-24 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 rounded-full relative z-[110] shadow-2xl"
              />

              {Array.from({ length: 16 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    scale: 0,
                    x: 0,
                    y: 0,
                    rotate: 0,
                  }}
                  animate={{
                    scale: [0, 2, 0],
                    x: Math.cos((i * 22.5 * Math.PI) / 180) * 150,
                    y: Math.sin((i * 22.5 * Math.PI) / 180) * 150,
                    rotate: 360,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.1 + i * 0.03,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[110]"
                >
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                </motion.div>
              ))}

              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={`medium-${i}`}
                  initial={{
                    scale: 0,
                    x: 0,
                    y: 0,
                    rotate: 0,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * 30 * Math.PI) / 180) * 200,
                    y: Math.sin((i * 30 * Math.PI) / 180) * 200,
                    rotate: -360,
                  }}
                  transition={{
                    duration: 1.2,
                    delay: 0.2 + i * 0.04,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[110]"
                >
                  <Sparkles className="w-6 h-6 text-orange-300" />
                </motion.div>
              ))}

              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  initial={{
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 1,
                  }}
                  animate={{
                    scale: [0, 2, 0],
                    x: Math.cos((i * 18 * Math.PI) / 180) * (180 + Math.random() * 100),
                    y: Math.sin((i * 18 * Math.PI) / 180) * (180 + Math.random() * 100),
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.4,
                    delay: 0.15 + i * 0.02,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[110]"
                >
                  <div className="w-4 h-4 bg-gradient-to-br from-yellow-200 to-orange-400 rounded-full shadow-lg"></div>
                </motion.div>
              ))}

              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 8, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-4 border-yellow-300 rounded-full z-[110]"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 12, opacity: 0 }}
                transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-orange-300 rounded-full z-[110]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Success Message */}
        <AnimatePresence>
          {stage === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.6,
              }}
              className="text-center z-[110]"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                }}
                className="w-32 h-32 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
                >
                  <CheckCircle className="w-16 h-16 text-white" />
                </motion.div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-5xl font-bold text-white mb-6 tracking-wide"
              >
                BOOKED!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="text-white/90 text-xl mb-6"
              >
                Your order has been successfully placed
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="flex items-center justify-center gap-3 text-yellow-300 text-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                <span className="font-semibold">Thank you for choosing MN Crackers!</span>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default RocketLoader