"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, GripHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/lib/stores/canvas-store";
import { useArtifactStore } from "@/stores/artifactStore";
import { CanvasFrame } from "@/components/canvas/CanvasFrame";
import { TemplateRenderer } from "@/components/canvas/TemplateRenderer";

// ── Props ───────────────────────────────────────────────────────

interface CanvasOverlayProps {
  className?: string;
}

// ── Component ───────────────────────────────────────────────────

/**
 * Responsive canvas overlay:
 * - Desktop (>1024px): Split view — chat 40% / canvas 60%
 * - Tablet (768-1024px): 75% width overlay from right with backdrop
 * - Mobile (<768px): Slide-up drawer (85vh) with drag handle
 */
export function CanvasOverlay({ className }: CanvasOverlayProps) {
  const isOpen = useCanvasStore((s) => s.isOpen);
  const templateType = useCanvasStore((s) => s.templateType);
  const canvasData = useCanvasStore((s) => s.data);
  const isLoading = useCanvasStore((s) => s.isLoading);
  const error = useCanvasStore((s) => s.error);
  const close = useCanvasStore((s) => s.close);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    },
    [close],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

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
              "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-emerald-900/20",
              "backdrop-blur-2xl",
              "relative",
              className,
            )}
          >
            <CanvasHeader />
            <div className="flex-1 overflow-hidden">
              {isLoading && <CanvasLoading />}
              {error && <CanvasError message={error} />}
              {templateType && canvasData && !isLoading && !error && (
                <CanvasFrame
                  html={TemplateRenderer({ template: templateType, data: canvasData })}
                  title={canvasData.title ?? templateType}
                />
              )}
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
              "bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-emerald-900/30",
              "backdrop-blur-2xl",
              "border-l border-white/[0.08]",
              "shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.5)]",
              className,
            )}
          >
            <CanvasHeader />
            <div className="flex-1 overflow-hidden">
              {isLoading && <CanvasLoading />}
              {error && <CanvasError message={error} />}
              {templateType && canvasData && !isLoading && !error && (
                <CanvasFrame
                  html={TemplateRenderer({ template: templateType, data: canvasData })}
                  title={canvasData.title ?? templateType}
                />
              )}
            </div>
          </motion.div>

          {/* ── Backdrop (tablet only) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden md:block lg:hidden fixed inset-0 bg-black z-40"
            onClick={close}
          />

          {/* ── Mobile Drawer ── */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "md:hidden fixed inset-x-0 bottom-0 z-50",
              "h-[85vh] rounded-t-2xl",
              "bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-emerald-900/30",
              "backdrop-blur-2xl",
              "border-t border-white/[0.08]",
              "shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.5)]",
              "flex flex-col",
              className,
            )}
          >
            <MobileDragHandle onClose={close} />
            <CanvasHeader variant="mobile" />
            <div className="flex-1 overflow-hidden">
              {isLoading && <CanvasLoading />}
              {error && <CanvasError message={error} />}
              {templateType && canvasData && !isLoading && !error && (
                <CanvasFrame
                  html={TemplateRenderer({ template: templateType, data: canvasData })}
                  title={canvasData.title ?? templateType}
                />
              )}
            </div>
          </motion.div>

          {/* ── Mobile backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed inset-0 bg-black z-40"
            onClick={close}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// ── Header ──────────────────────────────────────────────────────

function CanvasHeader({ variant }: { variant?: "mobile" }) {
  const canvasData = useCanvasStore((s) => s.data);
  const close = useCanvasStore((s) => s.close);
  const currentRevision = useArtifactStore((s) => s.current);
  const history = useArtifactStore((s) => s.history);

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-white/[0.06]",
        variant === "mobile" && "px-5 pt-4 pb-3",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-3 w-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
        <span className="text-sm font-medium text-zinc-200 truncate">
          {canvasData?.title ?? "Canvas"}
        </span>
        {currentRevision && history.length > 1 && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => {
                const idx = history.findIndex((r) => r.id === currentRevision.id);
                if (idx < history.length - 1) useArtifactStore.getState().selectRevision(history[idx + 1].id);
              }}
              className="p-1 hover:bg-white/[0.06] rounded-md text-neutral-500 hover:text-white transition-colors"
              title="Previous version"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-neutral-500 font-mono tabular-nums min-w-[24px] text-center">
              v{history.length - history.findIndex((r) => r.id === currentRevision.id)}/{history.length}
            </span>
            <button
              onClick={() => {
                const idx = history.findIndex((r) => r.id === currentRevision.id);
                if (idx > 0) useArtifactStore.getState().selectRevision(history[idx - 1].id);
              }}
              className="p-1 hover:bg-white/[0.06] rounded-md text-neutral-500 hover:text-white transition-colors"
              title="Next version"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={close}
        className={cn(
          "flex items-center justify-center size-7 rounded-lg",
          "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06]",
          "transition-all duration-150",
        )}
        aria-label="Close canvas"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// ── Mobile Drag Handle ──────────────────────────────────────────

function MobileDragHandle({ onClose }: { onClose: () => void }) {
  const startY = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);

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
      className="flex justify-center py-2.5 cursor-grab active:cursor-grabbing"
    >
      <GripHorizontal className="size-5 text-zinc-600" />
    </div>
  );
}

// ── Loading State ───────────────────────────────────────────────

function CanvasLoading() {
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
        <span className="text-xs text-zinc-500">Loading canvas…</span>
      </div>
    </div>
  );
}

// ── Error State ─────────────────────────────────────────────────

function CanvasError({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <X className="size-5 text-red-400" />
        </div>
        <p className="text-sm text-red-300/80">{message}</p>
      </div>
    </div>
  );
}
