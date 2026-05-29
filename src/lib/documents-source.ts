"use client";

/**
 * Unified documents data source for Jarvis-OS.
 * Fetches from:
 *   - Base44 JarvisFile entities (via /api/jarvis-proxy/files)
 *   - VPS-generated artifacts (via /api/vps-files)
 *
 * Count-first discipline: always verify totals before rendering.
 */

export interface DocumentMeta {
  id: string;
  title: string;
  path: string;
  size: number;
  updatedAt: string;
  type: "prd" | "plan" | "spec" | "audit" | "memory" | "output" | "skill" | "report";
  source: "base44" | "vps";
}

export interface DocumentContent {
  meta: DocumentMeta;
  content: string;
}

interface Base44FileResponse {
  documents: DocumentMeta[];
}

interface VpsFileResponse {
  documents: DocumentMeta[];
}

/* ─── Fetch helpers ─── */

async function fetchBase44Documents(): Promise<DocumentMeta[]> {
  const res = await fetch("/api/jarvis-proxy/files");
  if (!res.ok) {
    console.warn("[documents-source] Base44 proxy returned", res.status);
    return [];
  }
  const data: Base44FileResponse = await res.json();
  return data.documents || [];
}

async function fetchVpsDocuments(): Promise<DocumentMeta[]> {
  const res = await fetch("/api/vps-files");
  if (!res.ok) {
    console.warn("[documents-source] VPS files returned", res.status);
    return [];
  }
  const data: VpsFileResponse = await res.json();
  return data.documents || [];
}

/* ─── Public API ─── */

export async function listDocuments(): Promise<DocumentMeta[]> {
  const [b44, vps] = await Promise.all([
    fetchBase44Documents(),
    fetchVpsDocuments(),
  ]);
  const all = [...b44, ...vps];
  // Count-first discipline
  console.log(
    `[documents-source] Loaded ${all.length} documents (${b44.length} Base44 + ${vps.length} VPS)`
  );
  // Sort by updatedAt descending
  all.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return all;
}

export async function getDocument(id: string): Promise<DocumentContent | null> {
  // Try Base44 first
  try {
    const res = await fetch(`/api/jarvis-proxy/files?id=${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.document) return data as DocumentContent;
    }
  } catch {
    // fall through to VPS
  }

  // Try VPS
  try {
    const res = await fetch(`/api/vps-files?path=${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.document) return data as DocumentContent;
    }
  } catch {
    return null;
  }

  return null;
}

export async function searchDocuments(query: string): Promise<DocumentMeta[]> {
  const all = await listDocuments();
  const q = query.toLowerCase();
  return all.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.path.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
  );
}

/* ─── Type label helper ─── */

const TYPE_LABELS: Record<DocumentMeta["type"], string> = {
  prd: "PRD",
  plan: "Plan",
  spec: "Spec",
  audit: "Audit",
  memory: "Memory",
  output: "Output",
  skill: "Skill",
  report: "Report",
};

export function getTypeLabel(type: DocumentMeta["type"]): string {
  return TYPE_LABELS[type] || type;
}

/* ─── Relative time helper ─── */

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return RTF.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return RTF.format(-Math.floor(seconds / 3600), "hour");
  if (seconds < 604800) return RTF.format(-Math.floor(seconds / 86400), "day");
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
