import Link from "next/link";

export default function SandboxNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0d13]">
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Liquid Glass 404 Card */}
        <div className="w-full max-w-md rounded-2xl border border-white/[0.05] bg-white/[0.02] p-10 backdrop-blur-xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.03]">
            <svg
              className="size-8 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="mb-2 text-lg font-medium text-zinc-200">
            Sandbox Not Found
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-zinc-500">
            This sandbox doesn&apos;t exist or has been removed. It may have been
            archived after 30 days of inactivity.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04]
                         px-5 py-2.5 text-sm text-zinc-300 transition-colors
                         hover:bg-white/[0.08] hover:text-zinc-100
                         border border-white/[0.06]"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Chat
            </Link>
            <Link
              href="/api/mvp/list"
              className="text-xs text-zinc-600 underline hover:text-zinc-400 transition-colors"
            >
              View all MVPs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
