import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Client Error Telemetry — Cardinal Law 1 feedback loop.
 *
 * Accepts POST from JarvisErrorBoundary.onError.
 * Writes to a local log file for inspection.
 * Rate-limited to 10 requests per minute per IP.
 *
 * Silent failure is OK — this is best-effort telemetry,
 * never a point of failure for the chat surface.
 */

// In-memory rate limiter (reset on cold start — acceptable)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  if (entry.count > 10) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const line = JSON.stringify({
      ts: body.timestamp || new Date().toISOString(),
      ip,
      error: body.error || "unknown",
      stack: (body.stack || "").slice(0, 1000),
      componentStack: (body.componentStack || "").slice(0, 1000),
      location: body.location || "unknown",
    });

    // Best-effort log append
    const fs = await import("node:fs");
    const path = await import("node:path");
    const logDir = "/home/hermes/data";
    const logFile = path.join(logDir, "client_errors.log");

    try {
      // Ensure dir exists
      await fs.promises.mkdir(logDir, { recursive: true });
      await fs.promises.appendFile(logFile, line + "\n");
    } catch (_) {
      // Disk write failed — acceptable, this is best-effort
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
