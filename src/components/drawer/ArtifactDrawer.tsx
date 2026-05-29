"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useArtifactStore } from "@/lib/stores/artifact-store";
import { AnalyticsCard } from "@/components/cards/AnalyticsCard";
import { IntegrationMatrix } from "@/components/cards/IntegrationMatrix";
import { SlackManifest } from "@/components/cards/SlackManifest";

export const ArtifactDrawer: React.FC = () => {
  const isOpen = useArtifactStore((s) => s.isOpen);
  const payload = useArtifactStore((s) => s.payload);
  const activeTab = useArtifactStore((s) => s.activeTab);
  const setActiveTab = useArtifactStore((s) => s.setActiveTab);
  const close = useArtifactStore((s) => s.close);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const tabs = [
    { key: "financial" as const, label: "📊 Financial", title: "Financial & Enrollment" },
    { key: "integration" as const, label: "🛠️ Integration", title: "System Integration Matrix" },
    { key: "manifest" as const, label: "📝 Manifest", title: "Verified Slack Manifest" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full md:w-[640px] lg:w-[720px] bg-gradient-to-b from-zinc-950/95 to-zinc-900/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_-8px_60px_rgba(0,0,0,0.5)] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Artifact Drawer"
          >
            <header className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Canvas Workspace</p>
                <h2 className="text-lg font-semibold text-zinc-100 truncate">{payload?.title || "Mission Synthesis"}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">#{payload?.channel || "jarvis-admin"} · {payload?.canvas_id?.slice(0, 12) || "canvas"}</p>
              </div>
              <button
                onClick={close}
                className="shrink-0 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all active:scale-95 flex items-center justify-center text-zinc-400 hover:text-zinc-100"
                aria-label="Close drawer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </header>
            <nav className="flex items-center gap-1 px-5 pt-3 border-b border-white/5">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={"px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all " + (activeTab === t.key ? "border-fuchsia-400 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300")}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "financial" && <AnalyticsCard payload={payload} />}
              {activeTab === "integration" && <IntegrationMatrix />}
              {activeTab === "manifest" && <SlackManifest payload={payload} />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
