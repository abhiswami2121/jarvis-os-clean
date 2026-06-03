"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Paintbrush, AlertTriangle, Loader2, ExternalLink, RefreshCw, Smartphone, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Load Open Design through a same-origin Next.js rewrite so the iframe works
// from any client (Vercel, VPS tunnel, localhost) with zero CORS issues.
// The rewrite /design-proxy/** → daemon is defined in next.config.ts.
const DAEMON_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/design-proxy`
    : "http://127.0.0.1:7456";

type DaemonStatus = "checking" | "online" | "offline";

export default function DesignPage() {
  const [status, setStatus] = useState<DaemonStatus>("checking");
  const [iframeKey, setIframeKey] = useState(0);
  const [mobilePreview, setMobilePreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check daemon health
  const checkDaemon = useCallback(async () => {
    setStatus("checking");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${DAEMON_URL}/`, { signal: controller.signal });
      clearTimeout(timeout);
      setStatus(resp.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    checkDaemon();
  }, [checkDaemon]);

  // Listen for postMessage from open-design iframe for URL changes
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // open-design sends { type: "navigate", path: "/..." }
      if (e.data?.type === "navigate" && typeof e.data.path === "string") {
        const url = new URL(window.location.href);
        url.pathname = `/design${e.data.path}`;
        window.history.replaceState({}, "", url.toString());
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Keyboard shortcut: Cmd+Shift+R to reload iframe
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "R") {
        e.preventDefault();
        setIframeKey((k) => k + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#08080f] overflow-hidden">
      {/* ── Top Bar ────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-12 border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
            <Paintbrush className="size-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Design</span>
          <span className="text-[10px] text-zinc-500 font-mono bg-white/[0.03] px-1.5 py-0.5 rounded">
            Open Design v0.6
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Daemon status */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span
              className={`size-1.5 rounded-full ${
                status === "online"
                  ? "bg-emerald-400 shadow-[0_0_6px_rgb(52_211_153)]"
                  : status === "checking"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-red-400"
              }`}
            />
            <span className="text-zinc-500">
              {status === "online"
                ? "Daemon live"
                : status === "checking"
                ? "Checking..."
                : "Daemon offline"}
            </span>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobilePreview(!mobilePreview)}
            className={`p-1.5 rounded-md transition-colors ${
              mobilePreview
                ? "bg-violet-500/20 text-violet-300"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
            }`}
            title={mobilePreview ? "Desktop view" : "Mobile preview"}
          >
            {mobilePreview ? <Smartphone className="size-3.5" /> : <Monitor className="size-3.5" />}
          </button>

          {/* Reload */}
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            title="Reload (Cmd+Shift+R)"
          >
            <RefreshCw className="size-3.5" />
          </button>

          {/* Open in new tab */}
          <a
            href={DAEMON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <main className="flex-1 relative min-h-0">
        <AnimatePresence mode="wait">
          {status === "offline" ? (
            <OfflineState onRetry={checkDaemon} />
          ) : status === "checking" ? (
            <LoadingState />
          ) : (
            <motion.div
              key={`iframe-${iframeKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full flex items-center justify-center p-2"
            >
              <div
                className={`h-full rounded-xl overflow-hidden border border-white/[0.06] shadow-2xl transition-all duration-300 ${
                  mobilePreview
                    ? "w-[390px] max-w-full ring-1 ring-violet-500/20"
                    : "w-full"
                }`}
              >
                <iframe
                  ref={iframeRef}
                  key={iframeKey}
                  src={DAEMON_URL}
                  className="w-full h-full"
                  title="Open Design"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Mobile bottom indicator ────────────────────────── */}
      <div className="flex-shrink-0 h-7 border-t border-white/[0.03] bg-white/[0.01] flex items-center justify-center text-[9px] text-zinc-600 gap-2 md:hidden">
        <span>Cmd+Shift+R to reload</span>
        <span>·</span>
        <span>Swipe to navigate</span>
      </div>
    </div>
  );
}

/* ─── Offline State ─── */

function OfflineState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-6"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
        <AlertTriangle className="size-8 text-amber-400" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-200 mb-2">
        Design Daemon Offline
      </h2>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">
        The Open Design daemon isn&apos;t running. Start it with{" "}
        <code className="text-xs bg-white/[0.05] px-1.5 py-0.5 rounded text-zinc-300 font-mono">
          pm2 start open-design
        </code>{" "}
        or{" "}
        <code className="text-xs bg-white/[0.05] px-1.5 py-0.5 rounded text-zinc-300 font-mono">
          od --port 7456
        </code>
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-4 py-2 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-all"
      >
        <RefreshCw className="size-4" />
        Retry Connection
      </button>
    </motion.div>
  );
}

/* ─── Loading State ─── */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-6">
        <Loader2 className="size-8 text-violet-400 animate-spin" />
      </div>
      <p className="text-sm text-zinc-500">Connecting to design daemon...</p>
    </div>
  );
}
