"use client";

import React, { createContext, useContext, useState } from "react";
import { 
  CheckCircle2, 
  CircleDashed, 
  Clock, 
  ChevronDown, 
  Search, 
  Sparkles,
  LucideIcon,
  Wrench,
  Globe,
  Github,
  Linkedin,
  FileCode2,
  FileText,
  AlertTriangle,
  Loader2,
  BarChart3,
  Database,
  Lock,
  Target,
  Cpu,
} from "lucide-react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChainOfThoughtContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextType | null>(null);

export function useChainOfThought() {
  const ctx = useContext(ChainOfThoughtContext);
  if (!ctx) throw new Error("useChainOfThought must be used within a ChainOfThought");
  return ctx;
}

export interface ChainOfThoughtProps extends React.ComponentProps<"div"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function ChainOfThought({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ...props
}: ChainOfThoughtProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <ChainOfThoughtContext.Provider value={{ open, setOpen: handleOpenChange }}>
      <CollapsiblePrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        className={cn(
          "w-full rounded-xl border border-border/80 bg-muted/20 backdrop-blur-sm overflow-hidden my-2 shadow-xs transition-all duration-200",
          className
        )}
        {...props}
      >
        {children}
      </CollapsiblePrimitive.Root>
    </ChainOfThoughtContext.Provider>
  );
}

export interface ChainOfThoughtHeaderProps
  extends React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger> {
  children?: React.ReactNode;
  isStreaming?: boolean;
  toolCount?: number;
}

export function ChainOfThoughtHeader({
  children = "Chain of Thought",
  isStreaming = false,
  toolCount = 0,
  className,
  ...props
}: ChainOfThoughtHeaderProps) {
  const { open } = useChainOfThought();

  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      className={cn(
        "flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors select-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {isStreaming ? (
          <CircleDashed className="h-3.5 w-3.5 text-sky-400 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        )}
        <span className="font-semibold text-foreground/90">{children}</span>
        {isStreaming && (
          <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 border-sky-500/30 bg-sky-500/10 text-sky-300 font-mono animate-pulse">
            Thinking…
          </Badge>
        )}
        {toolCount > 0 && (
          <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 border-border/60 font-mono">
            {toolCount} {toolCount === 1 ? "tool" : "tools"} used
          </Badge>
        )}
      </div>
      <ChevronDown
        className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </CollapsiblePrimitive.CollapsibleTrigger>
  );
}

export function ChainOfThoughtContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      className={cn(
        "px-4 pb-3.5 pt-1 space-y-2.5 text-xs border-t border-border/40 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
        className
      )}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.CollapsibleContent>
  );
}

export interface ChainOfThoughtStepProps extends React.ComponentProps<"div"> {
  icon?: LucideIcon;
  label: string;
  description?: string;
  status?: "complete" | "active" | "pending" | "error";
}

export function ChainOfThoughtStep({
  icon: CustomIcon,
  label,
  description,
  status = "complete",
  className,
  children,
  ...props
}: ChainOfThoughtStepProps) {
  const StatusIcon = () => {
    if (CustomIcon) return <CustomIcon className="h-3.5 w-3.5 text-primary shrink-0" />;
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      case "active":
        return <CircleDashed className="h-3.5 w-3.5 text-sky-500 animate-spin shrink-0" />;
      case "error":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      case "pending":
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg p-2 transition-colors",
        status === "active" && "bg-sky-500/5 border border-sky-500/20",
        status === "complete" && "bg-background/40",
        status === "error" && "bg-amber-500/5 border border-amber-500/20",
        status === "pending" && "opacity-60",
        className
      )}
      {...props}
    >
      <div className="mt-0.5">
        <StatusIcon />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="font-medium text-foreground leading-tight">{label}</p>
        {description && (
          <p className="text-muted-foreground leading-normal">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export interface ChainOfThoughtToolProps {
  name: string;
  args?: Record<string, any>;
  status?: "active" | "complete" | "error";
  output?: string;
  className?: string;
}

export function ChainOfThoughtTool({
  name,
  args,
  status = "complete",
  output,
  className,
}: ChainOfThoughtToolProps) {
  const getToolIcon = () => {
    switch (name.toLowerCase()) {
      case "search_jobs":
      case "job_scraper":
        return Search;
      case "scrape_job_posting":
      case "web_scraper":
        return Globe;
      case "scrape_github_profile":
      case "github_encrypted_sync":
        return Github;
      case "scrape_linkedin_profile":
        return Linkedin;
      case "chart_generator":
      case "generate_chart":
        return BarChart3;
      case "neo4j_career_graph":
        return Database;
      case "gitlab_encrypted_sync":
        return Lock;
      case "calculate_ats_score":
      case "cv_scorer":
        return Target;
      case "generate_resume_pdf":
      case "generate_cover_letter_pdf":
      case "prepare_job_application_package":
      case "compile_latex":
        return FileText;
      case "list_templates":
        return FileCode2;
      default:
        return Wrench;
    }
  };

  const ToolIcon = getToolIcon();

  const getToolDescription = () => {
    if (!args) return `Executing System/MCP Tool: ${name}`;
    if ((name === "search_jobs" || name === "job_scraper") && args.query) {
      return `Searching jobs for "${args.query}" in ${args.location || "Remote"}`;
    }
    if (name === "scrape_github_profile" && args.username) {
      return `Scraping GitHub repositories & stars for @${args.username}`;
    }
    if (name === "scrape_job_posting" || name === "web_scraper") {
      return args.url ? `Scraping requirements from ${args.url}` : "Parsing job posting requirements";
    }
    if (name === "chart_generator" || name === "generate_chart") {
      return `Generating interactive ${args.type || "analytics"} chart visualization`;
    }
    if (name === "generate_resume_pdf") {
      return `Generating PDF with template: ${args.template || "modern"}`;
    }
    if (name === "calculate_ats_score" || name === "cv_scorer") {
      return "Analyzing ATS score alignment against job requirements";
    }
    if (name === "neo4j_career_graph") {
      return "Querying Neo4j Career Knowledge Graph nodes and relationships";
    }
    return `Arguments: ${JSON.stringify(args)}`;
  };

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2.5 rounded-lg border p-2.5 transition-all",
        status === "active"
          ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
          : status === "error"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
          : "border-border/60 bg-muted/40 text-foreground",
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="mt-0.5 rounded-md p-1 bg-background/50 border border-border/40">
          <ToolIcon className="h-3.5 w-3.5 text-primary shrink-0" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-xs text-foreground font-mono">{name}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1.5 py-0 h-4 uppercase font-bold tracking-wider",
                status === "active" && "border-sky-400/50 bg-sky-400/10 text-sky-300",
                status === "complete" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                status === "error" && "border-amber-400/50 bg-amber-400/10 text-amber-300"
              )}
            >
              {status === "active" ? "Running" : status === "complete" ? "Executed" : "Error"}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate max-w-md">
            {getToolDescription()}
          </p>
          {output && (
            <p className="text-[10px] text-muted-foreground/80 font-mono bg-background/50 p-1 rounded border border-border/40 mt-1 max-h-16 overflow-y-auto">
              {output}
            </p>
          )}
        </div>
      </div>
      {status === "active" && (
        <Loader2 className="h-3.5 w-3.5 text-sky-400 animate-spin shrink-0 mt-1" />
      )}
    </div>
  );
}

export function ChainOfThoughtSearchResults({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5 pt-1", className)}
      {...props}
    >
      <Search className="h-3 w-3 text-muted-foreground mr-0.5" />
      {children}
    </div>
  );
}

export function ChainOfThoughtSearchResult({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[11px] font-normal px-2 py-0.5 bg-muted hover:bg-muted/80 border border-border/60 transition-colors cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}

export interface ChainOfThoughtImageProps extends React.ComponentProps<"div"> {
  src: string;
  alt?: string;
  caption?: string;
}

export function ChainOfThoughtImage({
  src,
  alt = "Thought visual",
  caption,
  className,
  ...props
}: ChainOfThoughtImageProps) {
  return (
    <div className={cn("space-y-1 my-2", className)} {...props}>
      <div className="relative overflow-hidden rounded-lg border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-auto max-h-48 object-cover rounded-lg"
        />
      </div>
      {caption && (
        <p className="text-[10px] text-muted-foreground italic text-center">
          {caption}
        </p>
      )}
    </div>
  );
}
