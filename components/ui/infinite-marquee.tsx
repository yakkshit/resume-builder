"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { GalleryItem } from "@/lib/gallery-data";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileText, Mail } from "lucide-react";

interface InfiniteMarqueeProps {
  items: GalleryItem[];
  speed?: number;
  direction?: "left" | "right";
  gap?: number;
}

export default function InfiniteMarquee({
  items,
  speed = 25,
  direction = "left",
  gap = 16,
}: InfiniteMarqueeProps) {
  const [hovering, setHovering] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate how many duplicates we need based on container width
  useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        const width = containerRef.current?.offsetWidth || 0;
        setContainerWidth(width);
        const itemWidth = 280 + gap; // Approximate width of each item + gap
        const itemsNeeded = Math.ceil((width * 2) / itemWidth);
        if (itemsNeeded !== duplicateCount) {
          // Only update duplicateCount if it's different
          setDuplicateCount(Math.max(2, itemsNeeded));
        }
      };

      updateWidth(); // Initial calculation on mount
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
  }, [gap, duplicateCount]); // Only re-run the effect when gap or duplicateCount changes

  // Duplicate items to create the infinite effect
  const duplicatedItems = Array(duplicateCount)
    .fill(0)
    .flatMap(() => items);

  // Animation settings
  const duration = containerWidth && speed ? containerWidth / speed : 0;
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
      x:
        direction === "left"
          ? [-containerWidth / 2, -containerWidth]
          : [-containerWidth, -containerWidth / 2],
      transition: {
        x: {
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop" as const,
          duration: duration,
          ease: "linear",
        },
      },
    },
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 z-10"></div>
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-gray-100 to-transparent dark:from-gray-800 z-10"></div>
      </div>

      <motion.div
        className="flex"
        variants={marqueeVariants}
        animate={hovering ? "paused" : "animate"}
        style={{ gap }}
      >
        {duplicatedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="relative flex-shrink-0 w-[280px] h-[200px] rounded-lg overflow-hidden group"
          >
            <Link
              href={item.category === item.url || "Resume" ? "/" : "/cover-letter"}
              className="block w-full h-full"
            >
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
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
                <h3 className="text-white font-medium">{item.name}</h3>
                <p className="text-gray-300 text-sm">
                  {item.template} template
                </p>
              </div>
            </Link>
          </div>
        ))}
      </motion.div>
    </div>
  );
}