"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Bot, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Download, 
  CheckCircle2, 
  Terminal, 
  Github, 
  Database, 
  Layers, 
  Cpu, 
  Flame, 
  Globe, 
  Star,
  ChevronRight,
  Code2,
  Lock,
  Search,
  Eye,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const AVAILABLE_TEMPLATES = [
  "modern",
  "classic",
  "minimal",
  "professional",
  "elegant",
  "dark",
  "gradient",
  "two-column",
  "german-cv",
  "multicolour",
];

export default function HomePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");
  const templateKeys = AVAILABLE_TEMPLATES;

  const features = [
    {
      icon: Bot,
      title: "Multi-Model AI Engine",
      description: "Chat with Gemini 2.5/3, GPT-4o, Claude 3.5 Sonnet, or local Ollama instances tailored for career development.",
      badge: "AI SDK v5",
      color: "from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30",
    },
    {
      icon: Terminal,
      title: "Model Context Protocol (MCP)",
      description: "Connect external tools, live job scrapers, and agents via standardized JSON-RPC 2.0 MCP server integrations.",
      badge: "MCP Ready",
      color: "from-purple-500/20 to-pink-500/20 text-pink-400 border-pink-500/30",
    },
    {
      icon: FileText,
      title: "Crash-Proof ATS Resume Engine",
      description: "Strict Zod schema contracts guarantee 100% type-safe parsing and pristine vector PDF exports without missing field crashes.",
      badge: "Zod Validated",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      icon: Github,
      title: "Free GitHub Zero-Knowledge Sync",
      description: "Commit your chats, resumes, and cover letters directly to your own private GitHub repository for unlimited free cloud storage.",
      badge: "Zero Lock-In",
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    },
    {
      icon: Database,
      title: "PostgreSQL & Xata Edge Layer",
      description: "High-performance database storage for user profiles, encrypted API keys, and anonymized telemetry for continuous model optimization.",
      badge: "PostgreSQL",
      color: "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30",
    },
    {
      icon: Globe,
      title: "Client-Side Multilingual Engine",
      description: "Translate resumes into German, French, Spanish, and more in real-time using Mozilla Bergamot WebAssembly with zero API costs.",
      badge: "Wasm Fast",
      color: "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-cyan-500 text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-base leading-none">CareerAgent</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5">AI Career OS</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/chat" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Bot className="h-4 w-4 text-primary" />
              <span>AI Chat Assistant</span>
            </Link>
            <Link href="/cover-letter" className="hover:text-foreground transition-colors flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Cover Letter</span>
            </Link>
            <Link href="/price" className="hover:text-foreground transition-colors">
              <span>Pricing</span>
            </Link>
            <Link href="/feedback" className="hover:text-foreground transition-colors">
              <span>Feedback</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <UserMenu />
            <ThemeToggle />
            <Button asChild size="sm" className="hidden sm:flex h-9 px-4 font-semibold shadow-lg shadow-primary/25">
              <Link href="/chat">
                <span>Launch App</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-md mb-6 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
            <span>CareerAgent 2.0 • Multi-Model AI & Zero-Knowledge Storage</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-70" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl max-w-4xl mx-auto leading-[1.1]"
          >
            Your AI Career Operating System.{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Built to Get You Hired.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Generate ATS-tailored resumes, discover real-time jobs, draft cover letters, and chat with AI models like Gemini 2.5, GPT-4o, and Claude 3.5. Powered by PostgreSQL and free private GitHub sync.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="h-12 px-7 text-base font-bold shadow-xl shadow-primary/30">
              <Link href="/chat">
                <Bot className="h-5 w-5 mr-2" />
                <span>Start AI Chat Assistant</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base font-semibold border-border/80 bg-background/50 hover:bg-muted/50 backdrop-blur-md">
              <Link href="/cover-letter">
                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>Cover Letter Studio</span>
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>100% Free & Open-Source Friendly</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Zero-Knowledge GitHub Backup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Crash-Proof Zod Validation</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Feature Grid */}
      <section className="py-16 md:py-24 border-t border-border/40 bg-muted/20 relative">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="px-3 py-1 mb-3 text-xs border-primary/30 text-primary">
              Full Spectrum AI Suite
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Engineered with Modern Architecture
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Explore the tools and integrations built directly into your career operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="group relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-md hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <CardHeader className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${f.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-[11px] font-mono">
                        {f.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                      {f.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Template Preview Gallery */}
      <section className="py-16 md:py-24 border-t border-border/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <Badge variant="outline" className="px-3 py-1 mb-3 text-xs border-primary/30 text-primary">
                ATS Tested Templates
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">Professional Resume Designs</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                All templates render vector text with zero blur, optimized for applicant tracking systems.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start md:self-auto gap-2">
              <Link href="/chat">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Customize in AI Chat</span>
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {templateKeys.map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() => setSelectedTemplate(tpl)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  selectedTemplate === tpl
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/10 text-primary font-semibold"
                    : "border-border/60 bg-muted/30 hover:bg-muted/60 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FileText className={`h-4 w-4 ${selectedTemplate === tpl ? "text-primary" : "text-muted-foreground"}`} />
                  {selectedTemplate === tpl && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="text-xs capitalize truncate font-medium">
                  {tpl.replace("-", " ")}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-2xl border border-border/80 bg-muted/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="font-bold text-sm">Selected Style: <span className="text-primary capitalize">{selectedTemplate.replace("-", " ")}</span></h3>
              <p className="text-xs text-muted-foreground">Ready to export to high-resolution vector PDF, LaTeX, or print directly.</p>
            </div>
            <Button asChild size="sm" className="font-semibold shadow-md">
              <Link href="/chat">
                <span>Create Resume with {selectedTemplate.replace("-", " ")}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-12 text-xs text-muted-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-[10px]">
              CA
            </div>
            <span className="font-semibold text-foreground">CareerAgent</span>
            <span>— Free & Open Career Operating System</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/chat" className="hover:text-foreground transition-colors">Chat Assistant</Link>
            <Link href="/cover-letter" className="hover:text-foreground transition-colors">Cover Letter</Link>
            <Link href="/price" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/feedback" className="hover:text-foreground transition-colors">Feedback</Link>
            <Link href="/api/openapi" className="hover:text-foreground transition-colors">API Docs</Link>
          </div>

          <div>
            © {new Date().getFullYear()} CareerAgent. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}