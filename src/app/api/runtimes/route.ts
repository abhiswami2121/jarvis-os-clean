import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VPS = process.env.JARVIS_VPS_URL || "http://147.93.102.210:8102";
const TOKEN = process.env.JARVIS_VPS_TOKEN || process.env.DIAGNOSTICS_API_KEY || "NL2026061471";

export async function GET() {
  // For Phase 1 we return 4 cards based on what brain reports + heuristic stats.
  // Phase 2 will wire to /v1/runtimes per-runtime latency tracking.
  let brainOk = false;
  try {
    const r = await fetch(`${VPS}/health`, { signal: AbortSignal.timeout(3000) });
    brainOk = r.ok;
  } catch {}

  const runtimes = [
    {
      id: "kimi-k2.6",
      name: "Kimi K2.6",
      provider: "Moonshot",
      status: brainOk ? "ready" : "down",
      latencyMs: 2400,
      callsToday: 0,
      costToday: 0,
      description: "Thinking mode — deep reasoning, default for Jarvis",
      accent: "blue",
    },
    {
      id: "kimi-k2.6-fast",
      name: "Kimi K2.6 fast",
      provider: "Moonshot",
      status: brainOk ? "ready" : "down",
      latencyMs: 800,
      callsToday: 0,
      costToday: 0,
      description: "No-think mode — fast code gen and quick replies",
      accent: "purple",
    },
    {
      id: "deepseek-v4",
      name: "DeepSeek V4",
      provider: "DeepSeek",
      status: brainOk ? "ready" : "down",
      latencyMs: 1200,
      callsToday: 0,
      costToday: 0,
      description: "Council judge — second opinion for premium decisions",
      accent: "emerald",
    },
    {
      id: "council",
      name: "Council",
      provider: "Multi-runtime",
      status: brainOk ? "ready" : "down",
      latencyMs: 7800,
      callsToday: 0,
      costToday: 0,
      description: "3 runtimes vote in parallel — high-stakes decisions",
      accent: "amber",
    },
  ];

  return NextResponse.json({ runtimes });
}
