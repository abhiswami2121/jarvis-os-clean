"use client";
import { useState, use, useEffect } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { JarvisRuntimeProvider } from "@/app/jarvis-runtime";
import { ChatSidebar } from "@/components/jarvis/ChatSidebar";
import { ChatTopBar } from "@/components/jarvis/ChatTopBar";
import { ConnectionPill } from "@/components/jarvis/ConnectionPill";
import { ConversationHydrator } from "@/components/jarvis/ConversationHydrator";
import { ChatAurora } from "@/components/jarvis/ChatAurora";
import { CanvasOverlay } from "@/components/canvas/CanvasOverlay";
import { ArtifactWorkspace } from "@/components/workspace/ArtifactWorkspace";
import { SlackCanvasToolUI } from "@/components/chat/SlackCanvasToolUI";
import { LiveStatusPane } from "@/components/jarvis/LiveStatusPane";
import { useConnectionState } from "@/hooks/useConnectionState";
import { useArtifactStore } from "@/stores/artifactStore";
import { useCanvasShortcuts } from "@/lib/use-canvas-shortcuts";
import { ArtifactProvider } from "@/contexts/ArtifactContext";
import { JarvisErrorBoundary } from "@/components/error/JarvisErrorBoundary";
import { ConnectorChatSheet } from "@/components/chat/ConnectorChatSheet";
import { toast } from "sonner";

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connectorSheetOpen, setConnectorSheetOpen] = useState(false);
  const { state, latency } = useConnectionState();
  const artifactOpen = useArtifactStore((s) => s.isOpen);
  const artifactClose = useArtifactStore((s) => s.close);
  const artifactOpenPanel = useArtifactStore((s) => s.openPanel);

  // Phase 4 P1: Keyboard shortcuts for canvas control
  useCanvasShortcuts();

  useEffect(() => {
    if (state === "offline") {
      toast.error("Jarvis is offline", { description: "Reconnecting...", id: "off" });
    } else if (state === "connected") {
      toast.dismiss("off");
    }
  }, [state]);

  return (
    <JarvisErrorBoundary>
    <JarvisRuntimeProvider conversationId={conversationId}>
      <ArtifactProvider>
      <div className="fixed inset-0 flex bg-[#08080f] text-zinc-100 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 size-[600px] rounded-full bg-indigo-500/8 blur-3xl" />
          <div className="absolute top-1/3 -right-40 size-[500px] rounded-full bg-purple-500/8 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 size-[700px] rounded-full bg-pink-500/8 blur-3xl" />
        </div>

        <ChatSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

        <main className="relative z-10 flex flex-1 flex-col min-w-0 h-full">
          <div className="flex-none border-b border-white/5 bg-[#08080f]/80 backdrop-blur-md">
            <ChatTopBar
              onArtifactToggle={() => artifactOpen ? artifactClose() : artifactOpenPanel()}
              artifactOpen={artifactOpen}
              onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>
          <div className="absolute top-3 right-4 z-30 hidden md:block">
            <ConnectionPill state={state} latency={latency} />
          </div>

          <div className="flex-1 min-h-0 relative overflow-y-auto">
            <ConversationHydrator cid={conversationId} />
            <ChatAurora>
              <JarvisErrorBoundary>
                <Thread />
              </JarvisErrorBoundary>
            </ChatAurora>
          </div>
        </main>

        {/* Note: ArtifactPanel is now embedded inside Thread for flex-row layout */}

        {/* Stream V: LiveStatusPane — right-side glass panel with session metrics */}
        <aside className="hidden xl:flex w-80 flex-none border-l border-white/5 bg-[#08080f]/40 backdrop-blur-md overflow-y-auto">
          <LiveStatusPane />
        </aside>
      </div>
      <SlackCanvasToolUI />
      <CanvasOverlay />
      <ArtifactWorkspace />
      <ConnectorChatSheet isOpen={connectorSheetOpen} onClose={() => setConnectorSheetOpen(false)} />
      </ArtifactProvider>
    </JarvisRuntimeProvider>
    </JarvisErrorBoundary>
  );
}
