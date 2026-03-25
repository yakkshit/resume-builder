"use client";

/**
 * Layered mesh + gradient backdrop for the chat experience (light + dark).
 */
export function ChatAmbient() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/95 via-background to-slate-100/40 dark:from-[#050508] dark:via-[#08080f] dark:to-[#0a0c14]" />
      <div className="absolute -left-[20%] top-[-10%] h-[min(85vh,720px)] w-[min(90vw,900px)] rounded-[100%] bg-gradient-to-br from-sky-400/25 via-blue-500/10 to-transparent blur-3xl dark:from-[#1d4ed8]/35 dark:via-[#312e81]/20" />
      <div className="absolute -right-[15%] bottom-[-5%] h-[min(75vh,640px)] w-[min(85vw,820px)] rounded-[100%] bg-gradient-to-tl from-violet-500/20 via-fuchsia-400/5 to-transparent blur-3xl dark:from-[#6d28d9]/25 dark:via-[#4c1d95]/15" />
      <div className="absolute left-1/2 top-1/3 h-px w-[120%] -translate-x-1/2 rotate-[-8deg] bg-gradient-to-r from-transparent via-primary/10 to-transparent dark:via-[#3b82f6]/15" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.5]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 0v100M0 50h56' fill='none' stroke='%23000' stroke-opacity='.04'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
