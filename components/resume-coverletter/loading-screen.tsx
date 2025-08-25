"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  minLoadingTime?: number // in milliseconds
  children: React.ReactNode
}

export default function LoadingScreen({
  minLoadingTime = 5000, // Default to 5 seconds
  children,
}: LoadingScreenProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Set a minimum loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, minLoadingTime)

    return () => clearTimeout(timer)
  }, [minLoadingTime])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background to-muted flex flex-col items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{
              rotate: 360,
              transition: {
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              },
            }}
            className="inline-block mb-6"
          >
            <Loader2 size={48} className="text-primary" />
          </motion.div>

          <motion.h1
            className="text-3xl font-bold mb-2 text-primary"
            animate={{
              opacity: [0.5, 1, 0.5],
              transition: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              },
            }}
          >
            AI Resume Builder
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: minLoadingTime / 1000, ease: "linear" }}
            className="h-1 bg-primary rounded-full mt-6 max-w-xs mx-auto"
          />

          <p className="text-muted-foreground mt-4 max-w-md">Loading your professional resume builder experience...</p>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}