"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  RotateCw, 
  ExternalLink, 
  ArrowLeft, 
  ArrowRight,
  Terminal,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DeviceMode = "desktop" | "tablet" | "mobile";

interface WebPreviewContextType {
  url: string;
  setUrl: (url: string) => void;
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  reload: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  logs: Array<{ level: "log" | "warn" | "error"; message: string; timestamp: Date }>;
  addLog: (level: "log" | "warn" | "error", message: string) => void;
  showConsole: boolean;
  setShowConsole: (show: boolean | ((prev: boolean) => boolean)) => void;
}

const WebPreviewContext = createContext<WebPreviewContextType | null>(null);

export function useWebPreview() {
  const ctx = useContext(WebPreviewContext);
  if (!ctx) throw new Error("useWebPreview must be used within a WebPreview");
  return ctx;
}

export interface WebPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
  children?: React.ReactNode;
}

export function WebPreview({
  defaultUrl = "",
  onUrlChange,
  className,
  children,
  ...props
}: WebPreviewProps) {
  const [url, setUrlState] = useState(defaultUrl);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [showConsole, setShowConsole] = useState(false);
  const [logs, setLogs] = useState<Array<{ level: "log" | "warn" | "error"; message: string; timestamp: Date }>>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const setUrl = (newUrl: string) => {
    setUrlState(newUrl);
    onUrlChange?.(newUrl);
  };

  const reload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = url || iframeRef.current.src;
    }
  };

  const addLog = (level: "log" | "warn" | "error", message: string) => {
    setLogs((prev) => [...prev.slice(-99), { level, message, timestamp: new Date() }]);
  };

  return (
    <WebPreviewContext.Provider
      value={{
        url,
        setUrl,
        deviceMode,
        setDeviceMode,
        reload,
        iframeRef,
        logs,
        addLog,
        showConsole,
        setShowConsole,
      }}
    >
      <div
        className={cn(
          "flex flex-col h-full w-full border border-border rounded-xl overflow-hidden bg-background shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
}

export function WebPreviewNavigation({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { deviceMode, setDeviceMode, reload, url, showConsole, setShowConsole } = useWebPreview();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30 backdrop-blur-md text-xs",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {children || <WebPreviewUrl />}
      </div>

      <div className="flex items-center gap-1">
        {/* Device Mode Selectors */}
        <div className="flex items-center rounded-lg border border-border/60 bg-background/50 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6 rounded p-0 text-muted-foreground", deviceMode === "desktop" && "bg-muted text-foreground")}
            onClick={() => setDeviceMode("desktop")}
            title="Desktop Mode"
          >
            <Laptop className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6 rounded p-0 text-muted-foreground", deviceMode === "tablet" && "bg-muted text-foreground")}
            onClick={() => setDeviceMode("tablet")}
            title="Tablet Mode"
          >
            <Tablet className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6 rounded p-0 text-muted-foreground", deviceMode === "mobile" && "bg-muted text-foreground")}
            onClick={() => setDeviceMode("mobile")}
            title="Mobile Mode"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
          onClick={reload}
          title="Reload preview"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 rounded-md text-muted-foreground hover:text-foreground", showConsole && "bg-muted text-foreground")}
          onClick={() => setShowConsole((v) => !v)}
          title="Toggle Console"
        >
          <Terminal className="h-3.5 w-3.5" />
        </Button>

        {url && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => window.open(url, "_blank")}
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export interface WebPreviewNavigationButtonProps extends React.ComponentProps<typeof Button> {
  tooltip?: string;
}

export function WebPreviewNavigationButton({
  tooltip,
  children,
  className,
  ...props
}: WebPreviewNavigationButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7 rounded-md text-muted-foreground hover:text-foreground", className)}
      title={tooltip}
      {...props}
    >
      {children}
    </Button>
  );
}

export function WebPreviewUrl({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const { url, setUrl } = useWebPreview();
  const [draft, setDraft] = useState(url);

  useEffect(() => {
    setDraft(url);
  }, [url]);

  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setUrl(draft);
      }}
      placeholder="https://..."
      className={cn("h-7 text-xs bg-background/80 border-border/80 px-2 rounded-md max-w-sm", className)}
      {...props}
    />
  );
}

export interface WebPreviewBodyProps extends Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, "loading"> {
  loading?: React.ReactNode;
}

export function WebPreviewBody({
  src,
  loading,
  className,
  ...props
}: WebPreviewBodyProps) {
  const { url, deviceMode, iframeRef } = useWebPreview();
  const [isLoading, setIsLoading] = useState(true);

  const effectiveSrc = src || url;

  const deviceWidthClass = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  }[deviceMode];

  return (
    <div className="relative flex-1 min-h-[300px] w-full flex items-center justify-center bg-muted/20 overflow-auto p-2">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-xs">
          {loading || (
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <RotateCw className="h-4 w-4 animate-spin text-primary" />
              <span>Loading preview…</span>
            </div>
          )}
        </div>
      )}

      {effectiveSrc ? (
        <iframe
          ref={iframeRef as any}
          src={effectiveSrc}
          className={cn(
            "h-full border border-border/60 rounded-lg shadow-sm bg-background transition-all duration-300",
            deviceWidthClass,
            className
          )}
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => setIsLoading(false)}
          {...props}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground">
          No URL specified for WebPreview
        </div>
      )}
    </div>
  );
}

export function WebPreviewConsole({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { logs, showConsole } = useWebPreview();
  const [copied, setCopied] = useState(false);

  if (!showConsole) return null;

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.level.toUpperCase()}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "border-t border-border bg-[#0d0d12] text-white p-3 text-xs font-mono max-h-48 overflow-y-auto",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-muted-foreground text-[10px]">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3" />
          <span>Console Output ({logs.length})</span>
        </div>
        <button
          type="button"
          onClick={copyLogs}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="space-y-1">
        {logs.length === 0 ? (
          <p className="text-white/40 italic">No console logs.</p>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-2 leading-relaxed",
                log.level === "error" && "text-rose-400",
                log.level === "warn" && "text-amber-300",
                log.level === "log" && "text-white/80"
              )}
            >
              <span className="text-white/30 shrink-0">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className="break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
