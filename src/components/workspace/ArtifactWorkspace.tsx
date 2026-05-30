"use client";

import React, { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, GripHorizontal, PanelRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore, type WorkspaceViewMode } from "@/lib/stores/workspace-store";
import { SpreadsheetView } from "./SpreadsheetView";
import { ChartView } from "./ChartView";
import { WebPreview } from "./WebPreview";
import { ReportCanvas } from "./ReportCanvas";

// ── View Mode Meta ────────────────────────────────────────────────

const VIEW_MODES: { mode: WorkspaceViewMode; label: string; icon: string }[] = [
  { mode: "spreadsheet", label: "Data", icon: "📊" },
  { mode: "chart", label: "Chart", icon: "📈" },
  { mode: "report", label: "Report", icon: "📝" },
  { mode: "web_preview", label: "Preview", icon: "🌐" },
  { mode: "code", label: "Code", icon: "💻" },
];

// ── Props ─────────────────────────────────────────────────────────

interface ArtifactWorkspaceProps {
  className?: string;
}

// ── Main Component ────────────────────────────────────────────────

/**
 * Unified Artifact Workspace — the slide-out drawer that replaces both
 * ArtifactDrawer and extends CanvasOverlay. Renders any artifact type
 * as a full interactive mini-app in a responsive drawer.
 *
 * Desktop: Split view or slide-over
 * Tablet: 75% width overlay from right
 * Mobile: Bottom sheet (85vh) with drag handle
 */
export function ArtifactWorkspace({ className }: ArtifactWorkspaceProps) {
  const isOpen = useWorkspaceStore((s) => s.isOpen);
  const items = useWorkspaceStore((s) => s.items);
  const activeItemId = useWorkspaceStore((s) => s.activeItemId);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const closeAll = useWorkspaceStore((s) => s.closeAll);
  const closeArtifact = useWorkspaceStore((s) => s.closeArtifact);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);

  const activeItem = items.find((i) => i.id === activeItemId) ?? null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    },
    [closeAll],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const renderContent = () => {
    if (!activeItem) {
      return <EmptyState />;
    }

    switch (viewMode) {
      case "spreadsheet":
        if (activeItem.artifact.type === "data_table") {
          return <SpreadsheetView artifact={activeItem.artifact} />;
        }
        return <SpreadsheetView artifact={activeItem.artifact} />;
      case "chart":
        return <ChartView artifact={activeItem.artifact} />;
      case "report":
        return <ReportCanvas artifact={activeItem.artifact} />;
      case "web_preview":
        return <WebPreview artifact={activeItem.artifact} />;
      case "status_card":
      case "action_panel":
      case "slack_canvas":
      case "code":
      default:
        return <ReportCanvas artifact={activeItem.artifact} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Desktop Split View ── */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "60%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "hidden lg:flex flex-col h-full",
              "border-l border-white/[0.08]",
              "bg-gradient-to-br from-zinc-950/95 via-zinc-900/95 to-emerald-950/20",
              "backdrop-blur-2xl",
              "relative z-20",
              className,
            )}
          >
            <WorkspaceHeader
              activeItem={activeItem}
              items={items}
              activeItemId={activeItemId}
              viewMode={viewMode}
              onClose={closeAll}
              onCloseTab={closeArtifact}
              onViewModeChange={setViewMode}
              variant="desktop"
            />
            <div className="flex-1 min-h-0 overflow-hidden">
              {renderContent()}
            </div>
          </motion.div>

          {/* ── Tablet Overlay ── */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "hidden md:flex lg:hidden flex-col fixed inset-y-0 right-0 w-[75%] max-w-[600px] z-50",
              "bg-gradient-to-br from-zinc-950/98 via-zinc-900/95 to-emerald-950/30",
              "backdrop-blur-2xl",
              "border-l border-white/[0.08]",
              "shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.5)]",
              className,
            )}
          >
            <WorkspaceHeader
              activeItem={activeItem}
              items={items}
              activeItemId={activeItemId}
              viewMode={viewMode}
              onClose={closeAll}
              onCloseTab={closeArtifact}
              onViewModeChange={setViewMode}
              variant="tablet"
            />
            <div className="flex-1 min-h-0 overflow-hidden">
              {renderContent()}
            </div>
          </motion.div>

          {/* ── Tablet Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden md:block lg:hidden fixed inset-0 bg-black z-40"
            onClick={closeAll}
          />

          {/* ── Mobile Drawer ── */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "md:hidden fixed inset-x-0 bottom-0 z-50",
              "h-[92vh] rounded-t-2xl",
              "bg-gradient-to-br from-zinc-950/99 via-zinc-900/98 to-emerald-950/30",
              "backdrop-blur-2xl",
              "border-t border-white/[0.08]",
              "shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.5)]",
              "flex flex-col",
              className,
            )}
          >
            <MobileDragHandle onClose={closeAll} />
            <WorkspaceHeader
              activeItem={activeItem}
              items={items}
              activeItemId={activeItemId}
              viewMode={viewMode}
              onClose={closeAll}
              onCloseTab={closeArtifact}
              onViewModeChange={setViewMode}
              variant="mobile"
            />
            <div className="flex-1 min-h-0 overflow-hidden">
              {renderContent()}
            </div>
          </motion.div>

          {/* ── Mobile Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed inset-0 bg-black z-40"
            onClick={closeAll}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// ── Header ────────────────────────────────────────────────────────

function WorkspaceHeader({
  activeItem,
  items,
  activeItemId,
  viewMode,
  onClose,
  onCloseTab,
  onViewModeChange,
  variant,
}: {
  activeItem: import("@/lib/stores/workspace-store").WorkspaceItem | null;
  items: import("@/lib/stores/workspace-store").WorkspaceItem[];
  activeItemId: string | null;
  viewMode: WorkspaceViewMode;
  onClose: () => void;
  onCloseTab: (id: string) => void;
  onViewModeChange: (mode: WorkspaceViewMode) => void;
  variant: "desktop" | "tablet" | "mobile";
}) {
  const isMobile = variant === "mobile";

  return (
    <div className={cn("flex flex-col border-b border-white/[0.06]", isMobile && "pt-1")}>
      {/* Top bar */}
      <div className={cn("flex items-center justify-between px-4 py-2.5", isMobile && "px-5 py-3")}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
          <h2 className="text-sm font-semibold text-zinc-100 truncate">
            {activeItem?.title ?? "Workspace"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "flex items-center justify-center size-7 rounded-lg shrink-0",
            "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]",
            "transition-all duration-150",
          )}
          aria-label="Close workspace"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Item tabs (when multiple items are open) */}
      {items.length > 1 && (
        <div className="flex items-center gap-0.5 px-3 pb-1 overflow-x-auto scrollbar-none">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                // Activate this item
                useWorkspaceStore.setState({ activeItemId: item.id, viewMode: item.viewMode });
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-md text-[11px] font-medium whitespace-nowrap transition-all",
                "border border-transparent",
                item.id === activeItemId
                  ? "bg-white/[0.04] border-white/[0.08] border-b-transparent text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]",
              )}
            >
              <span className="text-[10px]">
                {item.viewMode === "spreadsheet" ? "📊" :
                 item.viewMode === "chart" ? "📈" :
                 item.viewMode === "web_preview" ? "🌐" : "📝"}
              </span>
              <span className="truncate max-w-[100px]">{item.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(item.id);
                }}
                className="ml-0.5 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X className="size-2.5" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* View mode switcher */}
      <div className="flex items-center gap-0.5 px-3 pb-2 overflow-x-auto scrollbar-none">
        {VIEW_MODES.map((vm) => (
          <button
            key={vm.mode}
            type="button"
            onClick={() => onViewModeChange(vm.mode)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap",
              viewMode === vm.mode
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] border border-transparent",
            )}
          >
            <span>{vm.icon}</span>
            <span className="hidden sm:inline">{vm.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Mobile Drag Handle ────────────────────────────────────────────

function MobileDragHandle({ onClose }: { onClose: () => void }) {
  const startY = React.useRef(0);
  const handleRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientY - startY.current;
      if (delta > 60) onClose();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onClose]);

  return (
    <div
      ref={handleRef}
      className="flex justify-center py-2.5 cursor-grab active:cursor-grabbing shrink-0"
    >
      <GripHorizontal className="size-5 text-zinc-600" />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <PanelRight className="size-5 text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-500">No artifact selected</p>
        <p className="text-xs text-zinc-600 max-w-[240px]">
          Click &ldquo;Expand&rdquo; on any artifact in the chat to open it here.
        </p>
      </div>
    </div>
  );
}

// ── Loading State ─────────────────────────────────────────────────

export function WorkspaceLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 rounded-full bg-emerald-400/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-xs text-zinc-500">Loading…</span>
      </div>
    </div>
  );
}

export default ArtifactWorkspace;
