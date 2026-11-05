"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-provider";
import { ArrowUpRight, LogOut, Settings, Sparkles, User as UserIcon } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/price" },
  { label: "Labs", href: "/labs" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = Boolean(
    mounted && user?.isAuthenticated && !user?.isIncognito && (user?.email || user?.name !== "Guest")
  );

  const displayName = user?.name && user.name !== "Guest" ? user.name : "User";
  const displayEmail = user?.email && !user.email.endsWith("@user.local") ? user.email : "";
  const initial = displayName.charAt(0).toUpperCase() || "U";

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      if (typeof window !== "undefined" && window.location.pathname === "/") {
        e.preventDefault();
        const targetId = href.replace("#", "");
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
        }
      } else if (typeof window !== "undefined") {
        e.preventDefault();
        window.location.href = `/${href}`;
      }
      setMobileMenuOpen(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* ── LEFT: BRAND ──────────────────────────────────────── */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          aria-label="CareerAgent Home"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#aff33e] opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#aff33e]" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
            CareerAgent
          </span>
          <span className="text-[10px] font-mono text-zinc-500 border border-white/10 px-1.5 py-0.5 rounded">
            v2.0
          </span>
        </Link>

        {/* ── CENTER: DESKTOP NAV LINKS ───────────────────────── */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main Navigation"
        >
          {NAV_LINKS.map((link, idx) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative px-3.5 py-1.5 text-xs font-normal text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="relative z-10">{link.label}</span>
              {hoveredIndex === idx && (
                <motion.span
                  layoutId="navbar-hover-indicator"
                  className="absolute inset-x-2 bottom-0 h-[1.5px] bg-white/70 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                />
              )}
            </a>
          ))}
        </nav>

        {/* ── RIGHT: ACTIONS ──────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <Link
                href="/chat"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 text-zinc-300 hover:text-white hover:border-white/25 transition-all"
              >
                <span>Studio</span>
                <ArrowUpRight className="size-3 text-zinc-400" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center focus:outline-none rounded-full ring-1 ring-white/10 hover:ring-white/30 transition-all p-0.5"
                    aria-label="User profile menu"
                  >
                    <Avatar className="size-7">
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="bg-zinc-800 text-zinc-200 text-[11px] font-medium">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-zinc-950/95 border border-white/10 backdrop-blur-xl text-zinc-200 p-1.5 shadow-2xl rounded-xl"
                >
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-xs font-medium text-white truncate">
                        {displayName}
                      </p>
                      {displayEmail ? (
                        <p className="text-[10px] text-zinc-400 font-mono truncate">
                          {displayEmail}
                        </p>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/chat"
                      className="cursor-pointer text-xs flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 focus:bg-white/10 text-zinc-300 hover:text-white"
                    >
                      <Sparkles className="size-3.5 text-[#aff33e]" />
                      <span>Open Studio</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="cursor-pointer text-xs flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/10 focus:bg-white/10 text-zinc-300 hover:text-white"
                    >
                      <Settings className="size-3.5 text-zinc-400" />
                      <span>Settings &amp; Vault</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="cursor-pointer text-xs flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-red-500/10 focus:bg-red-500/10 text-red-400 hover:text-red-300"
                  >
                    <LogOut className="size-3.5" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-xs font-normal text-zinc-400 hover:text-white transition-colors px-1 py-1"
              >
                Log In
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center h-8 px-4 text-xs font-medium rounded-full bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-none"
              >
                Get Started Free
              </Link>
            </div>
          )}

          {/* ── MOBILE HAMBURGER TOGGLE ──────────────────────── */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden relative size-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white focus:outline-none"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            <div className="w-4 h-3 flex flex-col justify-between">
              <span
                className={`h-0.5 w-full bg-current rounded-full transition-transform duration-200 ${
                  mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`h-0.5 w-full bg-current rounded-full transition-opacity duration-200 ${
                  mobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-full bg-current rounded-full transition-transform duration-200 ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-1" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* ── MOBILE ACCORDION / FULL-SCREEN OVERLAY ───────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-white/10 bg-black/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col space-y-4">
              <nav className="flex flex-col space-y-3" aria-label="Mobile Navigation">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleScrollTo(e, link.href)}
                    className="text-base text-zinc-300 hover:text-white py-1 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                {!isAuthenticated && (
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base text-zinc-400 hover:text-white py-1 transition-colors"
                  >
                    Log In
                  </Link>
                )}
                {isAuthenticated && (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base text-zinc-400 hover:text-white py-1 transition-colors flex items-center justify-between"
                    >
                      <span>Settings &amp; Vault</span>
                      <Settings className="size-4 text-zinc-500" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-base text-left text-red-400 hover:text-red-300 py-1 transition-colors flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <LogOut className="size-4" />
                    </button>
                  </>
                )}
              </nav>

              <div className="pt-4 border-t border-white/10">
                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center h-10 px-4 text-sm font-medium rounded-full bg-white text-black hover:bg-zinc-200 transition-all"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

