"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Resume", icon: FileText },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/cover-letter", label: "Cover Letter", icon: Mail },
  { href: "/price", label: "Pricing", icon: DollarSign },
  { href: "/donate", label: "Donate", icon: Heart },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/api/doc", label: "API Doc", icon: BookOpen, external: true },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 },
};

/** Full-width top bar (ChatGPT-style): flat, high contrast, no floating pill. */
export function AppNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-[100] w-full border-b border-neutral-200/90 bg-white/95 backdrop-blur-md dark:border-neutral-800 dark:bg-[#171717]/95">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-4">
          {/* Brand — ChatGPT-style wordmark area */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 transition-opacity hover:opacity-90"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="hidden truncate text-[15px] font-semibold tracking-tight text-neutral-900 sm:inline dark:text-white">
                AI Resume
              </span>
              <ChevronDown className="hidden h-4 w-4 shrink-0 text-neutral-500 sm:block" aria-hidden />
            </Link>

            {/* Desktop nav — compact, center-weighted */}
            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  target={href.startsWith("/api/") ? "_blank" : undefined}
                  rel={href.startsWith("/api/") ? "noopener noreferrer" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white",
                    isActive(href) &&
                      "bg-neutral-100 text-neutral-900 dark:bg-white/10 dark:text-white"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden h-9 rounded-full border-violet-200 bg-gradient-to-r from-violet-500/10 to-sky-500/10 px-4 text-xs font-medium text-neutral-800 hover:opacity-90 dark:border-violet-500/30 dark:from-violet-500/15 dark:to-sky-500/15 dark:text-neutral-100 sm:inline-flex"
            >
              <Link href="/price">Upgrade</Link>
            </Button>

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-neutral-600 hover:bg-neutral-100 lg:hidden dark:text-neutral-300 dark:hover:bg-white/10"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-[111] flex w-full max-w-sm flex-col bg-[#171717] text-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                  Menu
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
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
                className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
              >
                {navItems.map(({ href, label, icon: Icon }) => (
                  <motion.div key={href} variants={item}>
                    <Link
                      href={href}
                      target={href.startsWith("/api/") ? "_blank" : undefined}
                      rel={href.startsWith("/api/") ? "noopener noreferrer" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-3.5 text-[15px] font-medium transition-colors",
                        isActive(href)
                          ? "bg-white/10 text-white"
                          : "text-neutral-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5 opacity-70" />
                        {label}
                      </span>
                      <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </motion.div>
                ))}
              </motion.nav>

              <div className="border-t border-white/10 p-4">
                {mounted && (
                  <Button
                    variant="outline"
                    className="w-full border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                    }}
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark mode
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
