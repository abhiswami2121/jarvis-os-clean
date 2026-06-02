"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ExternalLink, Trash2, Clock, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────
interface MvpEntry {
  slug: string;
  title?: string;
  status?: string;
  previewUrl?: string;
  deployedUrl?: string;
  created_at?: string;
  last_updated?: string;
  plan?: { title?: string; description?: string };
}

// ─── Status icon ──────────────────────────────────────────────────
function StatusDot({ status }: { status?: string }) {
  const icon: Record<string, React.ReactNode> = {
    verified: <CheckCircle2 className="size-3.5 text-emerald-400" />,
    deployed: <CheckCircle2 className="size-3.5 text-emerald-400" />,
    preview_ready: <Sparkles className="size-3.5 text-amber-400" />,
    generated: <Sparkles className="size-3.5 text-amber-400" />,
    planned: <Sparkles className="size-3.5 text-zinc-400" />,
    error: <AlertCircle className="size-3.5 text-red-400" />,
    creating: <Clock className="size-3.5 text-zinc-500 animate-pulse" />,
  };

  const label: Record<string, string> = {
    verified: "Live",
    deployed: "Deployed",
    preview_ready: "Preview",
    generated: "Generated",
    planned: "Planned",
    error: "Error",
    creating: "Creating",
  };

  const s = status || "creating";
  return (
    <div className="flex items-center gap-1.5">
      {icon[s] || <Clock className="size-3.5 text-zinc-500" />}
      <span className="text-[10px] text-zinc-500">{label[s] || s}</span>
    </div>
  );
}

// ─── MyMvpsDrawer ─────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MyMvpsDrawer({ open, onClose }: Props) {
  const [mvps, setMvps] = useState<MvpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchMvps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/mvp/list");
      if (!res.ok) {
        setError(`Failed to load MVPs (${res.status})`);
        return;
      }
      const data = await res.json();
      setMvps(data.mvps || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load MVPs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMvps();
    }
  }, [open, fetchMvps]);

  const handleDelete = useCallback(
    async (slug: string) => {
      if (!confirm(`Delete sandbox "${slug}"? This cannot be undone.`)) return;
      setDeleting(slug);
      try {
        const res = await fetch(`/api/mvp/${encodeURIComponent(slug)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setMvps((prev) => prev.filter((m) => m.slug !== slug));
        } else {
          alert(`Delete failed: ${res.status}`);
        }
      } catch (err: any) {
        alert(`Delete error: ${err?.message}`);
      } finally {
        setDeleting(null);
      }
    },
    []
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col border-l border-white/[0.05] bg-[#0b0d13] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
            <div>
              <h2 className="text-base font-medium text-zinc-200">My MVPs</h2>
              <p className="mt-0.5 text-xs text-zinc-600">
                Your generated sandbox applications
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-2.5 text-sm text-zinc-500">
                  <div className="size-4 rounded-md bg-white/[0.04] animate-pulse" />
                  Loading MVPs…
                </div>
              </div>
            )}

            {error && (
              <div className="m-6 rounded-xl border border-red-500/20 bg-red-500/[0.02] p-4 text-center">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={fetchMvps}
                  className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-300 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && mvps.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.01]">
                  <Sparkles className="size-5 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500">No MVPs yet</p>
                <p className="mt-1 text-xs text-zinc-700">
                  Type &quot;build me a form&quot; in chat to create your first MVP.
                </p>
              </div>
            )}

            {!loading && !error && mvps.length > 0 && (
              <div className="divide-y divide-white/[0.03]">
                {mvps.map((mvp) => (
                  <div
                    key={mvp.slug}
                    className="px-6 py-4 hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/sandbox/${mvp.slug}`}
                          className="text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors truncate block"
                        >
                          {mvp.title || mvp.plan?.title || mvp.slug}
                        </Link>
                        {mvp.plan?.description && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-600">
                            {mvp.plan.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <StatusDot status={mvp.status} />
                          {mvp.deployedUrl && (
                            <a
                              href={mvp.deployedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                              <ExternalLink className="size-3" />
                              Live
                            </a>
                          )}
                          {mvp.previewUrl && !mvp.deployedUrl && (
                            <a
                              href={mvp.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 transition-colors"
                            >
                              <ExternalLink className="size-3" />
                              Preview
                            </a>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(mvp.slug)}
                        disabled={deleting === mvp.slug}
                        className="ml-3 rounded-lg p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                        title="Delete sandbox"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3">
            <button
              onClick={fetchMvps}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Refresh list
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
