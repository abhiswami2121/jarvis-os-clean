"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Sparkles } from "lucide-react";

const LS_KEY = "jarvis-os:last-version-sha";

/**
 * Polls /api/version every 60s and shows a subtle banner when a new deploy is detected.
 * Clicking the banner triggers window.location.reload() to bust Vercel edge cache.
 * Respects user dismissal — won't re-show the same version.
 */
export function VersionBanner() {
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const sha = data?.git_sha;
        if (!sha) return;

        const lastKnown = localStorage.getItem(LS_KEY);
        // First visit: store the version, don't show banner
        if (!lastKnown) {
          localStorage.setItem(LS_KEY, sha);
          return;
        }
        // New version detected and user hasn't dismissed this specific SHA
        if (lastKnown !== sha && !cancelled) {
          setNewVersion(sha);
        }
      } catch {
        // Silently fail — banner is cosmetic
      }
    };

    check();
    timer = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const handleRefresh = () => {
    localStorage.setItem(LS_KEY, newVersion || "");
    window.location.reload();
  };

  const handleDismiss = () => {
    if (newVersion) localStorage.setItem(LS_KEY, newVersion);
    setDismissed(true);
    setNewVersion(null);
  };

  return (
    <AnimatePresence>
      {newVersion && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="pointer-events-auto mt-2 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] backdrop-blur-md px-4 py-2 text-xs shadow-lg shadow-emerald-500/5">
            <Sparkles className="size-3 text-emerald-400" />
            <span className="text-zinc-300">
              New version deployed{" "}
              <span className="font-mono text-emerald-400">({newVersion.slice(0, 7)})</span>
            </span>
            <button
              onClick={handleRefresh}
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1 text-emerald-300 transition-colors"
            >
              <RefreshCw className="size-3" />
              Refresh
            </button>
            <button
              onClick={handleDismiss}
              className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
