"use client";
import { useState, use, useEffect, useMemo, useCallback } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { JarvisRuntimeProvider } from "@/app/jarvis-runtime";
import { ChatSidebar } from "@/components/jarvis/ChatSidebar";
import { ChatTopBar } from "@/components/jarvis/ChatTopBar";
import { ConnectionPill } from "@/components/jarvis/ConnectionPill";
import { ChatAurora } from "@/components/jarvis/ChatAurora";
import { PlatformHealthPanel } from "@/components/jarvis/PlatformHealthPanel";
import { HistoryShell } from "@/components/jarvis/HistoryShell";
import { useConnectionState } from "@/hooks/useConnectionState";
import { useConversationReplay } from "@/hooks/useConversationReplay";
import { useArtifactStore } from "@/stores/artifactStore";
import { useCanvasShortcuts } from "@/lib/use-canvas-shortcuts";
import { ArtifactProvider } from "@/contexts/ArtifactContext";
import { JarvisErrorBoundary } from "@/components/error/JarvisErrorBoundary";
import { ConnectorChatSheet } from "@/components/chat/ConnectorChatSheet";
import { CanvasOverlay } from "@/components/canvas/CanvasOverlay";
import { toThreadMessages } from "@/app/hydrate-initial-messages";
import { toast } from "sonner";

/**
 * PRODUCTION CONVERSATION PAGE — UNIFIED RENDER PATH.
 *
 * Fix (2026-06-03): History is now fetched at PAGE LEVEL and seeded into
 * the Thread as initialMessages via toThreadMessages(). This eliminates:
 *  1. The "How can I help you today?" greeting on active conversations
 *     (ThreadWelcome only renders when s.thread.isEmpty AND !hasHistory)
 *  2. The "double UI" — history was rendered by ConversationHydrator
 *     with different styling than live messages. Now ALL messages use
 *     the Thread's single render path.
 *
 * ConversationHydrator is replaced by HistoryShell — a minimal component
 * that only shows "Load earlier" pagination and "Resuming stream" indicator.
 *
 * Runtime re-keying: On cold loads (no session-store cache), the runtime
 * is re-created once when history arrives. On "Load earlier" pagination,
 * the runtime re-mounts with the expanded message set. Cache hits (the
 * common case) have zero re-mounts.
 */
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

  // ── History hydration ──────────────────────────────────────────
  // Fetched at PAGE LEVEL so it can seed the Thread as initialMessages.
  // Session-store cache provides instant hydration for previously-streamed
  // conversations (the common case). Cold VPS fetches trigger a single
  // runtime re-mount via key={runtimeKey}.
  const [historyVersion, setHistoryVersion] = useState(0);
  const {
    messages: historyMessages,
    loading: historyLoading,
    hasMoreOlder,
    loadingOlder,
    loadOlder,
    isResuming,
  } = useConversationReplay(conversationId);

  const initialMessages = useMemo(
    () => toThreadMessages(historyMessages),
    [historyMessages],
  );
  const hasHistory = historyMessages.length > 0;

  // Re-key the runtime when:
  //  - Cold load completes (loading → ready, messages arrived)
  //  - "Load earlier" pagination loads older messages
  const runtimeKey = `${conversationId}-${historyLoading ? "loading" : `v${historyVersion}`}`;

  const handleLoadOlder = useCallback(async () => {
    await loadOlder();
    setHistoryVersion((v) => v + 1);
  }, [loadOlder]);

  // ── Connection status toasts ───────────────────────────────────
  useEffect(() => {
    if (state === "offline") {
      toast.error("Jarvis is offline", { description: "Reconnecting...", id: "off" });
    } else if (state === "connected") {
      toast.dismiss("off");
    }
  }, [state]);

  return (
    <JarvisErrorBoundary>
    <JarvisRuntimeProvider
      key={runtimeKey}
      conversationId={conversationId}
      initialMessages={initialMessages}
    >
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
              onConnectorSheetToggle={() => setConnectorSheetOpen(!connectorSheetOpen)}
            />
          </div>
          <div className="absolute top-3 right-4 z-30 hidden md:block">
            <ConnectionPill state={state} latency={latency} />
          </div>

          <div className="flex-1 min-h-0 relative overflow-y-auto">
            <ChatAurora>
              {/* HistoryShell: pagination controls + resume indicator only.
                  Messages themselves render inside Thread via initialMessages. */}
              <HistoryShell
                cid={conversationId}
                hasMoreOlder={hasMoreOlder}
                loadingOlder={loadingOlder}
                loadOlder={handleLoadOlder}
                isResuming={isResuming}
                hasHistory={hasHistory}
                expanded={hasHistory && hasMoreOlder}
              />
              <JarvisErrorBoundary>
                <Thread hasHistory={hasHistory} />
              </JarvisErrorBoundary>
            </ChatAurora>
          </div>
        </main>

        {/* CanvasOverlay: Full-screen template-based canvas.
            Triggers when <canvas> XML tags are detected in agent responses.
            Renders as split-pane (60% width) on desktop, overlay on tablet, drawer on mobile. */}
        <CanvasOverlay className="z-20" />

        {/* Right sidebar: Platform Health Panel */}
        <aside className="hidden xl:flex w-80 flex-none border-l border-white/5 bg-[#08080f]/40 backdrop-blur-md overflow-y-auto">
          <PlatformHealthPanel />
        </aside>
      </div>
      <ConnectorChatSheet isOpen={connectorSheetOpen} onClose={() => setConnectorSheetOpen(false)} />
      </ArtifactProvider>
    </JarvisRuntimeProvider>
    </JarvisErrorBoundary>
  );
}
