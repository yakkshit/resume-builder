"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Menu,
  FileText,
  Mail,
  DollarSign,
  Heart,
  MessageSquare,
  Sun,
  Moon,
  X,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Resume", icon: FileText },
  { href: "/cover-letter", label: "Cover Letter", icon: Mail },
  { href: "/price", label: "Pricing", icon: DollarSign },
  { href: "/donate", label: "Donate", icon: Heart },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/api/doc", label: "API Doc", icon: BookOpen, external: true },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 },
}

export function AppNav() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <>
      {/* Dark minimal top bar - inspired by reference */}
      <header className="sticky top-0 z-50 w-full">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-4 mt-4 rounded-full border border-neutral-200/80 bg-neutral-900 shadow-lg shadow-neutral-900/20 dark:border-neutral-700/50 dark:bg-neutral-950"
        >
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-90"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="hidden font-medium text-white sm:inline">
                AI Resume
              </span>
            </Link>

            {/* Center nav - desktop */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  target={href.startsWith("/api/") ? "_blank" : undefined}
                  rel={href.startsWith("/api/") ? "noopener noreferrer" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium text-neutral-300 transition-colors duration-200 hover:text-white",
                    isActive(href) && "text-white"
                  )}
                >
                  {isActive(href) && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </Link>
              ))}
            </nav>

            {/* Right: theme + hamburger */}
            <div className="flex items-center gap-2">
              {mounted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </motion.div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-neutral-400 hover:bg-white/10 hover:text-white md:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Slide-in overlay side menu - dark, immersive */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[61] w-full max-w-sm bg-neutral-900 text-white shadow-2xl dark:bg-neutral-950"
            >
              <div className="flex h-full flex-col p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                    Menu
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <motion.nav
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="mt-12 flex flex-col gap-2"
                >
                  {navItems.map(({ href, label, icon: Icon }) => (
                    <motion.div key={href} variants={item}>
                      <Link
                        href={href}
                        target={href.startsWith("/api/") ? "_blank" : undefined}
                        rel={href.startsWith("/api/") ? "noopener noreferrer" : undefined}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex items-center justify-between rounded-lg px-4 py-4 text-lg font-medium transition-colors",
                          isActive(href)
                            ? "bg-white/10 text-white"
                            : "text-neutral-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-neutral-500 group-hover:text-white" />
                          {label}
                        </span>
                        <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                      </Link>
                    </motion.div>
                  ))}
                </motion.nav>

                <div className="mt-auto pt-8">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
                      Theme
                    </p>
                    {mounted && (
                      <Button
                        variant="outline"
                        className="w-full border-neutral-700 bg-transparent text-white hover:bg-white/10"
                        onClick={() => {
                          setTheme(theme === "dark" ? "light" : "dark")
                        }}
                      >
                        {theme === "dark" ? (
                          <>
                            <Sun className="mr-2 h-4 w-4" />
                            Switch to Light
                          </>
                        ) : (
                          <>
                            <Moon className="mr-2 h-4 w-4" />
                            Switch to Dark
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
