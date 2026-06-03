"use client";

import { useState, useCallback, useEffect } from "react";
import {
  X, Copy, Download, FileText, Code, Database,
  ChevronRight, ExternalLink, History, BarChart3,
  Pin, PinOff, Maximize2, Minimize2, Columns2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useArtifactStore } from "@/stores/artifactStore";
import { ArtifactRenderer } from "@/components/canvas/ArtifactRenderer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ── Icon & label map ────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  report: FileText,
  code: Code,
  data: Database,
  "mini-app": ExternalLink,
  chart: BarChart3,
};

const TYPE_LABELS: Record<string, string> = {
  report: "Report",
  code: "Code",
  data: "Data",
  "mini-app": "App",
  chart: "Chart",
};

const TYPE_COLORS: Record<string, string> = {
  report: "text-purple-400",
  code: "text-emerald-400",
  data: "text-sky-400",
  "mini-app": "text-amber-400",
  chart: "text-pink-400",
};

// ── Inner content shared between desktop & mobile ───────────────────

function ArtifactInner() {
  const current = useArtifactStore((s) => s.current);
  const history = useArtifactStore((s) => s.history);
  const selectRevision = useArtifactStore((s) => s.selectRevision);
  const tabs = useArtifactStore((s) => s.tabs);
  const pinnedIds = useArtifactStore((s) => s.pinnedIds);
  const activeTabId = useArtifactStore((s) => s.activeTabId);
  const switchTab = useArtifactStore((s) => s.switchTab);
  const closeTab = useArtifactStore((s) => s.closeTab);
  const pinTab = useArtifactStore((s) => s.pinTab);
  const unpinTab = useArtifactStore((s) => s.unpinTab);
  const mode = useArtifactStore((s) => s.mode);
  const setMode = useArtifactStore((s) => s.setMode);

  const [showHistory, setShowHistory] = useState(false);

  const handleCopy = useCallback(() => {
    if (!current) return;
    const text = current.content ?? JSON.stringify(current, null, 2);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => toast.success("Copied!", { duration: 2000 }),
        () => toast.error("Copy failed"),
      );
    }
  }, [current]);

  const handleDownload = useCallback(() => {
    if (!current) return;
    let content: string | Blob;
    let ext: string;

    if (current.type === "data" && current.columns && current.rows) {
      const header = current.columns.map((c) => c.label).join(",");
      const body = current.rows
        .map((row) => current.columns!.map((c) => String(row[c.key] ?? "")).join(","))
        .join("\n");
      content = new Blob([header + "\n" + body], { type: "text/csv" });
      ext = "csv";
    } else {
      content = new Blob([current.content || JSON.stringify(current, null, 2)], {
        type: current.type === "code" ? "text/plain" : "text/markdown",
      });
      ext = current.type === "report" ? "md" : "txt";
    }

    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(current.title || "artifact").replace(/\s+/g, "_").slice(0, 40)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  }, [current]);

  if (!current) return null;

  const TypeIcon = TYPE_ICONS[current.type] || FileText;
  const typeColor = TYPE_COLORS[current.type] || "text-purple-400";
  const typeLabel = TYPE_LABELS[current.type] || "Artifact";

  return (
    <>
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between px-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon className={`size-4 shrink-0 ${typeColor}`} />
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {typeLabel}
          </span>
          <span className="text-[10px] text-zinc-600">
            · {history.length} revision{history.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleCopy}
            className="flex size-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            aria-label="Copy artifact"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            onClick={handleDownload}
            className="flex size-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            aria-label="Download artifact"
          >
            <Download className="size-3.5" />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex size-7 items-center justify-center rounded-md transition-colors ${
              showHistory ? "text-zinc-200 bg-white/[0.06]" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]"
            }`}
            aria-label="Revision history"
          >
            <History className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Phase 4 P1: Claude-style multi-tab bar */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-0 px-2 py-1.5 border-b border-white/[0.03] overflow-x-auto scrollbar-none bg-white/[0.01]">
          {/* Sort pinned first, then by recency */}
          {[...tabs].sort((a, b) => {
            const aPinned = pinnedIds.includes(a) ? 0 : 1;
            const bPinned = pinnedIds.includes(b) ? 0 : 1;
            if (aPinned !== bPinned) return aPinned - bPinned;
            return tabs.indexOf(a) - tabs.indexOf(b);
          }).map((tabId) => {
            const art = history.find((a) => a.id === tabId);
            if (!art) return null;
            const TabIcon = TYPE_ICONS[art.type] || FileText;
            const tabColor = TYPE_COLORS[art.type] || "text-zinc-500";
            const isActive = tabId === activeTabId;
            const isPinned = pinnedIds.includes(tabId);
            const title = (art.title || "Untitled").slice(0, 22);

            return (
              <button
                key={tabId}
                onClick={() => switchTab(tabId)}
                onDoubleClick={() => isPinned ? unpinTab(tabId) : pinTab(tabId)}
                title={`${art.title}${isPinned ? " (pinned — double-click to unpin)" : " (double-click to pin)"}`}
                className={`group/tab flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150 border mx-0.5 ${
                  isActive
                    ? "bg-white/[0.06] text-zinc-200 border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                    : "text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <TabIcon className={`size-3 shrink-0 ${isActive ? "text-zinc-300" : tabColor}`} />
                <span className="truncate max-w-[100px]">{title}</span>
                {isPinned && (
                  <Pin className="size-2.5 shrink-0 text-zinc-500 ml-0.5" />
                )}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabId);
                  }}
                  className="ml-0.5 flex size-4 items-center justify-center rounded-sm text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.15] opacity-0 group-hover/tab:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Title + metadata */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h2 className="text-sm font-semibold text-zinc-100 truncate">{current.title}</h2>
        <p className="text-[10px] text-zinc-600 mt-0.5">
          Created {new Date(current.createdAt).toLocaleString()}
        </p>
      </div>

      {/* History drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-white/[0.04]"
          >
            <div className="px-4 py-2 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">
                Revisions
              </div>
              {history.map((rev) => {
                const RevIcon = TYPE_ICONS[rev.type] || FileText;
                const revColor = TYPE_COLORS[rev.type] || "text-zinc-500";
                const isActive = rev.id === current.id;
                return (
                  <button
                    key={rev.id}
                    onClick={() => selectRevision(rev.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                      isActive
                        ? "bg-white/[0.06] text-zinc-100"
                        : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                    }`}
                  >
                    <RevIcon className={`size-3 shrink-0 ${revColor}`} />
                    <span className="truncate flex-1">{rev.title}</span>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {new Date(rev.createdAt).toLocaleTimeString()}
                    </span>
                    {isActive && <ChevronRight className="size-3 shrink-0 text-zinc-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <ArtifactRenderer
          artifact={{
            type: current.type,
            content: current.content,
            files: current.files,
            columns: current.columns,
            rows: current.rows,
            totalRows: current.totalRows,
            src: current.src,
            title: current.title,
          }}
        />
      </div>
    </>
  );
}

// ── Desktop split-pane ──────────────────────────────────────────────

function DesktopArtifactPanel() {
  const current = useArtifactStore((s) => s.current);
  const isOpen = useArtifactStore((s) => s.isOpen);
  const mode = useArtifactStore((s) => s.mode);
  const close = useArtifactStore((s) => s.close);
  const setMode = useArtifactStore((s) => s.setMode);

  const isFullscreen = mode === "fullscreen";

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) setMode("split");
        else close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, isFullscreen, setMode]);

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.aside
          key="artifact-desktop-panel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          className={`hidden lg:flex relative z-20 shrink-0 flex-col border-l border-white/[0.04] ${
            isFullscreen ? "w-full fixed inset-0 z-50" : "w-[42vw] min-w-[480px] max-w-[720px]"
          }`}
          style={{
            background: "linear-gradient(180deg, rgba(12,11,22,0.98) 0%, rgba(9,8,16,0.99) 100%)",
            backdropFilter: "blur(48px) saturate(180%)",
            WebkitBackdropFilter: "blur(48px) saturate(180%)",
            boxShadow: "-8px 0 40px -16px rgba(0,0,0,0.5), inset 1px 0 0 0 rgba(255,255,255,0.03)",
          }}
          data-artifact-panel="desktop"
          role="complementary"
          aria-label="Artifact panel"
        >
          <ArtifactInner />
          {/* Bottom-right controls — Claude-style: subtle, contextual */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
            {/* Split/Fullscreen toggle */}
            <button
              onClick={() => setMode(isFullscreen ? "split" : "fullscreen")}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen (⌘F)"}
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </button>
            {/* Close */}
            <button
              onClick={close}
              className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              aria-label="Close panel"
              title="Close canvas (⌘\\)"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ── Mobile bottom-sheet ─────────────────────────────────────────────

function MobileArtifactSheet() {
  const current = useArtifactStore((s) => s.current);
  const isOpen = useArtifactStore((s) => s.isOpen);
  const close = useArtifactStore((s) => s.close);

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen && !!current} onOpenChange={(open) => { if (!open) close(); }}>
        <SheetContent
          side="bottom"
          className="h-[85vh] flex flex-col bg-zinc-950 border-t border-white/[0.08] rounded-t-2xl"
          showCloseButton={true}
          data-artifact-panel="mobile-sheet"
        >
          <SheetHeader className="shrink-0 p-0">
            <SheetTitle className="sr-only">Artifact</SheetTitle>
          </SheetHeader>
          <ArtifactInner />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Combined export ─────────────────────────────────────────────────

export function ArtifactPanel() {
  return (
    <>
      <DesktopArtifactPanel />
      <MobileArtifactSheet />
    </>
  );
}

export default ArtifactPanel;
