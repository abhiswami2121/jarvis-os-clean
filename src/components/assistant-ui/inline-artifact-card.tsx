"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, ChevronDown, ExternalLink, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * InlineArtifactCard — renders an MD artifact inline in the chat thread.
 *
 * CARDINAL: This component receives {...part} from the parent message renderer.
 * It does NOT call useAuiState(s.part) — it receives data through props.
 * It does NOT use contentVisibility:auto — it uses standard React rendering.
 *
 * Pattern: JarvisMessageRenderer passes through the part object to this component
 * as a child renderer. The part contains the artifact metadata and content.
 */

export interface InlineArtifactCardProps {
  /** The part object passed from the message renderer */
  artifactId?: string;
  title?: string;
  content?: string;
  size?: number;
  type?: string;
  /** Callback to open full document viewer */
  onOpenFull?: () => void;
  className?: string;
}

export function InlineArtifactCard({
  artifactId,
  title = "Untitled Document",
  content = "",
  size = 0,
  type = "output",
  onOpenFull,
  className,
}: InlineArtifactCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const firstChunk = content.slice(0, 800);
  const hasMore = content.length > 800;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "my-3 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
          <FileText className="size-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zinc-200 truncate">
            {title}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="uppercase tracking-wider">{type}</span>
            {size > 0 && (
              <>
                <span>·</span>
                <span>{formatSize(size)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onOpenFull && (
            <button
              onClick={onOpenFull}
              className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
              title="Open full document"
            >
              <ExternalLink className="size-3.5" />
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              expanded
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/10"
            )}
            title={expanded ? "Collapse" : "Expand"}
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="size-3.5" />
            </motion.div>
          </button>
          <button
            onClick={() => setVisible(false)}
            className="rounded-md p-1.5 text-zinc-600 hover:text-zinc-400 hover:bg-white/10 transition-colors"
            title="Hide"
          >
            <EyeOff className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 max-h-72 overflow-y-auto prose prose-invert prose-zinc max-w-none text-sm
              prose-headings:text-zinc-200
              prose-p:text-zinc-400 prose-p:leading-relaxed
              prose-code:text-emerald-300 prose-code:bg-emerald-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-lg prose-pre:max-h-48 prose-pre:overflow-auto
              prose-a:text-emerald-400
              prose-li:text-zinc-400
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {expanded ? content : firstChunk}
              </ReactMarkdown>
            </div>

            {hasMore && expanded && (
              <div className="px-4 pb-3">
                <div className="text-[10px] text-zinc-600">
                  Showing all {content.length.toLocaleString()} characters
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview */}
      {!expanded && firstChunk && (
        <div className="px-4 py-2.5">
          <div className="text-xs text-zinc-500 leading-relaxed line-clamp-2 italic">
            {firstChunk.slice(0, 200).replace(/\n/g, " ")}
            {content.length > 200 ? "…" : ""}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
