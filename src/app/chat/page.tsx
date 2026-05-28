"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

/**
 * /chat — entry redirect to /chat/[cid].
 * BULLETPROOF: server-renders a deterministic page, then client redirects.
 * Manual link always renders. Never produces a next-error boundary.
 */
function makeCid() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatEntry() {
  const router = useRouter();
  const [cid, setCid] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    let id: string | null = null;
    try {
      if (typeof window !== "undefined") {
        id = sessionStorage.getItem("jarvis-os:cid:v1");
      }
    } catch {}
    if (!id) {
      id = makeCid();
      try {
        if (typeof window !== "undefined") sessionStorage.setItem("jarvis-os:cid:v1", id);
      } catch {}
    }
    setCid(id);
    try {
      router.replace(`/chat/${id}`);
    } catch (e) {
      // Fallback: hard navigation
      if (typeof window !== "undefined") window.location.replace(`/chat/${id}`);
    }
    // Hard fallback timer
    const t = setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname === "/chat") {
        window.location.replace(`/chat/${id}`);
      } else {
        setRedirecting(false);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#08080f] text-zinc-300">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 animate-pulse">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="text-sm">{redirecting ? "Starting conversation…" : "Ready"}</span>
        </div>
        {cid && (
          <a
            href={`/chat/${cid}`}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-200 underline"
          >
            Click here if not redirected
          </a>
        )}
      </div>
    </div>
  );
}
