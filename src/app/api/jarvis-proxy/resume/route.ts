import { NextRequest } from "next/server";

const VPS_URL = process.env.JARVIS_VPS_URL || "http://187.127.250.171:8102";
const TOKEN = process.env.DIAGNOSTICS_API_KEY || "NL2026061471";

/**
 * GET /api/jarvis-proxy/resume?conversation_id=X&since=N&limit=N&before=N&direction=newest|oldest
 *
 * Phase A4/B1 — Conversation resume endpoint. Lets the browser reconnect after
 * sleep / refresh / network blip and hydrate from the last seq# it saw.
 *
 * Forwards ALL pagination params to VPS. Falls back to client-side slicing
 * if the VPS doesn't support limit/before/direction natively.
 *
 * Returns: JSON {conversation_id, since, count, events:[{seq, event, data, t}], has_more, total_count}
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cid = url.searchParams.get("conversation_id") || url.searchParams.get("cid") || "";
  const since = url.searchParams.get("since") || "0";
  const limit = url.searchParams.get("limit") || "";
  const before = url.searchParams.get("before") || "";
  const direction = url.searchParams.get("direction") || "";

  if (!cid) {
    return new Response(JSON.stringify({ error: "conversation_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Forward all params the VPS might support
    const upstreamParams = new URLSearchParams({ since });
    if (limit) upstreamParams.set("limit", limit);
    if (before) upstreamParams.set("before", before);
    if (direction) upstreamParams.set("direction", direction);

    const upstream = await fetch(
      `${VPS_URL}/v1/conversations/${encodeURIComponent(cid)}/replay?${upstreamParams.toString()}`,
      {
        headers: { "Authorization": `Bearer ${TOKEN}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `upstream ${upstream.status}` }),
        {
          status: upstream.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const body = await upstream.json();
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
