"use client";

import dynamic from "next/dynamic";
import { AlertTriangle } from "lucide-react";

// Lazy-load renderers (many are heavy: shiki, markdown parsers, etc.)
const ReportRenderer = dynamic(() => import("./ReportRenderer"), { ssr: false });
const CodeRenderer = dynamic(() => import("./CodeRenderer"), { ssr: false });
const DataTableRenderer = dynamic(() => import("./DataTableRenderer"), { ssr: false });
const MiniAppRenderer = dynamic(() => import("./MiniAppRenderer"), { ssr: false });

export type ArtifactType = "report" | "code" | "data" | "mini-app" | "chart";

export interface ArtifactData {
  type: ArtifactType;
  // Report
  content?: string;       // markdown string
  // Code
  files?: { path: string; content: string; language?: string }[];
  // Data
  columns?: { key: string; label: string; sortable?: boolean }[];
  rows?: Record<string, unknown>[];
  totalRows?: number;
  // Mini-app
  src?: string;
  title?: string;
  // Chart (future)
  chartData?: unknown;
}

interface ArtifactRendererProps {
  artifact: ArtifactData;
  className?: string;
}

export function ArtifactRenderer({ artifact, className }: ArtifactRendererProps) {
  const { type, content, files, columns, rows, totalRows, src, title } = artifact;

  switch (type) {
    case "report":
      if (!content) return <EmptyState message="No report content" />;
      return (
        <div className={className}>
          <ReportRenderer content={content} />
        </div>
      );

    case "code":
      if (!files?.length) return <EmptyState message="No files to display" />;
      return (
        <div className={className}>
          <CodeRenderer files={files} />
        </div>
      );

    case "data":
      if (!columns?.length || !rows?.length) return <EmptyState message="No data to display" />;
      return (
        <div className={className}>
          <DataTableRenderer
            columns={columns}
            rows={rows}
            totalRows={totalRows}
          />
        </div>
      );

    case "mini-app":
      if (!src) return <EmptyState message="No preview URL" />;
      return (
        <div className={className}>
          <MiniAppRenderer src={src} title={title || "Preview"} />
        </div>
      );

    case "chart":
      return (
        <div className={className}>
          <EmptyState message="Chart renderer coming soon" />
        </div>
      );

    default:
      return <EmptyState message={`Unknown artifact type: ${type}`} />;
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-400/5 ring-1 ring-amber-400/10">
        <AlertTriangle className="size-5 text-amber-400/60" />
      </div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export default ArtifactRenderer;
