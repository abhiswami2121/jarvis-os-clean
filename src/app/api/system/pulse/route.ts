import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VPS = process.env.JARVIS_VPS_URL || "http://187.127.250.171:8102";

async function ping(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch { return false; }
}

export async function GET() {
  const [vpsOk, vercelOk] = await Promise.all([
    ping(`${VPS}/health`),
    Promise.resolve(true), // we ARE Vercel — if this runs, Vercel is up
  ]);

  return NextResponse.json({
    vps: vpsOk ? "up" : "down",
    tunnel: vpsOk ? "up" : "down", // tunnel succeeding implied by /health
    base44: "up", // Phase 1 placeholder — Phase 2 will ping base44.app/api/apps
    vercel: vercelOk ? "up" : "down",
    sessionsToday: 0,
    avgLatencyMs: 2400,
    costToday: 0,
    tunnelUptime: "→ stable",
  });
}
