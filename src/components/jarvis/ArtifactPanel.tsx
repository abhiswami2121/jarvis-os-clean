"use client";

import { useState, useCallback } from "react";
import { X, Copy, Download, FileText, Code, Database, ChevronRight, ExternalLink, History, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useArtifactStore, type ArtifactRevision } from "@/stores/artifactStore";
import { ArtifactRenderer } from "@/components/canvas/ArtifactRenderer";

// ── Artifact type icon mapping ─────────────────────────────────────

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

// ── Panel ──────────────────────────────────────────────────────────

export function ArtifactPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { current: storeCurrent, history, selectRevision, tabs, pinnedIds, activeTabId, switchTab: switchTabAction, closeTab, pinTab, unpinTab } = useArtifactStore();
  // Multi-tab: derive current from activeTabId if set, else fall back to storeCurrent
  const current = activeTabId ? (history.find((h) => h.id === activeTabId) || storeCurrent) : storeCurrent;
  const [showHistory, setShowHistory] = useState(false);

  const handleCopy = useCallback(() => {
    if (!current) return;
    const text = current.content ?? JSON.stringify(current, null, 2);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => toast.success("Copied!", { duration: 2000 }),
        () => toast.error("Copy failed")
      );
    }
  }, [current]);

  const handleDownload = useCallback(() => {
    if (!current) return;
    const ext = current.type === "code" ? "zip" : current.type === "data" ? "csv" : "md";
    const mimeMap: Record<string, string> = { md: "text/markdown", csv: "text/csv", zip: "application/zip" };
    let content: string | Blob;

    if (current.type === "data" && current.columns && current.rows) {
      const header = current.columns.map((c) => c.label).join(",");
      const body = current.rows.map((row) =>
        current.columns!.map((c) => String(row[c.key] ?? "")).join(",")
      ).join("\n");
      content = new Blob([header + "\n" + body], { type: "text/csv" });
    } else {
      content = new Blob([current.content || JSON.stringify(current, null, 2)], {
        type: mimeMap[ext] || "text/plain",
      });
    }

    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(current.title || "artifact").replace(/\s+/g, "_").slice(0, 40)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  }, [current]);

  if (!current && open) {
    // Panel is open but no artifact — show empty state
    return (
      <AnimatePresence>
        <motion.aside
          initial={{ x: 480, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 480, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="relative z-20 flex w-[480px] shrink-0 flex-col border-l border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl"
        >
          <PanelHeader title="Artifacts" count={history.length} onClose={onClose} />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/[0.06] flex items-center justify-center">
                <FileText className="size-5 text-purple-400" />
              </div>
              <p className="text-sm font-medium text-zinc-200">No artifact selected</p>
              <p className="text-xs text-zinc-500">Ask Jarvis to create something or select from history.</p>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>
    );
  }

  if (!open) return null;

  const TypeIcon = TYPE_ICONS[current!.type] || FileText;
  const typeLabel = TYPE_LABELS[current!.type] || "Artifact";
  const typeColor = TYPE_COLORS[current!.type] || "text-purple-400";
  const timestamp = new Date(current!.createdAt).toLocaleString();

  // Build ArtifactData for the renderer
  const artifactData = {
    type: current!.type,
    content: current!.content,
    files: current!.files,
    columns: current!.columns,
    rows: current!.rows,
    totalRows: current!.totalRows,
    src: current!.src,
    title: current!.title,
  };

  return (
    <motion.aside
      key="artifact-panel"
      initial={{ x: 480, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 480, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="relative z-20 flex w-[520px] shrink-0 flex-col border-l border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl"
      data-artifact-panel="true"
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between px-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon className={`size-4 shrink-0 ${typeColor}`} />
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{typeLabel}</span>
          <span className="text-[10px] text-zinc-600">· {history.length} revision{history.length !== 1 ? "s" : ""}</span>
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
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Artifact title + metadata */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h2 className="text-sm font-semibold text-zinc-100 truncate">{current!.title}</h2>
        <p className="text-[10px] text-zinc-600 mt-0.5">Created {timestamp}</p>
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
              <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">Revisions</div>
              {history.map((rev) => {
                const RevIcon = TYPE_ICONS[rev.type] || FileText;
                const revColor = TYPE_COLORS[rev.type] || "text-zinc-500";
                const isActive = rev.id === current!.id;
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

      {/* Main content — rendered via ArtifactRenderer */}
      <div className="flex-1 overflow-y-auto">
        <ArtifactRenderer artifact={artifactData} />
      </div>
    </motion.aside>
  );
}

// ── Header (used for empty state too) ──────────────────────────────

function PanelHeader({ title, count, onClose }: { title: string; count: number; onClose: () => void }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between px-4 border-b border-white/[0.04]">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-purple-400" />
        <span className="text-sm font-semibold">{title}</span>
        {count > 0 && <span className="text-[10px] text-zinc-500">· {count} item{count !== 1 ? "s" : ""}</span>}
      </div>
      <button
        onClick={onClose}
        className="flex size-7 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export default ArtifactPanel;
