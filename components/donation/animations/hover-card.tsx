"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface HoverCardProps {
  children: ReactNode
  className?: string
}

export function HoverCard({ children, className = "" }: HoverCardProps) {
  return (
    <motion.div
      className={className}
      whileHover={{
        scale: 1.03,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.3 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}