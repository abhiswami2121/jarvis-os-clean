"use client";

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FileEdit, FilePlus, Trash2, ChevronDown, ChevronRight, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

export interface FileEditCardProps {
  toolName?: string;
  args?: {
    path?: string;
    file_path?: string;
    old_string?: string;
    new_string?: string;
    tool_id?: string;
    op?: "edit" | "create" | "delete";
    old_str?: string;
    new_str?: string;
    content?: string;
  };
  argsText?: string;
  result?: any;
  status?: { type: string } | string;
  toolCallId?: string;
}

// ── Diff generator ─────────────────────────────────────────────────

function generateSimpleDiff(
  oldStr: string,
  newStr: string,
): { type: "removed" | "added" | "unchanged"; text: string }[] {
  if (!oldStr && !newStr) return [];
  if (!oldStr) return newStr.split("\n").map((line) => ({ type: "added" as const, text: line }));
  if (!newStr) return oldStr.split("\n").map((line) => ({ type: "removed" as const, text: line }));

  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");
  const result: { type: "removed" | "added" | "unchanged"; text: string }[] = [];

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
    for (const line of oldLines) {
      if (!newLines.includes(line)) result.push({ type: "removed", text: line });
      else result.push({ type: "unchanged", text: line });
    }
    for (const line of newLines) {
      if (!oldLines.includes(line)) result.push({ type: "added", text: line });
    }
  }
  return result;
}

// ── Filename extraction ────────────────────────────────────────────

function basename(p: string): string {
  return p.split("/").pop() || p;
}

// ── Line range ─────────────────────────────────────────────────────

function lineRange(oldStr: string, newStr: string): string {
  const oldLen = (oldStr || "").split("\n").length;
  const newLen = (newStr || "").split("\n").length;
  if    (oldLen > 0 && newLen > 0) return `L1-L${oldLen} → L1-L${newLen}`;
  else if (oldLen > 0) return `L1-L${oldLen}`;
  else if (newLen > 0) return `L1-L${newLen}`;
  return "";
}

// ── Component ──────────────────────────────────────────────────────

export function FileEditCard({ args }: FileEditCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const op = args?.op || "edit";
  const path = args?.path || args?.file_path || "";
  const fileName = basename(path);
  const oldStr = args?.old_string || args?.old_str || "";
  const newStr = args?.new_string || args?.new_str || args?.content || "";

  const diffLines = useMemo(() => generateSimpleDiff(oldStr, newStr), [oldStr, newStr]);

  const totalLines = diffLines.length;
  const shouldCollapse = !expanded && totalLines > 12;

  const OpIcon = op === "create" ? FilePlus : op === "delete" ? Trash2 : FileEdit;
  const opLabel = op === "create" ? "created" : op === "delete" ? "deleted" : "edited";
  const opBadgeColor =
    op === "create"
      ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30"
      : op === "delete"
        ? "bg-red-500/20 text-red-400 ring-red-500/30"
        : "bg-blue-500/20 text-blue-400 ring-blue-500/30";

  const handleCopy = async () => {
    try {
      const text = oldStr ? `- ${oldStr.split("\n").join("\n- ")}\n+ ${newStr.split("\n").join("\n+ ")}` : newStr;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const lr = lineRange(oldStr, newStr);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="my-2"
    >
      <div
        className={cn(
          "jc-card jc-file-edit relative overflow-hidden rounded-xl",
          "bg-[#0a0a0f]/80 border border-zinc-700/40",
          "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)]",
          "border-l-4",
          op === "create"
            ? "border-l-[#22c55e]"
            : op === "delete"
              ? "border-l-[#ef4444]"
              : "border-l-[#3b82f6]",
        )}
      >
        {/* Header */}
        <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.04]">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ring-1",
              opBadgeColor,
            )}
          >
            <OpIcon className="size-3" />
            {opLabel}
          </span>

          <code className="flex-1 min-w-0 text-xs font-mono text-zinc-300 truncate">
            {fileName}
          </code>

          {lr && (
            <span className="text-[10px] font-mono text-zinc-600 whitespace-nowrap">
              {lr}
            </span>
          )}

          {/* Copy button */}
          {(oldStr || newStr) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="shrink-0 p-1 rounded hover:bg-white/[0.06] transition-colors"
              aria-label="Copy diff"
            >
              {copied ? (
                <CheckCheck className="size-3 text-emerald-400" />
              ) : (
                <Copy className="size-3 text-zinc-600 hover:text-zinc-400" />
              )}
            </button>
          )}
        </div>

        {/* Path display */}
        {path && path !== fileName && (
          <div className="px-3.5 py-1 text-[10px] font-mono text-zinc-600 border-b border-white/[0.02] truncate">
            {path}
          </div>
        )}

        {/* Diff content */}
        {diffLines.length > 0 && (
          <>
            <div className={cn("relative overflow-hidden", shouldCollapse ? "max-h-64" : "")}>
              <div className="overflow-x-auto">
                <pre className="px-0 py-0 text-[11px] font-mono leading-relaxed">
                  {diffLines.map((line, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-3.5 py-0.5 whitespace-pre flex",
                        line.type === "removed"
                          ? "bg-red-500/[0.08]"
                          : line.type === "added"
                            ? "bg-emerald-500/[0.08]"
                            : "",
                      )}
                    >
                      <span
                        className={cn(
                          "select-none mr-2 w-5 inline-block text-center flex-shrink-0",
                          line.type === "removed"
                            ? "text-red-500"
                            : line.type === "added"
                              ? "text-emerald-500"
                              : "text-zinc-700",
                        )}
                      >
                        {line.type === "removed" ? "-" : line.type === "added" ? "+" : " "}
                      </span>
                      <span
                        className={cn(
                          line.type === "removed"
                            ? "text-red-300/80 line-through"
                            : line.type === "added"
                              ? "text-emerald-300/80"
                              : "text-zinc-500/80",
                        )}
                      >
                        {line.text}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>

              {shouldCollapse && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0f]/95 via-[#0a0a0f]/50 to-transparent pointer-events-none" />
              )}
            </div>

            {totalLines > 12 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 w-full px-3.5 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-colors border-t border-white/[0.03] cursor-pointer"
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

        {diffLines.length === 0 && (
          <div className="px-3.5 py-2.5 text-[11px] text-zinc-600 font-mono">
            (no content change)
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default FileEditCard;
