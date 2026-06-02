"use client";

import React, { useState, useMemo } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { FileEdit, FilePlus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────

interface FileDiffArgs {
  path?: string;
  old_string?: string;
  new_string?: string;
  tool_id?: string;
  op?: "edit" | "create" | "delete";
}

// ── Simple unified diff generator ──────────────────────────────────

function generateSimpleDiff(
  oldStr: string,
  newStr: string
): { type: "removed" | "added" | "unchanged"; text: string }[] {
  if (!oldStr && !newStr) return [];

  // If no old string, all lines are added
  if (!oldStr) {
    return newStr.split("\n").map((line) => ({ type: "added" as const, text: line }));
  }
  // If no new string, all lines are removed
  if (!newStr) {
    return oldStr.split("\n").map((line) => ({ type: "removed" as const, text: line }));
  }

  // Simple line-by-line diff: show context around changes
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");
  const result: { type: "removed" | "added" | "unchanged"; text: string }[] = [];

  // If they're the same length, try line-by-line comparison
  if (oldLines.length === newLines.length) {
    for (let i = 0; i < oldLines.length; i++) {
      if (oldLines[i] !== newLines[i]) {
        result.push({ type: "removed", text: oldLines[i] });
        result.push({ type: "added", text: newLines[i] });
      } else {
        result.push({ type: "unchanged", text: oldLines[i] });
      }
    }
  } else {
    // Different lengths — show removed lines first, then added
    for (const line of oldLines) {
      if (!newLines.includes(line)) {
        result.push({ type: "removed", text: line });
      } else {
        result.push({ type: "unchanged", text: line });
      }
    }
    for (const line of newLines) {
      if (!oldLines.includes(line)) {
        result.push({ type: "added", text: line });
      }
    }
  }

  return result;
}

// ── File name from path ────────────────────────────────────────────

function basename(p: string): string {
  const parts = p.split("/");
  return parts[parts.length - 1] || p;
}

// ── Tool UI ────────────────────────────────────────────────────────

export const FileDiffCard = makeAssistantToolUI<FileDiffArgs, { ok?: boolean }>({
  toolName: "file_edited",
  render: ({ args }) => {
    const [expanded, setExpanded] = useState(false);

    const op = args.op || "edit";
    const path = args.path || "";
    const fileName = basename(path);
    const oldStr = args.old_string || "";
    const newStr = args.new_string || "";

    const diffLines = useMemo(
      () => generateSimpleDiff(oldStr, newStr),
      [oldStr, newStr]
    );

    const totalLines = diffLines.length;
    const shouldCollapse = !expanded && totalLines > 12;

    // Op config
    const OpIcon = op === "create" ? FilePlus : op === "delete" ? Trash2 : FileEdit;
    const opLabel = op === "create" ? "created" : op === "delete" ? "deleted" : "edited";
    const opColor =
      op === "create"
        ? "border-emerald-500/40 bg-emerald-500/10"
        : op === "delete"
          ? "border-red-500/40 bg-red-500/10"
          : "border-amber-500/30 bg-amber-500/10";

    return (
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="my-2"
      >
        <div className={`relative overflow-hidden rounded-xl border ${opColor} backdrop-blur-sm shadow-[0_4px_24px_-12px_rgba(0,0,0,0.3)]`}>
          {/* Header: op badge + file path */}
          <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.04]">
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
              op === "create"
                ? "bg-emerald-500/20 text-emerald-400"
                : op === "delete"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
            }`}>
              <OpIcon className="size-3" />
              {opLabel}
            </span>
            <code className="flex-1 min-w-0 text-xs font-mono text-zinc-300 truncate">
              {fileName}
            </code>
            {path && path !== fileName && (
              <span className="hidden sm:inline text-[10px] text-zinc-600 font-mono truncate max-w-[160px]">
                {path}
              </span>
            )}
          </div>

          {/* Diff content */}
          {diffLines.length > 0 && (
            <>
              <div className={`relative overflow-hidden ${shouldCollapse ? "max-h-52" : ""}`}>
                <div className="overflow-x-auto">
                  <pre className="px-0 py-0 text-[11px] font-mono leading-relaxed">
                    {diffLines.map((line, i) => (
                      <div
                        key={i}
                        className={`px-3.5 py-0.5 whitespace-pre ${
                          line.type === "removed"
                            ? "bg-red-500/10 text-red-300/80"
                            : line.type === "added"
                              ? "bg-emerald-500/10 text-emerald-300/80"
                              : "text-zinc-500/80"
                        }`}
                      >
                        <span className="select-none mr-2 text-zinc-700 w-4 inline-block">
                          {line.type === "removed" ? "-" : line.type === "added" ? "+" : " "}
                        </span>
                        {line.text}
                      </div>
                    ))}
                  </pre>
                </div>

                {/* Fade when collapsed */}
                {shouldCollapse && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-900/95 via-zinc-900/50 to-transparent pointer-events-none" />
                )}
              </div>

              {/* Expand toggle */}
              {totalLines > 12 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 w-full px-3.5 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-colors border-t border-white/[0.03]"
                >
                  {expanded ? (
                    <>
                      <ChevronDown className="size-3" />
                      Collapse diff
                    </>
                  ) : (
                    <>
                      <ChevronRight className="size-3" />
                      Show full diff ({totalLines} lines)
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {/* Empty state */}
          {diffLines.length === 0 && (
            <div className="px-3.5 py-2.5 text-[11px] text-zinc-600 font-mono">
              (no content change)
            </div>
          )}
        </div>
      </motion.div>
    );
  },
});

export default FileDiffCard;
