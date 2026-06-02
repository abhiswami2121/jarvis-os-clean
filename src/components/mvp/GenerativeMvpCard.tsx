"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sparkles, Monitor, Code, Rocket, CheckCircle2, XCircle, Clock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type PhaseStatus = "pending" | "running" | "complete" | "error";

interface PhaseState {
  planning: PhaseStatus;
  generating: PhaseStatus;
  previewing: PhaseStatus;
  deploying: PhaseStatus;
  verifying: PhaseStatus;
}

interface FileEntry {
  path: string;
  status: PhaseStatus;
  size?: number;
  error?: string;
}

interface MvpData {
  slug: string;
  status?: string;
  plan?: {
    title?: string;
    description?: string;
    tech_stack?: Record<string, string>;
    files?: { path: string; purpose: string }[];
    eta?: string;
  };
  previewUrl?: string;
  deployedUrl?: string;
  files?: FileEntry[];
  error?: string;
}

// ─── Status Pill ──────────────────────────────────────────────────
function StatusPill({ status }: { status: PhaseStatus }) {
  const styles: Record<PhaseStatus, string> = {
    pending: "bg-white/[0.03] text-zinc-500 border-white/[0.04]",
    running:
      "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse [animation-duration:2s]",
    complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    error: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  const icons: Record<PhaseStatus, React.ReactNode> = {
    pending: <Clock className="size-3" />,
    running: <Sparkles className="size-3" />,
    complete: <CheckCircle2 className="size-3" />,
    error: <XCircle className="size-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles[status]}`}
    >
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Phase Card ───────────────────────────────────────────────────
function PhaseCard({
  icon: Icon,
  title,
  status,
  children,
  minHeight = "min-h-[120px]",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  status: PhaseStatus;
  children?: React.ReactNode;
  minHeight?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-5 backdrop-blur-sm transition-colors ${minHeight}
        ${status === "running" ? "border-amber-500/20 bg-amber-500/[0.02]" : ""}
        ${status === "complete" ? "border-emerald-500/15 bg-emerald-500/[0.02]" : ""}
        ${status === "error" ? "border-red-500/20 bg-red-500/[0.02]" : ""}
        ${status === "pending" ? "border-white/[0.04] bg-white/[0.01]" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon className={`size-4 ${status === "running" ? "text-amber-400" : status === "complete" ? "text-emerald-400" : "text-zinc-500"}`} />
          <span className="text-sm font-medium text-zinc-300">{title}</span>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="text-sm text-zinc-400">{children}</div>
    </div>
  );
}

// ─── Planning Card ────────────────────────────────────────────────
function PlanningCard({ plan, status }: { plan?: MvpData["plan"]; status: PhaseStatus }) {
  if (status === "pending") {
    return (
      <PhaseCard icon={Sparkles} title="Planning" status="pending">
        <p>Waiting to analyze requirements and design the file structure…</p>
      </PhaseCard>
    );
  }

  if (status === "running") {
    return (
      <PhaseCard icon={Sparkles} title="Planning" status="running">
        <p>Kimi K2.6 is analyzing your request and designing the architecture…</p>
      </PhaseCard>
    );
  }

  if (!plan) {
    return (
      <PhaseCard icon={Sparkles} title="Planning" status="error">
        <p>No plan data available</p>
      </PhaseCard>
    );
  }

  return (
    <PhaseCard icon={Sparkles} title="Planning" status={status}>
      <div className="space-y-2">
        <p className="font-medium text-zinc-200">{plan.title || "Untitled MVP"}</p>
        {plan.description && (
          <p className="line-clamp-2 text-xs text-zinc-500">{plan.description}</p>
        )}
        {plan.tech_stack && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(plan.tech_stack).map(([k, v]) => (
              <span key={k} className="rounded-md bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-500">
                {k}: {v}
              </span>
            ))}
          </div>
        )}
        {plan.files && plan.files.length > 0 && (
          <div className="mt-1 text-[11px] text-zinc-600">
            {plan.files.length} file{plan.files.length > 1 ? "s" : ""} planned
            {plan.eta ? ` · ETA: ${plan.eta}` : ""}
          </div>
        )}
      </div>
    </PhaseCard>
  );
}

// ─── Generating Card ──────────────────────────────────────────────
function GeneratingCard({ files, status }: { files?: FileEntry[]; status: PhaseStatus }) {
  if (status === "pending") {
    return (
      <PhaseCard icon={Code} title="Generating" status="pending">
        <p>Waiting to generate code files…</p>
      </PhaseCard>
    );
  }

  if (status === "running") {
    return (
      <PhaseCard icon={Code} title="Generating" status="running">
        <p>DeepSeek V4 Pro is writing code files…</p>
      </PhaseCard>
    );
  }

  if (!files || files.length === 0) {
    return (
      <PhaseCard icon={Code} title="Generating" status={status}>
        <p>No files generated yet</p>
      </PhaseCard>
    );
  }

  const done = files.filter((f) => f.status === "complete").length;
  const errored = files.filter((f) => f.status === "error").length;

  return (
    <PhaseCard icon={Code} title="Generating" status={status}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            {done}/{files.length} files
          </span>
          {errored > 0 && (
            <span className="text-red-400">{errored} error{errored > 1 ? "s" : ""}</span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${files.length > 0 ? (done / files.length) * 100 : 0}%` }}
          />
        </div>
        {/* File tree */}
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {files.slice(0, 15).map((f) => (
            <div key={f.path} className="flex items-center gap-2 text-[10px]">
              <span
                className={`size-1.5 rounded-full ${
                  f.status === "complete"
                    ? "bg-emerald-400"
                    : f.status === "error"
                      ? "bg-red-400"
                      : f.status === "running"
                        ? "bg-amber-400 animate-pulse"
                        : "bg-zinc-700"
                }`}
              />
              <code className="text-zinc-500">{f.path}</code>
              {f.size && <span className="ml-auto text-zinc-600">{f.size}B</span>}
            </div>
          ))}
          {files.length > 15 && (
            <p className="text-[10px] text-zinc-600">+{files.length - 15} more files</p>
          )}
        </div>
      </div>
    </PhaseCard>
  );
}

// ─── Previewing Card ──────────────────────────────────────────────
function PreviewingCard({
  previewUrl,
  status,
}: {
  previewUrl?: string;
  status: PhaseStatus;
}) {
  if (status === "pending") {
    return (
      <PhaseCard icon={Monitor} title="Previewing" status="pending">
        <p>Waiting to start the preview server…</p>
      </PhaseCard>
    );
  }

  if (status === "running") {
    return (
      <PhaseCard icon={Monitor} title="Previewing" status="running">
        <p>Starting Next.js dev server and allocating a preview port…</p>
      </PhaseCard>
    );
  }

  if (status === "complete" && previewUrl) {
    return (
      <PhaseCard icon={Monitor} title="Previewing" status="complete">
        <p className="mb-2">Live preview is ready.</p>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-emerald-400 hover:bg-white/[0.08] transition-colors"
        >
          <Monitor className="size-3" />
          Open Preview
        </a>
      </PhaseCard>
    );
  }

  return (
    <PhaseCard icon={Monitor} title="Previewing" status={status}>
      <p>Preview status unknown</p>
    </PhaseCard>
  );
}

// ─── Deploying Card ───────────────────────────────────────────────
function DeployingCard({
  deployedUrl,
  status,
}: {
  deployedUrl?: string;
  status: PhaseStatus;
}) {
  if (status === "pending") {
    return (
      <PhaseCard icon={Rocket} title="Deploying" status="pending">
        <p>Waiting to deploy to Vercel…</p>
      </PhaseCard>
    );
  }

  if (status === "running") {
    return (
      <PhaseCard icon={Rocket} title="Deploying" status="running">
        <p>Syncing workspace and deploying via canonical script. Pre-flight audit in progress…</p>
      </PhaseCard>
    );
  }

  if (status === "complete" && deployedUrl) {
    return (
      <PhaseCard icon={Rocket} title="Deploying" status="complete">
        <p className="mb-2">Deployed to production.</p>
        <a
          href={deployedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <Rocket className="size-3" />
          {deployedUrl}
        </a>
      </PhaseCard>
    );
  }

  return (
    <PhaseCard icon={Rocket} title="Deploying" status={status}>
      <p>Deploy status unknown</p>
    </PhaseCard>
  );
}

// ─── Verifying Card ───────────────────────────────────────────────
function VerifyingCard({
  deployedUrl,
  status,
  error,
}: {
  deployedUrl?: string;
  status: PhaseStatus;
  error?: string;
}) {
  if (status === "pending") {
    return (
      <PhaseCard icon={CheckCircle2} title="Verifying" status="pending">
        <p>Waiting to verify the deployed URL…</p>
      </PhaseCard>
    );
  }

  if (status === "running") {
    return (
      <PhaseCard icon={CheckCircle2} title="Verifying" status="running">
        <p>Checking deployed URL for 200 response…</p>
      </PhaseCard>
    );
  }

  if (status === "complete" && deployedUrl) {
    return (
      <PhaseCard icon={CheckCircle2} title="Verifying" status="complete">
        <div className="space-y-2">
          <p className="text-emerald-400">✓ Live and verified</p>
          <a
            href={deployedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Rocket className="size-3" />
            Open MVP
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(deployedUrl)}
            className="ml-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Copy URL
          </button>
        </div>
      </PhaseCard>
    );
  }

  return (
    <PhaseCard icon={CheckCircle2} title="Verifying" status={status}>
      <p>{error || "Verification failed"}</p>
    </PhaseCard>
  );
}

// ─── Main GenerativeMvpCard ───────────────────────────────────────
export default function GenerativeMvpCard({ slug }: { slug: string }) {
  const [mvp, setMvp] = useState<MvpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phases, setPhases] = useState<PhaseState>({
    planning: "pending",
    generating: "pending",
    previewing: "pending",
    deploying: "pending",
    verifying: "pending",
  });
  const [liveFiles, setLiveFiles] = useState<FileEntry[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);

  // Fetch MVP status on mount
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/mvp/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("MVP not found");
        } else {
          setError(`Status fetch failed: ${res.status}`);
        }
        setLoading(false);
        return;
      }
      const data: MvpData = await res.json();
      setMvp(data);

      // Map status to phases
      if (data.status) {
        const s = data.status;
        const newPhases: PhaseState = { ...phases };
        if (s === "planning" || s === "planned") {
          newPhases.planning = s === "planned" ? "complete" : "running";
        }
        if (s === "generating" || s === "generated") {
          newPhases.planning = "complete";
          newPhases.generating = s === "generated" ? "complete" : "running";
        }
        if (s === "previewing" || s === "preview_ready") {
          newPhases.planning = "complete";
          newPhases.generating = "complete";
          newPhases.previewing = s === "preview_ready" ? "complete" : "running";
        }
        if (s === "deploying" || s === "deployed") {
          newPhases.planning = "complete";
          newPhases.generating = "complete";
          newPhases.previewing = "complete";
          newPhases.deploying = s === "deployed" ? "complete" : "running";
        }
        if (s === "verifying" || s === "verified") {
          newPhases.planning = "complete";
          newPhases.generating = "complete";
          newPhases.previewing = "complete";
          newPhases.deploying = "complete";
          newPhases.verifying = s === "verified" ? "complete" : "running";
        }
        if (s === "error") {
          // Find the last completed phase and mark subsequent as error
          Object.keys(newPhases).forEach((k) => {
            if (newPhases[k as keyof PhaseState] === "running") {
              (newPhases as any)[k] = "error";
            }
          });
        }
        setPhases(newPhases);
      }

      if (data.previewUrl) setPreviewUrl(data.previewUrl);
      if (data.deployedUrl) setDeployedUrl(data.deployedUrl);
      if (data.files) setLiveFiles(data.files);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch MVP status");
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchStatus();
    // Poll every 5s for updates
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="size-5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 animate-pulse" />
          <span className="text-sm text-zinc-500">Loading MVP status…</span>
        </div>
      </div>
    );
  }

  if (error && !mvp) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.02] p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchStatus}
          className="mt-3 text-xs text-zinc-500 underline hover:text-zinc-300 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-zinc-100">
          {mvp?.plan?.title || slug}
        </h1>
        {mvp?.plan?.description && (
          <p className="mt-1 text-sm text-zinc-500">{mvp.plan.description}</p>
        )}
      </div>

      {/* 5 Phase Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PlanningCard plan={mvp?.plan} status={phases.planning} />
        <GeneratingCard files={liveFiles.length > 0 ? liveFiles : mvp?.plan?.files?.map((f) => ({ path: f.path, status: "pending" as PhaseStatus }))} status={phases.generating} />
        <PreviewingCard previewUrl={previewUrl || mvp?.previewUrl} status={phases.previewing} />
        <DeployingCard deployedUrl={deployedUrl || mvp?.deployedUrl} status={phases.deploying} />
      </div>
      {/* Verifying card spans full width */}
      <VerifyingCard
        deployedUrl={deployedUrl || mvp?.deployedUrl}
        status={phases.verifying}
        error={mvp?.error}
      />
    </div>
  );
}
