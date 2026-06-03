"use client";
import { Menu, FileText, LayoutDashboard, History } from "lucide-react";
import { useEffect, useState } from "react";
import { ModelSelector } from "@/components/jarvis/ModelSelector";
import { ConnectorPlusMenu } from "@/components/chat/ConnectorPlusMenu";

export function ChatTopBar({ onSidebarToggle, onArtifactToggle, artifactOpen, onConnectorSheetToggle }: { onSidebarToggle: () => void; onArtifactToggle: () => void; artifactOpen: boolean; onConnectorSheetToggle?: () => void }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleOn = () => setOnline(true);
      const handleOff = () => setOnline(false);
      window.addEventListener("online", handleOn);
      window.addEventListener("offline", handleOff);
      setOnline(navigator.onLine);
      return () => {
        window.removeEventListener("online", handleOn);
        window.removeEventListener("offline", handleOff);
      };
    }
  }, []);

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.05] bg-black/40 backdrop-blur-2xl px-4">
      <div className="flex items-center gap-3">
        <button onClick={onSidebarToggle} className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 hover:shadow-[0_0_15px_rgb(255_255_255_/_0.04)] transition-all" aria-label="Toggle sidebar">
          <Menu className="size-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">Jarvis</div>
          <ModelSelector />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ConnectorPlusMenu onOpenSheet={onConnectorSheetToggle} />
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium backdrop-blur-md transition-colors ${online ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-amber-500/10 border-amber-500/25 text-amber-400"}`}>
          <div className={`size-1.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          {online ? "online" : "offline"}
        </div>
        <a href="/dashboard" className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all bg-white/[0.04] backdrop-blur-md border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_12px_rgb(255_255_255_/_0.03)]">
          <LayoutDashboard className="size-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </a>
        <a href="/runs" className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all bg-white/[0.04] backdrop-blur-md border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_12px_rgb(255_255_255_/_0.03)]">
          <History className="size-3.5" />
          <span className="hidden sm:inline">Runs</span>
        </a>
        <button onClick={onArtifactToggle} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${artifactOpen ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgb(16_185_129_/_0.1)]" : "bg-white/[0.04] backdrop-blur-md border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_0_12px_rgb(255_255_255_/_0.03)]"}`}>
          <FileText className="size-3.5" />
          <span className="hidden sm:inline">Artifacts</span>
        </button>
      </div>
    </div>
  );
}
