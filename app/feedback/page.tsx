"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Github,
  Bug,
  Sparkles,
  HelpCircle,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Send,
  Terminal,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GridPattern } from "@/components/ui/grid-pattern";

type IssueCategory = "bug" | "feature" | "mcp" | "general";

const CATEGORIES: { id: IssueCategory; label: string; icon: typeof Bug; gitHubLabel: string }[] = [
  { id: "bug", label: "Bug Report", icon: Bug, gitHubLabel: "bug" },
  { id: "feature", label: "Feature Request", icon: Sparkles, gitHubLabel: "enhancement" },
  { id: "mcp", label: "MCP & Tools", icon: Terminal, gitHubLabel: "mcp" },
  { id: "general", label: "General Feedback", icon: MessageSquare, gitHubLabel: "feedback" },
];

const GITHUB_REPO_URL = "https://github.com/yakkshit/resume-builder";

export default function FeedbackPage() {
  const [category, setCategory] = useState<IssueCategory>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directSubmitSuccess, setDirectSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generate GitHub issue URL
  const generateGitHubIssueUrl = () => {
    const selectedCat = CATEGORIES.find((c) => c.id === category);
    const issueTitle = title.trim() || `[${selectedCat?.label || "Feedback"}]: New submission`;
    
    const bodyLines = [
      `### Issue Type`,
      `**${selectedCat?.label}**`,
      ``,
      `### Description`,
      description.trim() || "No detailed description provided.",
      ``,
      `### Environment / Client Details`,
      environment.trim() || "Web Browser / CareerAgent v2.0",
      ``,
      `### Contact / Author (Optional)`,
      email.trim() || "Anonymous Community User",
      ``,
      `---`,
      `*Submitted via CareerAgent Feedback Portal (` + new Date().toISOString() + `)*`,
    ];

    const bodyEncoded = encodeURIComponent(bodyLines.join("\n"));
    const titleEncoded = encodeURIComponent(issueTitle);
    const labelParam = selectedCat?.gitHubLabel ? `&labels=${encodeURIComponent(selectedCat.gitHubLabel)}` : "";

    return `${GITHUB_REPO_URL}/issues/new?title=${titleEncoded}&body=${bodyEncoded}${labelParam}`;
  };

  const handleOpenGitHub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !description.trim()) {
      setSubmitError("Please provide a title or description before creating an issue.");
      return;
    }
    setSubmitError(null);
    const url = generateGitHubIssueUrl();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmitError("Please write your message or feedback.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message: description,
          type: category,
          service: category === "mcp" ? "ai" : "cv",
          email: email || "anonymous@community.local",
          name: email ? email.split("@")[0] : "Community User",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to submit directly. You can create an issue on GitHub directly.");
      }

      setDirectSubmitSuccess(true);
      setTitle("");
      setDescription("");
      setEnvironment("");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit. Please use the GitHub issue button instead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-white/20 selection:text-white">
      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <Navbar />

      <main className="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)]">
          <GridPattern
            width={48}
            height={48}
            strokeDasharray="4 4"
            className="opacity-10 stroke-white/[0.08]"
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1 text-xs text-zinc-400 backdrop-blur-md mb-4">
              <span className="size-1.5 rounded-full bg-[#aff33e]" />
              <span className="text-zinc-300 font-mono text-[11px]">
                Open Source &bull; Public Issue Tracker
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Feedback &amp; Issue Reporter
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Found a bug, want a new MCP tool, or have ideas to improve CareerAgent? Create an issue directly in our open-source GitHub repository or send direct feedback.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            {directSubmitSuccess && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold">Feedback submitted successfully!</p>
                  <p className="text-[11px] text-emerald-400/80">Thank you for helping us improve CareerAgent and CedzLabs tools.</p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-3">
                <AlertCircle className="size-5 shrink-0 text-red-400" />
                <p>{submitError}</p>
              </div>
            )}

            <form className="space-y-6">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2 font-mono uppercase tracking-wider">
                  Issue Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const isSelected = category === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? "border-[#aff33e] bg-[#aff33e]/10 text-white"
                            : "border-white/10 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <Icon className={`size-3.5 ${isSelected ? "text-[#aff33e]" : "text-zinc-500"}`} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Title / Short Summary
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., [Feature] Support PDF LaTeX compile preview in live editor"
                  className="bg-zinc-900/60 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 text-xs h-10 rounded-xl"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Description &amp; Reproduction Details
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe what you observed, what you expected, or the feature you'd love to see..."
                  className="bg-zinc-900/60 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 text-xs rounded-xl"
                />
              </div>

              {/* Environment / Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">
                    Environment (Optional)
                  </label>
                  <Input
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    placeholder="e.g. macOS Safari, Cursor MCP, Claude Desktop"
                    className="bg-zinc-900/60 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 text-xs h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-2">
                    Your Email (Optional)
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. dev@example.com"
                    className="bg-zinc-900/60 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30 text-xs h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Dual Submission CTAs */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="button"
                  onClick={handleOpenGitHub}
                  className="w-full sm:flex-1 h-10 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-semibold shadow-none flex items-center justify-center gap-2"
                >
                  <Github className="size-4" />
                  <span>Create Issue on GitHub</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>

                <Button
                  type="button"
                  onClick={handleDirectSubmit}
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full sm:w-auto h-10 rounded-full border-white/15 bg-transparent text-zinc-300 hover:text-white text-xs font-medium px-5 flex items-center justify-center gap-2"
                >
                  <Send className="size-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Submit Anonymously"}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Direct Repository Link Bar */}
          <div className="mt-8 text-center text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`${GITHUB_REPO_URL}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline flex items-center gap-1 font-mono text-[11px]"
            >
              <span>View all open GitHub issues</span>
              <ArrowUpRight className="size-3" />
            </a>
            <span>&bull;</span>
            <a
              href="https://github.com/yakkshit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline flex items-center gap-1 font-mono text-[11px]"
            >
              <span>Maintainer GitHub (yakkshit)</span>
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-black py-12 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#aff33e]" />
            <span className="text-white font-medium">CareerAgent</span>
            <span className="font-mono text-[10px]">Feedback &amp; Issues</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] text-zinc-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/price" className="hover:text-white">Pricing</Link>
            <Link href="/labs" className="hover:text-white">Labs</Link>
            <Link href="/api/doc" className="hover:text-white">API Docs</Link>
          </div>
          <div className="font-mono text-[11px] text-zinc-600">
            &copy; {new Date().getFullYear()} CedzLabs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
