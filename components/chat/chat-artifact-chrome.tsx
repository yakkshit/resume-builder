"use client";

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ArtifactPanelMode = "expanded" | "compact" | "hidden";

const trafficBase =
  "h-3 w-3 shrink-0 rounded-full shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

export function ArtifactTrafficLights({
  variant = "dark",
  panelMode,
  setPanelMode,
}: {
  variant?: "light" | "dark";
  panelMode: ArtifactPanelMode;
  setPanelMode: Dispatch<SetStateAction<ArtifactPanelMode>>;
}) {
  const ring =
    variant === "light"
      ? "focus-visible:ring-violet-500/50 focus-visible:ring-offset-background"
      : "focus-visible:ring-white/40 focus-visible:ring-offset-[#121215]";
  return (
    <div className="flex gap-1.5 shrink-0" role="group" aria-label="Window controls">
      <button
        type="button"
        className={cn(
          trafficBase,
          variant === "light" ? "bg-red-400 hover:bg-red-500" : "bg-red-500/90 hover:bg-red-500",
          ring,
        )}
        aria-label="Hide panel"
        title="Hide"
        onClick={() => setPanelMode("hidden")}
      />
      <button
        type="button"
        className={cn(
          trafficBase,
          variant === "light" ? "bg-amber-400 hover:bg-amber-500" : "bg-amber-500/90 hover:bg-amber-500",
          ring,
        )}
        aria-label="Minimize"
        title="Minimize"
        onClick={() => setPanelMode((m) => (m === "expanded" ? "compact" : m))}
      />
      <button
        type="button"
        className={cn(
          trafficBase,
          variant === "light" ? "bg-emerald-400 hover:bg-emerald-500" : "bg-emerald-500/90 hover:bg-emerald-500",
          ring,
        )}
        aria-label="Expand panel"
        title="Expand"
        onClick={() => setPanelMode("expanded")}
      />
    </div>
  );
}

export function useArtifactPanelMode(initial: ArtifactPanelMode = "expanded") {
  return useState<ArtifactPanelMode>(initial);
}

type ArtifactWindowProps = {
  variant?: "light" | "dark";
  cardClassName: string;
  headerClassName: string;
  contentClassName?: string;
  title: ReactNode;
  /** Shown in header when expanded (e.g. action buttons) */
  trailing?: ReactNode;
  /** Compact / hidden hint text */
  compactHintClassName?: string;
  children: ReactNode;
};

/**
 * macOS-style traffic lights + hide/minimize/expand for chat-embedded cards.
 */
export function ChatArtifactWindow({
  variant = "dark",
  cardClassName,
  headerClassName,
  contentClassName,
  title,
  trailing,
  compactHintClassName,
  children,
}: ArtifactWindowProps) {
  const [panelMode, setPanelMode] = useArtifactPanelMode();
  const hint =
    variant === "light"
      ? "text-[10px] text-muted-foreground"
      : cn("text-[10px] text-[#8a8a8f]", compactHintClassName);

  return (
    <Card className={cardClassName}>
      <CardHeader
        className={cn(
          headerClassName,
          "flex flex-row flex-wrap items-center gap-2 gap-y-2",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <ArtifactTrafficLights variant={variant} panelMode={panelMode} setPanelMode={setPanelMode} />
          <div className="min-w-0 flex-1">{title}</div>
        </div>
        {panelMode === "expanded" && trailing ? (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto">{trailing}</div>
        ) : null}
        {panelMode === "compact" ? (
          <span className={hint}>Green expands · Yellow shrinks</span>
        ) : null}
        {panelMode === "hidden" ? <span className={hint}>Green dot restores the panel</span> : null}
      </CardHeader>
      {panelMode !== "hidden" ? (
        <CardContent
          className={cn(
            contentClassName,
            panelMode === "compact" && "max-h-[min(240px,42vh)] overflow-y-auto overflow-x-hidden",
          )}
        >
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}
