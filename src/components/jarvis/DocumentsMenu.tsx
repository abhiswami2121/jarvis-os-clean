"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Pin,
  PinOff,
  FileCode,
  BookOpen,
  FileCheck,
  ShieldCheck,
  Brain,
  FileOutput,
  Wrench,
  FileBarChart,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  listDocuments,
  searchDocuments,
  getTypeLabel,
  relativeTime,
  type DocumentMeta,
} from "@/lib/documents-source";

/* ─── Icon map ─── */

const TYPE_ICONS: Record<DocumentMeta["type"], React.ComponentType<{ className?: string }>> = {
  prd: BookOpen,
  plan: FileCheck,
  spec: FileCode,
  audit: ShieldCheck,
  memory: Brain,
  output: FileOutput,
  skill: Wrench,
  report: FileBarChart,
};

/* ─── Pinned storage ─── */

const PINNED_KEY = "jarvis-os:pinned-docs:v1";

function loadPinned(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PINNED_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePinned(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
}

/* ─── Props ─── */

interface DocumentsMenuProps {
  onSelect: (doc: DocumentMeta) => void;
  selectedId?: string | null;
  className?: string;
}

/* ─── Component ─── */

export function DocumentsMenu({ onSelect, selectedId, className }: DocumentsMenuProps) {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);

  // Load pinned on mount
  useEffect(() => {
    setPinned(loadPinned());
  }, []);

  // Load documents
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = query
          ? await searchDocuments(query)
          : await listDocuments();
        if (!cancelled) setDocs(result);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load documents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    // Debounce search
    const t = setTimeout(load, query ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const togglePin = useCallback(
    (id: string) => {
      setPinned((prev) => {
        const next = prev.includes(id)
          ? prev.filter((p) => p !== id)
          : [id, ...prev];
        savePinned(next);
        return next;
      });
    },
    []
  );

  // Group by type
  const grouped = React.useMemo(() => {
    const map = new Map<string, DocumentMeta[]>();
    for (const d of docs) {
      const key = d.type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [docs]);

  const pinnedDocs = docs.filter((d) => pinned.includes(d.id));
  const unpinnedDocs = docs.filter((d) => !pinned.includes(d.id));

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="size-4 text-emerald-400" />
          <span className="text-sm font-semibold tracking-tight">Documents</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading && docs.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-500">
            <Loader2 className="size-3.5 animate-spin" />
            Loading documents…
          </div>
        )}

        {error && (
          <div className="mx-2 mb-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-300">
            {error}
          </div>
        )}

        {!loading && docs.length === 0 && !error && (
          <div className="py-8 text-center text-xs text-zinc-500">
            {query ? "No documents match your search." : "No documents found."}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Pinned section */}
          {pinnedDocs.length > 0 && (
            <div className="mb-3">
              <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Pinned
              </div>
              {pinnedDocs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  active={doc.id === selectedId}
                  pinned
                  onSelect={() => onSelect(doc)}
                  onTogglePin={() => togglePin(doc.id)}
                />
              ))}
            </div>
          )}

          {/* Grouped by type */}
          {Array.from(grouped.entries()).map(([type, typeDocs]) => {
            const visible = typeDocs.filter((d) => !pinned.includes(d.id));
            if (visible.length === 0) return null;
            const Icon = TYPE_ICONS[type as DocumentMeta["type"]] || FileText;
            return (
              <div key={type} className="mb-3">
                <div className="flex items-center gap-1.5 px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  <Icon className="size-3" />
                  {getTypeLabel(type as DocumentMeta["type"])}
                  <span className="text-zinc-700 ml-auto">{visible.length}</span>
                </div>
                {visible.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    active={doc.id === selectedId}
                    pinned={false}
                    onSelect={() => onSelect(doc)}
                    onTogglePin={() => togglePin(doc.id)}
                  />
                ))}
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-white/[0.04] px-3 py-2.5 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>{docs.length} documents</span>
        <span className="text-zinc-600">
          {pinnedDocs.length > 0 ? `${pinnedDocs.length} pinned` : ""}
        </span>
      </div>
    </div>
  );
}

/* ─── Document Row ─── */

function DocumentRow({
  doc,
  active,
  pinned,
  onSelect,
  onTogglePin,
}: {
  doc: DocumentMeta;
  active: boolean;
  pinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  const Icon = TYPE_ICONS[doc.type] || FileText;

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onClick={onSelect}
      className={cn(
        "group relative w-full rounded-lg mb-0.5 transition-all flex items-center gap-2 px-2 py-1.5 text-left hover:bg-white/[0.04]",
        active
          ? "bg-emerald-500/[0.05] ring-1 ring-emerald-500/30"
          : ""
      )}
    >
      <Icon
        className={cn(
          "size-3.5 flex-shrink-0",
          active ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-zinc-200 truncate">
          {doc.title}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span>{relativeTime(doc.updatedAt)}</span>
          <span>·</span>
          <span>{doc.source === "base44" ? "B44" : "VPS"}</span>
          {doc.size > 0 && (
            <>
              <span>·</span>
              <span>{formatSize(doc.size)}</span>
            </>
          )}
        </div>
      </div>

      {/* Pin button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-white/10",
          pinned ? "opacity-100 text-amber-400" : "text-zinc-600"
        )}
        title={pinned ? "Unpin" : "Pin"}
      >
        {pinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
      </button>

      <ChevronRight
        className={cn(
          "size-3 flex-shrink-0 transition-all",
          active ? "text-emerald-400" : "text-zinc-700 group-hover:text-zinc-500"
        )}
      />
    </motion.button>
  );
}

/* ─── Helpers ─── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
