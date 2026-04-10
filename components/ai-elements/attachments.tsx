"use client";

/**
 * Attachment UI primitives inspired by AI Elements Attachments
 * @see https://elements.ai-sdk.dev/components/attachments
 * Local implementation (React 18 + shadcn) — no separate ai-elements package required.
 */

import * as React from "react";
import { FileText, ImageIcon, Video, Music, FileQuestion, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export type LabAttachmentData = {
  id: string;
  filename?: string;
  mediaType?: string;
  url?: string;
};

export function getMediaCategory(data: LabAttachmentData): "image" | "video" | "audio" | "document" | "unknown" {
  const t = (data.mediaType || "").toLowerCase();
  const n = (data.filename || "").toLowerCase();
  if (t.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(n)) return "image";
  if (t.startsWith("video/") || /\.(webm|mp4|mov)$/i.test(n)) return "video";
  if (t.startsWith("audio/") || /\.(mp3|wav|ogg)$/i.test(n)) return "audio";
  if (t.includes("pdf") || /\.(pdf|txt|md)$/i.test(n)) return "document";
  return "unknown";
}

export function getAttachmentLabel(data: LabAttachmentData): string {
  if (data.filename?.trim()) return data.filename.trim();
  const c = getMediaCategory(data);
  if (c === "image") return "Image";
  if (c === "video") return "Video clip";
  if (c === "audio") return "Audio";
  return "Attachment";
}

export function Attachments({
  variant = "grid",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "grid" | "inline" | "list" }) {
  return (
    <div
      className={cn(
        variant === "grid" && "grid grid-cols-2 gap-2 sm:grid-cols-3",
        variant === "inline" && "flex flex-wrap gap-2",
        variant === "list" && "flex flex-col gap-2",
        className,
      )}
      {...props}
    />
  );
}

export function Attachment({
  data,
  onRemove,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  data: LabAttachmentData;
  onRemove?: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/50",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-1.5 top-1.5 h-7 w-7 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove attachment"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

export function AttachmentPreview({
  data,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { data: LabAttachmentData }) {
  const cat = getMediaCategory(data);
  const url = data.url;

  if (cat === "image" && url) {
    return (
      <div className={cn("aspect-video w-full bg-black/5", className)} {...props}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (cat === "video" && url) {
    return (
      <div className={cn("aspect-video w-full bg-black", className)} {...props}>
        <video src={url} className="h-full w-full object-contain" controls muted playsInline />
      </div>
    );
  }

  const Icon =
    cat === "audio" ? Music : cat === "video" ? Video : cat === "document" ? FileText : FileQuestion;

  return (
    <div
      className={cn(
        "flex aspect-video w-full items-center justify-center bg-gradient-to-br from-violet-500/10 to-cyan-500/10",
        className,
      )}
      {...props}
    >
      <Icon className="h-10 w-10 text-muted-foreground/80" />
    </div>
  );
}

export function AttachmentInfo({
  data,
  showMediaType = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { data: LabAttachmentData; showMediaType?: boolean }) {
  const label = getAttachmentLabel(data);
  const cat = getMediaCategory(data);
  return (
    <div className={cn("space-y-0.5 px-2 py-2", className)} {...props}>
      <p className="truncate text-xs font-medium text-foreground">{label}</p>
      {showMediaType ? <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{cat}</p> : null}
    </div>
  );
}

export function AttachmentRemove(props: React.ComponentProps<typeof Button>) {
  return (
    <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" {...props}>
      <X className="h-4 w-4" />
    </Button>
  );
}

export function AttachmentHoverCard({ children, ...props }: React.ComponentProps<typeof HoverCard>) {
  return <HoverCard {...props}>{children}</HoverCard>;
}

export function AttachmentHoverCardTrigger(props: React.ComponentProps<typeof HoverCardTrigger>) {
  return <HoverCardTrigger {...props} />;
}

export function AttachmentHoverCardContent({
  className,
  ...props
}: React.ComponentProps<typeof HoverCardContent>) {
  return <HoverCardContent className={cn("w-72 p-2", className)} {...props} />;
}

export function AttachmentEmpty({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      <ImageIcon className="mb-2 h-8 w-8 opacity-40" />
      No attachments yet — add screen clips or files from the live session tab.
    </div>
  );
}
