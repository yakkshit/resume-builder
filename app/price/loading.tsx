export default function PriceLoading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#aff33e] animate-ping" />
        <span className="text-xs font-mono text-zinc-400">Loading pricing plans...</span>
      </div>
    </div>
  );
}
