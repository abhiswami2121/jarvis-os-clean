"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { newConversationId } from "@/lib/jarvis-os-client";
import { Sparkles } from "lucide-react";

/**
 * /chat — entry point. Auto-redirects to /chat/[newCid] so every conversation
 * has a stable URL from the moment it begins. If sessionStorage has a recent cid,
 * we land there instead (preserves continuity within the same tab).
 */
export default function ChatEntry() {
  const router = useRouter();

  useEffect(() => {
    let cid: string | null = null;
    if (typeof window !== "undefined") {
      cid = sessionStorage.getItem("jarvis-os:cid:v1");
    }
    if (!cid) {
      cid = newConversationId();
      if (typeof window !== "undefined") sessionStorage.setItem("jarvis-os:cid:v1", cid);
    }
    router.replace(`/chat/${cid}`);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#08080f] text-zinc-300">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 animate-pulse">
          <Sparkles className="size-4 text-white" />
        </div>
        <span className="text-sm">Starting conversation…</span>
      </div>
    </div>
  );
}
