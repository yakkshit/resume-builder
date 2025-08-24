"use client"

import { motion } from "framer-motion"
import { MessageSquare, CheckCircle, Clock, Sparkles } from "lucide-react"

export default function FeedbackLoading() {
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
          {/* Feedback icon with bounce */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center text-primary"
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <MessageSquare size={32} />
          </motion.div>

          <motion.h2
            className="text-2xl font-bold text-center mb-6 text-primary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Loading Feedback Form
          </motion.h2>

          {/* Progress steps */}
          <div className="space-y-4 mb-8">
            {[
              { icon: <CheckCircle size={18} />, text: "Preparing form", delay: 0.4 },
              { icon: <Sparkles size={18} />, text: "Loading components", delay: 0.6 },
              { icon: <Clock size={18} />, text: "Almost ready", delay: 0.8 },
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

          {/* Loading bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>

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
          Just a moment...
        </motion.p>
      </div>
    </div>
  )
}