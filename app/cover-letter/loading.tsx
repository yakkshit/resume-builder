"use client"

import { motion } from "framer-motion"
import { Mail, CheckCircle, Clock, Sparkles } from "lucide-react"

export default function CoverLetterLoading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full max-w-md mx-auto p-8">
        {/* Main container with subtle pulse */}
        <motion.div
          className="bg-card border rounded-xl shadow-xl overflow-hidden p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: ["0px 0px 0px rgba(0,0,0,0.2)", "0px 0px 30px rgba(0,0,0,0.2)", "0px 0px 0px rgba(0,0,0,0.2)"],
          }}
          transition={{
            duration: 0.5,
            boxShadow: {
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
            },
          }}
        >
          {/* Cover Letter icon with floating animation */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center text-primary"
            animate={{
              y: [0, -10, 0],
              rotateZ: [0, 5, 0, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Mail size={32} />
          </motion.div>

          <motion.h2
            className="text-2xl font-bold text-center mb-6 text-primary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Preparing Cover Letter
          </motion.h2>

          {/* Progress steps */}
          <div className="space-y-4 mb-8">
            {[
              { icon: <CheckCircle size={18} />, text: "Loading templates", delay: 0.4 },
              { icon: <Sparkles size={18} />, text: "Setting up editor", delay: 0.6 },
              { icon: <Clock size={18} />, text: "Initializing AI assistant", delay: 0.8 },
            ].map((step, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: step.delay }}
              >
                <motion.div
                  className="text-primary"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 1,
                    delay: step.delay,
                  }}
                >
                  {step.icon}
                </motion.div>
                <span className="text-foreground/80">{step.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Loading bar with gradient */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/80 to-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Animated envelope in the background */}
          <motion.div
            className="absolute w-40 h-40 opacity-5 z-0"
            style={{
              top: "50%",
              left: "50%",
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{
              scale: [0.8, 1, 0.8],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M22,4H2A2,2,0,0,0,0,6V18a2,2,0,0,0,2,2H22a2,2,0,0,0,2-2V6A2,2,0,0,0,22,4ZM20,8.236l-8,4.882-8-4.882V6h16ZM2,18V10.264l8,4.882,8-4.882V18Z" />
            </svg>
          </motion.div>

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/30"
              initial={{
                x: Math.random() * 300 - 150,
                y: Math.random() * 300 - 150,
                opacity: 0,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${50 + (Math.random() * 40 - 20)}%`,
                top: `${50 + (Math.random() * 40 - 20)}%`,
              }}
            />
          ))}
        </motion.div>

        {/* Pulsing text at bottom */}
        <motion.p
          className="text-center mt-6 text-muted-foreground text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          Creating your professional cover letter...
        </motion.p>
      </div>
    </div>
  )
}