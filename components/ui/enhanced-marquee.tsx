"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import type { GalleryItem } from "@/lib/gallery-data"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, Mail, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EnhancedMarqueeProps {
  items: GalleryItem[]
  speed?: number
  direction?: "left" | "right"
  gap?: number
}

export default function EnhancedMarquee({ items, speed = 25, direction = "left", gap = 20 }: EnhancedMarqueeProps) {
  const [hovering, setHovering] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const [duplicateCount, setDuplicateCount] = useState(2)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null)

  // Calculate how many duplicates we need based on container width
  useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        const width = containerRef.current?.offsetWidth || 0
        setContainerWidth(width)
        // Calculate how many duplicates we need to fill the screen twice
        const itemWidth = 280 + gap // Approximate width of each item + gap
        const itemsNeeded = Math.ceil((width * 2) / itemWidth)
        setDuplicateCount(Math.max(2, itemsNeeded))
      }

      updateWidth()
      window.addEventListener("resize", updateWidth)
      return () => window.removeEventListener("resize", updateWidth)
    }
  }, [gap])

  // Duplicate items to create the infinite effect
  const duplicatedItems = Array(duplicateCount)
    .fill(0)
    .flatMap(() => items)

  // Animation settings
  const duration = containerWidth / speed
  const marqueeVariants = {
    animate: {
      x: direction === "left" ? [0, -containerWidth] : [-containerWidth, 0],
      transition: {
        x: {
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop" as const,
          duration: duration,
          ease: "linear",
        },
      },
    },
    paused: {
      x: direction === "left" ? [-containerWidth / 2, -containerWidth] : [-containerWidth, -containerWidth / 2],
      transition: {
        x: {
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop" as const,
          duration: duration,
          ease: "linear",
        },
      },
    },
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <div
        className="relative w-full overflow-hidden bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 rounded-xl"
        ref={containerRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false)
          setActiveItem(null)
        }}
      >
        {/* Gradient overlays for fade effect */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 z-10"></div>
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900 z-10"></div>
        </div>

        {/* Marquee content */}
        <motion.div
          className="flex"
          variants={marqueeVariants}
          animate={hovering ? "paused" : "animate"}
          style={{ gap }}
        >
          {duplicatedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="relative flex-shrink-0 w-[280px] h-[200px] rounded-xl overflow-hidden group shadow-lg"
              onMouseEnter={() => setActiveItem(item)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 to-gray-900/60 z-0"></div>
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                <Badge
                  variant="outline"
                  className={`mb-2 w-fit ${
                    item.category === "Resume"
                      ? "bg-blue-500/20 text-blue-200 border-blue-500/50"
                      : "bg-green-500/20 text-green-200 border-green-500/50"
                  }`}
                >
                  {item.category === "Resume" ? (
                    <FileText className="w-3 h-3 mr-1" />
                  ) : (
                    <Mail className="w-3 h-3 mr-1" />
                  )}
                  {item.category}
                </Badge>
                <h3 className="text-white font-medium text-lg">{item.name}</h3>
                <p className="text-gray-300 text-sm capitalize">{item.template.replace("-", " ")} template</p>

                {/* <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full bg-white/10 hover:bg-white/20 text-white"
                  asChild
                >
                  <Link href={item.category === "Resume" ? "/" : "/cover-letter"}>
                    <span className="flex items-center justify-center gap-1">
                      View Template <ExternalLink size={12} />
                    </span>
                  </Link>
                </Button> */}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Optional: Show active item details outside the marquee */}
      {activeItem && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm z-20 transition-all duration-300 opacity-90 hover:opacity-100">
          <div className="flex items-center justify-between">
            <div>
              <Badge
                variant="outline"
                className={`mb-1 ${
                  activeItem.category === "Resume"
                    ? "bg-blue-500/20 text-blue-200 border-blue-500/50"
                    : "bg-green-500/20 text-green-200 border-green-500/50"
                }`}
              >
                {activeItem.category}
              </Badge>
              <h3 className="text-lg font-bold">{activeItem.name}</h3>
              <p className="text-sm text-gray-300 capitalize">{activeItem.template.replace("-", " ")} template</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href={activeItem.category === "Resume" ? "/" : "/cover-letter"}>Use Template</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}