"use client";

import React, { useMemo } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/lib/artifacts/types";

// ── Props ─────────────────────────────────────────────────────────

interface ReportCanvasProps {
  artifact: Artifact;
  className?: string;
}

// ── Simple Markdown-to-HTML renderer ──────────────────────────────

function simpleMarkdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-zinc-100 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-zinc-100 mt-8 mb-3 border-b border-white/[0.06] pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-zinc-50 mt-8 mb-4">$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-200">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/[0.06] text-emerald-300 text-xs font-mono">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-emerald-400 hover:text-emerald-300 underline">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-6 border-white/[0.06]" />')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-emerald-500/30 pl-4 my-3 text-zinc-400 text-sm">$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="text-sm text-zinc-300 ml-4 list-disc">$1</li>')
    // Ordered lists (simple)
    .replace(/^\d+\. (.+)$/gm, '<li class="text-sm text-zinc-300 ml-4 list-decimal">$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="text-sm text-zinc-300 leading-relaxed my-2">')
    // Single newlines → <br />
    .replace(/\n/g, '<br />');

  return `<p class="text-sm text-zinc-300 leading-relaxed my-2">${html}</p>`;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Notion-like report canvas. Takes artifact data and renders it as
 * a rich document. For Slack canvas artifacts, renders the markdown
 * preview. For other artifacts, builds a structured report.
 */
export function ReportCanvas({ artifact, className }: ReportCanvasProps) {
  const html = useMemo(() => {
    // Slack canvas → render markdown preview
    if (artifact.type === "slack_canvas" && "markdown_preview" in artifact && artifact.markdown_preview) {
      return simpleMarkdownToHtml(artifact.markdown_preview);
    }

    // Error recovery → structured error report
    if (artifact.type === "error_recovery") {
      const err = artifact as any;
      const lines = [
        `# ${err.title || "Error Recovery"}`,
        ``,
        `**Type:** ${err.errorType || "unknown"}`,
        ``,
        `**Message:** ${err.message || "No message"}`,
        ``,
        err.detail ? `**Detail:** ${err.detail}` : "",
        ``,
        err.failingTool ? `**Failing Tool:** \`${err.failingTool}\`` : "",
        ``,
        err.failureCount ? `**Failure Count:** ${err.failureCount}` : "",
      ].filter(Boolean).join("\n");
      return simpleMarkdownToHtml(lines);
    }

    // Generic artifact → build a structured JSON report
    const title = "title" in artifact ? (artifact as any).title : "Report";
    const subtitle = "subtitle" in artifact ? (artifact as any).subtitle : "";
    const lines = [
      `# ${title}`,
      subtitle ? `*${subtitle}*` : "",
      ``,
      `---`,
      ``,
      `### Artifact Data`,
      "```json",
      JSON.stringify(artifact, null, 2),
      "```",
    ].filter(Boolean).join("\n");
    return simpleMarkdownToHtml(lines);
  }, [artifact]);

  // Slack canvas permalink
  const permalink = artifact.type === "slack_canvas" && "permalink" in artifact
    ? (artifact as any).permalink
    : null;

  return (
    <div className={cn("h-full overflow-auto", className)}>
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Slack canvas actions */}
        {permalink && (
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/[0.06]">
            <a
              href={permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
            >
              <ExternalLink className="size-3.5" />
              Open in Slack
            </a>
          </div>
        )}

        {/* Rendered content */}
        <div
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/[0.04] flex items-center gap-2 text-[10px] text-zinc-600">
          <FileText className="size-3" />
          <span>Generated by Jarvis OS · {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export default ReportCanvas;
