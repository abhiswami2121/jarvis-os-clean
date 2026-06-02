export default function SandboxLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0d13]">
      <div className="flex flex-col items-center gap-6">
        {/* Liquid Glass skeleton card */}
        <div className="w-full max-w-2xl rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {/* Skeleton avatar */}
            <div className="h-10 w-10 rounded-xl bg-white/[0.04] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded-md bg-white/[0.04] animate-pulse" />
              <div className="h-3 w-32 rounded-md bg-white/[0.03] animate-pulse" />
            </div>
          </div>
          {/* Skeleton phase indicators */}
          <div className="mt-6 grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full bg-white/[0.04] animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
          {/* Skeleton content area */}
          <div className="mt-6 space-y-3">
            <div className="h-3 w-full rounded bg-white/[0.03] animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-white/[0.03] animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-white/[0.03] animate-pulse" />
          </div>
        </div>
        {/* Loading indicator */}
        <div className="flex items-center gap-3">
          <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-emerald-400 animate-pulse">
            <div className="size-3 rounded-sm bg-white/80" />
          </div>
          <span className="text-sm text-zinc-500">Loading sandbox…</span>
        </div>
      </div>
    </div>
  );
}
