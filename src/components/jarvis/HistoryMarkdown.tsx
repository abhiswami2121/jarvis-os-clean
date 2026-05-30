"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * HistoryMarkdown — self-contained markdown renderer for replayed conversation
 * history. CRITICAL: this renders OUTSIDE the assistant-ui Thread/Part scope,
 * so it must NOT use MarkdownTextPrimitive or `defaultComponents` (both call
 * useAuiState / useIsMarkdownCodeBlock and throw
 * `The current scope does not have a "part" property` on refresh).
 *
 * It uses plain react-markdown with a local component map mirroring the live
 * chat styling — zero assistant-ui hooks, zero scope dependency.
 */
const components = {
  h1: (p: any) => <h1 className="mb-2 mt-0 font-semibold text-base first:mt-0 last:mb-0" {...p} />,
  h2: (p: any) => <h2 className="mt-3 mb-1.5 font-semibold text-sm first:mt-0 last:mb-0" {...p} />,
  h3: (p: any) => <h3 className="mt-2.5 mb-1 font-semibold text-sm first:mt-0 last:mb-0" {...p} />,
  p: (p: any) => <p className="my-2.5 leading-normal first:mt-0 last:mb-0" {...p} />,
  a: (p: any) => <a className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200" target="_blank" rel="noopener noreferrer" {...p} />,
  ul: (p: any) => <ul className="my-2.5 ml-4 list-disc" {...p} />,
  ol: (p: any) => <ol className="my-2.5 ml-4 list-decimal" {...p} />,
  li: (p: any) => <li className="my-0.5" {...p} />,
  blockquote: (p: any) => <blockquote className="my-2.5 border-s-2 border-white/20 ps-3 text-zinc-400 italic" {...p} />,
  pre: ({ className, children, ...props }: any) => (
    <div className="overflow-x-auto max-w-full my-2">
      <pre
        className={cn("overflow-x-auto rounded-lg border border-zinc-700/50 bg-zinc-950 p-3 text-xs leading-relaxed", className)}
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        {...props}
      >{children}</pre>
    </div>
  ),
  code: ({ className, children, ...props }: any) => {
    const isBlock = typeof className === "string" && className.includes("language-");
    return (
      <code
        className={cn(!isBlock && "rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[0.85em]", className)}
        {...props}
      >{children}</code>
    );
  },
};

export function HistoryMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-zinc-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
