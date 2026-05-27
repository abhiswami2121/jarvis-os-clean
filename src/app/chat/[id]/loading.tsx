/**
 * Loading skeleton for /chat/[id] — shown during initial module load.
 * Prevents flash of unstyled content and gives user immediate feedback.
 */
export default function ConversationLoading() {
  return (
    <div className="fixed inset-0 flex bg-[#08080f] text-zinc-100 overflow-hidden">
      {/* Ambient background blobs — match the real page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[600px] rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute top-1/3 -right-40 size-[500px] rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 size-[700px] rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-[260px] flex-shrink-0 border-r border-white/5 bg-[#0a0a14]/60 backdrop-blur-sm">
        <div className="w-full p-4 space-y-3">
          <div className="h-5 w-24 bg-white/[0.03] rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-white/[0.02] rounded-lg animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>

      {/* Main area skeleton */}
      <main className="relative z-10 flex flex-1 flex-col min-w-0 h-full">
        {/* Top bar skeleton */}
        <div className="flex-none border-b border-white/5 bg-[#08080f]/80 backdrop-blur-md h-14">
          <div className="flex items-center h-full px-4 gap-3">
            <div className="size-8 bg-white/[0.04] rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-white/[0.03] rounded animate-pulse" />
            <div className="flex-1" />
            <div className="h-6 w-20 bg-white/[0.03] rounded-full animate-pulse" />
          </div>
        </div>

        {/* Chat area skeleton */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <div className="h-3 w-48 bg-white/[0.03] rounded animate-pulse" />
          <div className="h-3 w-32 bg-white/[0.02] rounded animate-pulse" />
          <div className="h-3 w-40 bg-white/[0.02] rounded animate-pulse" style={{ animationDelay: "100ms" }} />
        </div>

        {/* Composer skeleton */}
        <div className="flex-none p-4">
          <div className="mx-auto max-w-(--thread-max-width) h-12 bg-white/[0.03] rounded-3xl animate-pulse" />
        </div>
      </main>
    </div>
  );
}
