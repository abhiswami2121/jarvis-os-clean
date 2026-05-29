"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "motion/react";
import { FileText, Copy, Check, ExternalLink, ChevronRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { DocumentMeta } from "@/lib/documents-source";

/* ─── TOC item ─── */

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/* ─── Props ─── */

interface MarkdownViewerProps {
  document: DocumentMeta;
  content: string;
  loading?: boolean;
  className?: string;
}

/* ─── Component ─── */

export function MarkdownViewer({ document, content, loading, className }: MarkdownViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  /* ─── Extract TOC from headings ─── */
  const toc = useMemo(() => {
    const items: TocItem[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[`*_~\[\]()]/g, "").trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        items.push({ id, text, level });
      }
    }
    return items;
  }, [content]);

  /* ─── IntersectionObserver for TOC highlighting ─── */
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px", threshold: 0 }
    );

    for (const item of toc) {
      const el = contentRef.current.querySelector(`#${item.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [toc, content]);

  /* ─── Copy handlers ─── */
  const handleCopyBlock = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedBlock(text.slice(0, 40));
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(content);
    setCopiedBlock("__all__");
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  /* ─── Open in chat handler ─── */
  const handleOpenInChat = () => {
    const cid =
      typeof window !== "undefined"
        ? sessionStorage.getItem("jarvis-os:cid:v1")
        : null;
    const target = cid ? `/chat/${cid}` : "/chat";
    // Store document context for the chat to pick up
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "jarvis-os:doc-context",
        JSON.stringify({ title: document.title, path: document.path, content })
      );
    }
    window.open(target, "_blank");
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <Loader2 className="size-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full", className)}>
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-y-auto" ref={contentRef}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#08080f]/95 backdrop-blur-sm border-b border-white/[0.04] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1">
                <span>{document.source === "base44" ? "Base44" : "VPS"}</span>
                <ChevronRight className="size-3" />
                <span>{document.type.toUpperCase()}</span>
                <ChevronRight className="size-3" />
                <span className="text-zinc-400 truncate">{document.title}</span>
              </div>
              <h1 className="text-lg font-semibold text-zinc-100 truncate">
                {document.title}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                <span>{document.path}</span>
                {document.size > 0 && (
                  <>
                    <span>·</span>
                    <span>{formatSize(document.size)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleOpenInChat}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <ExternalLink className="size-3" />
                Open in chat
              </button>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.08] transition-colors"
              >
                {copiedBlock === "__all__" ? (
                  <Check className="size-3 text-emerald-400" />
                ) : (
                  <Copy className="size-3" />
                )}
                Copy all
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 max-w-3xl">
          <article className="prose prose-invert prose-zinc max-w-none
            prose-headings:text-zinc-100
            prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-emerald-500/30 prose-h1:pb-2 prose-h1:mb-6
            prose-h2:text-xl prose-h2:font-semibold prose-h2:border-b prose-h2:border-emerald-500/20 prose-h2:pb-1.5 prose-h2:mb-4 prose-h2:mt-8
            prose-h3:text-lg prose-h3:font-medium prose-h3:text-emerald-300 prose-h3:mt-6
            prose-p:text-zinc-300 prose-p:leading-relaxed
            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-zinc-100
            prose-code:text-emerald-300 prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-xl
            prose-blockquote:border-l-2 prose-blockquote:border-emerald-500/40 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-zinc-400
            prose-table:border-separate prose-table:border-spacing-0 prose-table:w-full
            prose-th:border-b prose-th:border-white/[0.08] prose-th:bg-white/[0.02] prose-th:px-4 prose-th:py-2 prose-th:text-xs prose-th:font-semibold prose-th:text-zinc-300 prose-th:text-left
            prose-td:border-b prose-td:border-white/[0.04] prose-td:px-4 prose-td:py-2 prose-td:text-sm prose-td:text-zinc-400
            prose-li:text-zinc-300
            prose-hr:border-white/[0.06]
            prose-img:rounded-lg
          ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Code blocks with copy button
                pre: ({ children, ...props }) => {
                  const child = React.isValidElement(children)
                    ? children
                    : null;
                  const codeText =
                    child && "props" in child
                      ? String((child.props as any).children || "")
                      : "";
                  const language =
                    child && "props" in child
                      ? ((child.props as any).className || "").replace(
                          "language-",
                          ""
                        )
                      : "";
                  const lines = codeText.split("\n").length;

                  return (
                    <div className="group relative my-4">
                      {/* Header */}
                      <div className="flex items-center justify-between rounded-t-xl bg-white/[0.04] border border-b-0 border-white/[0.06] px-4 py-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          {language || "code"}
                        </span>
                        <div className="flex items-center gap-2">
                          {lines > 1 && (
                            <span className="text-[10px] text-zinc-600">
                              {lines} lines
                            </span>
                          )}
                          <button
                            onClick={() => handleCopyBlock(codeText)}
                            className="flex items-center gap-1 rounded p-1 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
                          >
                            {copiedBlock === codeText.slice(0, 40) ? (
                              <>
                                <Check className="size-3 text-emerald-400" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      {/* Code */}
                      <pre
                        {...props}
                        className="!mt-0 !rounded-t-none !bg-white/[0.02] !border !border-white/[0.06] max-h-96 overflow-auto"
                      >
                        {children}
                      </pre>
                    </div>
                  );
                },
                // Inline code
                code: ({ children, className, ...props }) => {
                  const isBlock = className?.startsWith("language-");
                  if (isBlock) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Links with external icon
                a: ({ children, href, ...props }) => {
                  const isExternal =
                    href?.startsWith("http") && !href?.includes("jarvis-os");
                  return (
                    <a
                      href={href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="text-emerald-400 no-underline hover:underline inline-flex items-center gap-1"
                      {...props}
                    >
                      {children}
                      {isExternal && <ExternalLink className="size-3" />}
                    </a>
                  );
                },
                // Tables with sticky headers
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-4 rounded-lg border border-white/[0.06]">
                    <table className="w-full" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children, ...props }) => (
                  <thead className="sticky top-0 z-[5]" {...props}>
                    {children}
                  </thead>
                ),
                // Headings with IDs for TOC
                h1: ({ children, ...props }) => {
                  const text = extractText(children);
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  return (
                    <h1 id={id} {...props}>
                      {children}
                    </h1>
                  );
                },
                h2: ({ children, ...props }) => {
                  const text = extractText(children);
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  );
                },
                h3: ({ children, ...props }) => {
                  const text = extractText(children);
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      {/* Right rail — TOC */}
      {toc.length > 3 && (
        <aside className="hidden xl:block w-56 flex-shrink-0 overflow-y-auto border-l border-white/[0.04] px-4 py-6">
          <div className="sticky top-6">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-3">
              On this page
            </h4>
            <nav className="space-y-0.5">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    "block text-xs py-1 transition-colors border-l-2",
                    item.level === 1 ? "pl-2" : item.level === 2 ? "pl-4" : "pl-6",
                    activeSection === item.id
                      ? "text-emerald-300 border-emerald-400"
                      : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-600"
                  )}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node) && "props" in node) {
    return extractText((node.props as any).children);
  }
  return "";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
