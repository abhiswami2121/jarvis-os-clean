"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

interface ReportRendererProps {
  content: string;
}

export default function ReportRenderer({ content }: ReportRendererProps) {
  return (
    <article className="prose prose-invert prose-zinc mx-auto max-w-3xl px-6 py-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Glass-styled tables
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="min-w-full text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/[0.06] bg-white/[0.02]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-zinc-300 border-t border-white/[0.02]">
              {children}
            </td>
          ),
          // Code blocks with glass styling
          pre: ({ children, ...props }) => (
            <pre
              className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-zinc-900/80 p-4 text-sm font-mono"
              {...props}
            >
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[13px] font-mono text-emerald-300"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Headings
          h1: ({ children }) => (
            <h1 className="mt-8 mb-4 text-2xl font-bold tracking-tight text-zinc-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight text-zinc-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-2 text-lg font-semibold text-zinc-200">
              {children}
            </h3>
          ),
          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-400/30 underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="my-3 list-disc pl-6 space-y-1 text-zinc-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal pl-6 space-y-1 text-zinc-300">
              {children}
            </ol>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-emerald-400/30 pl-4 italic text-zinc-400">
              {children}
            </blockquote>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-zinc-300">{children}</p>
          ),
          // Horizontal rule
          hr: () => <hr className="my-8 border-white/[0.06]" />,
          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="my-4 rounded-xl border border-white/[0.06] max-w-full"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
