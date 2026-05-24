"use client";
import { Sparkles } from "lucide-react";
import { StatusPill } from "../shared/StatusPill";

export function HeroBar() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/[0.05] bg-[#08080f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="size-6 text-transparent aurora-text" style={{ stroke: "url(#auroraGrad)" }} />
            <svg width="0" height="0"><defs><linearGradient id="auroraGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4F8BFF"/><stop offset="35%" stopColor="#A855F7"/><stop offset="70%" stopColor="#EC4899"/><stop offset="100%" stopColor="#FBBF24"/></linearGradient></defs></svg>
          </div>
          <span className="text-lg font-semibold tracking-tight aurora-text">Jarvis Command Center</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill variant="emerald" pulse>Brain online · Kimi K2.6 ready</StatusPill>
        </div>
      </div>
    </header>
  );
}
