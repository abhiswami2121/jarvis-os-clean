"use client";
import { useState, use, useEffect } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { JarvisRuntimeProvider } from "@/app/jarvis-runtime";
import { ChatSidebar } from "@/components/jarvis/ChatSidebar";
import { ChatTopBar } from "@/components/jarvis/ChatTopBar";
import { ConnectorsStrip } from "@/components/jarvis/ConnectorsStrip";
import { ArtifactPanel } from "@/components/jarvis/ArtifactPanel";
import { ConversationHydrator } from "@/components/jarvis/ConversationHydrator";
import { ConnectionPill } from "@/components/jarvis/ConnectionPill";
import { useConnectionState } from "@/hooks/useConnectionState";
import { toast } from "sonner";

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { state, latency } = useConnectionState();

  // Surface offline state once when it transitions (avoid spam)
  useEffect(() => {
    if (state === "offline") {
      toast.error("Jarvis is offline", { description: "Reconnecting in the background…", id: "offline-toast" });
    } else if (state === "connected") {
      toast.dismiss("offline-toast");
    }
  }, [state]);

  return (
    <JarvisRuntimeProvider conversationId={conversationId}>
      <div className="relative flex h-screen overflow-hidden bg-[#08080f] text-zinc-100">
        {/* AMBIENT BACKGROUND — iOS aurora */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 size-[600px] rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute top-1/3 -right-40 size-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 size-[700px] rounded-full bg-emerald-500/8 blur-3xl" />
        </div>

        <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

        <main className="relative z-10 flex flex-1 flex-col min-w-0">
          <ChatTopBar
            onArtifactToggle={() => setArtifactOpen(!artifactOpen)}
            artifactOpen={artifactOpen}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <ConnectorsStrip />
          <div className="absolute top-3 right-4 z-30 hidden md:block">
            <ConnectionPill state={state} latency={latency} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationHydrator cid={conversationId} />
            <Thread />
          </div>
        </main>

        <ArtifactPanel open={artifactOpen} onClose={() => setArtifactOpen(false)} />
      </div>
    </JarvisRuntimeProvider>
  );
}
