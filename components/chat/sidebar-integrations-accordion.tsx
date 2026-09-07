"use client";

import { useState } from "react";
import {
  Briefcase,
  Plug,
  Server,
  Settings,
  Sparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChatSettings } from "./chat-store";
import { MCPDialog } from "./mcp-dialog";

type ToastVariant = "default" | "success" | "error" | "warning";

type Props = {
  settings: ChatSettings;
  onSettingsChange: (patch: Partial<ChatSettings>) => void;
  onToast?: (variant: ToastVariant, message: string) => void;
};

export function SidebarIntegrationsAccordion({ settings, onSettingsChange }: Props) {
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);

  return (
    <div className="border-b border-border/50 px-1 py-1">
      <p className="mb-1.5 flex items-center gap-1.5 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Plug className="h-3 w-3 text-primary" />
        Tools & Integrations
      </p>
      <Accordion type="multiple" className="w-full" defaultValue={["mcp-servers"]}>
        <AccordionItem value="mcp-servers" className="border-border/40">
          <AccordionTrigger className="py-2 text-left text-xs font-medium hover:no-underline [&>svg]:text-muted-foreground">
            <span className="flex flex-1 items-center justify-between pr-2">
              <span className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 shrink-0 text-primary" />
                MCP Servers & Tools
              </span>
              <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-primary text-[10px]">
                Active
              </Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 pb-2.5 pt-0 text-[11px] leading-relaxed text-muted-foreground">
            <p className="text-xs">
              Configure Model Context Protocol tools, PDF generators, and live integrations.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => setMcpDialogOpen(true)}
              className="h-7 w-full rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-medium"
            >
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Manage Tools
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="job-scraper" className="border-border/40">
          <AccordionTrigger className="py-2 text-left text-xs font-medium hover:no-underline [&>svg]:text-muted-foreground">
            <span className="flex flex-1 items-center justify-between pr-2">
              <span className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
                Live Job Matching
              </span>
              <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[10px]">
                Live
              </Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 pb-2.5 pt-0 text-[11px] text-muted-foreground">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-xs">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Quick Search
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Type <span className="font-mono text-foreground font-medium">"Find frontend jobs in Remote"</span> to scrape live postings.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <MCPDialog open={mcpDialogOpen} onOpenChange={setMcpDialogOpen} />
    </div>
  );
}
