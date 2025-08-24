"use client"

import { useEffect, useState, useRef } from "react"
import { useInView } from "framer-motion"

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({ end, duration = 2, prefix = "", suffix = "", className = "" }: CountUpProps) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (!isInView) return

    // Reset to 0 when starting animation
    setCount(0)

    // Calculate increment per frame to reach target in specified duration
    // Assuming 60fps, calculate how many frames the animation will take
    const totalFrames = duration * 60
    const incrementPerFrame = end / totalFrames

    let currentCount = 0
    let frameId: number

    const updateCount = () => {
      currentCount += incrementPerFrame

      if (currentCount >= end) {
        setCount(end)
        cancelAnimationFrame(frameId)
        return
      }

      setCount(Math.floor(currentCount))
      frameId = requestAnimationFrame(updateCount)
    }

    frameId = requestAnimationFrame(updateCount)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [isInView, end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  )
}