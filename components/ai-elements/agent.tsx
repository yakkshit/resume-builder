"use client";

import React, { type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Bot, Wrench, Code2, FileText, ChevronRight } from "lucide-react";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";

const streamdownPlugins = { cjk, code, math, mermaid };

export interface AgentProps extends ComponentProps<"div"> {
  children?: ReactNode;
}

export function Agent({ className, children, ...props }: AgentProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 p-4 text-foreground shadow-lg backdrop-blur-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AgentHeaderProps extends ComponentProps<"div"> {
  name: string;
  model?: string;
  description?: string;
}

export function AgentHeader({
  name,
  model,
  description,
  className,
  ...props
}: AgentHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">{name}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {model && (
        <Badge
          variant="outline"
          className="border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[11px] text-indigo-200"
        >
          {model}
        </Badge>
      )}
    </div>
  );
}

export interface AgentContentProps extends ComponentProps<"div"> {
  children?: ReactNode;
}

export function AgentContent({ className, children, ...props }: AgentContentProps) {
  return (
    <div className={cn("mt-3.5 space-y-4", className)} {...props}>
      {children}
    </div>
  );
}

export interface AgentInstructionsProps extends ComponentProps<"div"> {
  children: string;
}

export function AgentInstructions({
  children,
  className,
  ...props
}: AgentInstructionsProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-neutral-300",
        className
      )}
      {...props}
    >
      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-neutral-200">
        <FileText className="h-3.5 w-3.5 text-indigo-400" />
        <span>Instructions</span>
      </div>
      <div className="prose prose-invert max-w-none text-xs text-neutral-300">
        <Streamdown plugins={streamdownPlugins}>{children}</Streamdown>
      </div>
    </div>
  );
}

export type AgentToolsProps = ComponentProps<"div"> & {
  children?: ReactNode;
};

export function AgentTools({ className, children, ...props }: AgentToolsProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
        <Wrench className="h-3.5 w-3.5 text-cyan-400" />
        <span>Available Tools</span>
      </div>
      <Accordion
        type="multiple"
        className="w-full space-y-1.5"
      >
        {children}
      </Accordion>
    </div>
  );
}

export interface AgentToolProps extends ComponentProps<typeof AccordionItem> {
  tool: {
    description?: string;
    inputSchema?: any;
    parameters?: any;
  };
  value: string;
}

export function AgentTool({ tool, value, className, ...props }: AgentToolProps) {
  const schema = tool.inputSchema || tool.parameters || null;
  const schemaString =
    typeof schema === "string"
      ? schema
      : schema
      ? JSON.stringify(schema, null, 2)
      : null;

  return (
    <AccordionItem
      value={value}
      className={cn("rounded-xl border border-white/10 bg-white/[0.03] px-3", className)}
      {...props}
    >
      <AccordionTrigger className="py-2.5 text-xs font-medium hover:no-underline">
        <div className="flex items-center gap-2 text-left">
          <span className="font-mono font-semibold text-cyan-300">{value}</span>
          {tool.description && (
            <span className="line-clamp-1 text-[11px] text-muted-foreground font-normal">
              {tool.description}
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3 pt-1 text-xs text-neutral-300">
        {tool.description && (
          <p className="mb-2 text-xs text-neutral-400">{tool.description}</p>
        )}
        {schemaString && (
          <div className="mt-1.5 rounded-lg border border-white/5 bg-black/40 p-2.5">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Input Schema
            </div>
            <pre className="max-h-48 overflow-auto font-mono text-[11px] text-emerald-300">
              {schemaString}
            </pre>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export interface AgentOutputProps extends ComponentProps<"div"> {
  schema: string;
}

export function AgentOutput({ schema, className, ...props }: AgentOutputProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed",
        className
      )}
      {...props}
    >
      <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-neutral-200">
        <Code2 className="h-3.5 w-3.5 text-violet-400" />
        <span>Output Schema</span>
      </div>
      <pre className="max-h-48 overflow-auto rounded-lg border border-white/5 bg-black/40 p-2.5 font-mono text-[11px] text-violet-300">
        {schema}
      </pre>
    </div>
  );
}
