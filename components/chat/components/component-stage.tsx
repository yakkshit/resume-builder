"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Briefcase,
  BarChart3,
  Code,
  GraduationCap,
  Mail,
  Share2,
  Sparkles,
  Globe,
  PanelRightClose,
  X,
  Maximize2,
  Minimize2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ComponentRenderer, ComponentType } from "../component-renderer";

export interface StageComponentInfo {
  id: string;
  type: ComponentType;
  data?: Record<string, unknown>;
  title: string;
}

interface ComponentStageProps {
  component: StageComponentInfo;
  onDockToChat: () => void;
  onClose: () => void;
  chatApiKey?: string;
  chatModel?: string;
  canonicalResumeKey?: string | null;
  onSendMessage?: (text: string) => void;
}

const COMPONENT_ICONS: Record<ComponentType, React.ElementType> = {
  resume: FileText,
  "cover-letter": FileText,
  "resume-latex": FileText,
  "cover-letter-latex": FileText,
  "cv-score": Sparkles,
  "job-recommendations": Briefcase,
  "job-scraper": Briefcase,
  chart: BarChart3,
  "auto-applier": Sparkles,
  "coding-challenge": Code,
  "learning-resources": GraduationCap,
  "email-hr": Mail,
  "linkedin-dm": Share2,
  browser: Globe,
};

export function ComponentStage({
  component,
  onDockToChat,
  onClose,
  chatApiKey,
  chatModel,
  canonicalResumeKey,
  onSendMessage,
}: ComponentStageProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const Icon = COMPONENT_ICONS[component.type] || Layers;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex flex-col h-full w-full bg-background border-l border-border/60 shadow-xl overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 bg-background" : "relative"
      }`}
    >
      {/* Top Header Bar (Google AI Studio / Canvas aesthetic) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 backdrop-blur-md border-b border-border/50 select-none shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-foreground truncate">
                {component.title}
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/25">
                Side Canvas
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Interactive Google-grade workspace view
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDockToChat}
                  className="h-7 px-2.5 text-xs gap-1.5 rounded-md border-border/60 hover:bg-muted"
                >
                  <PanelRightClose className="size-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Dock to Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Move this component back into the chat stream
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="size-7 rounded-md text-muted-foreground hover:text-foreground"
                >
                  {isFullscreen ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen Stage"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Close Side Canvas
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-radial-gradient/5">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <ComponentRenderer
            type={component.type}
            data={component.data}
            chatApiKey={chatApiKey}
            chatModel={chatModel}
            resumeSyncsWithGlobal={true}
            onSendMessage={onSendMessage}
            isInSideStage={true}
            onDockToChat={onDockToChat}
          />
        </div>
      </div>
    </motion.div>
  );
}
