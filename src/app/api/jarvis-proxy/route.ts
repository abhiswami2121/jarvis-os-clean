import { NextRequest } from "next/server";

const VPS_URL = process.env.JARVIS_VPS_URL || "http://147.93.102.210:8102";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${VPS_URL}/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  // Stream the SSE response back to the browser
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Connection": "keep-alive",
      "X-Run-Id": upstream.headers.get("X-Run-Id") || "",
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
