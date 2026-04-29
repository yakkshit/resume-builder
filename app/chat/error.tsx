"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[chat] route error:", error?.message, error?.digest ?? "");
  }, [error]);

  const msg = (error?.message ?? "").toLowerCase();
  const chunk = msg.includes("chunk") || msg.includes("loading chunk");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-8">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        {chunk
          ? "The chat UI failed to load a JavaScript chunk. This often happens after the dev server restarts (memory threshold) while the browser still has an old tab open."
          : error?.message || "An unexpected error occurred."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Hard refresh
        </Button>
      </div>
    </div>
  );
}
