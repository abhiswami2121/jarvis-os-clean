import { NextRequest } from "next/server";

const VPS_URL = process.env.JARVIS_VPS_URL || "http://187.127.250.171:8102";
const TOKEN = process.env.DIAGNOSTICS_API_KEY || "NL2026061471";

/**
 * GET /api/jarvis-proxy/resume?conversation_id=X&since=N
 *
 * Phase A4/B1 — Conversation resume endpoint. Lets the browser reconnect after
 * sleep / refresh / network blip and hydrate from the last seq# it saw.
 *
 * Returns: JSON {conversation_id, since, count, events:[{seq, event, data, t}]}
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cid = url.searchParams.get("conversation_id") || url.searchParams.get("cid") || "";
  const since = url.searchParams.get("since") || "0";
  if (!cid) {
    return new Response(JSON.stringify({ error: "conversation_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const upstream = await fetch(
      `${VPS_URL}/v1/conversations/${encodeURIComponent(cid)}/replay?since=${since}`,
      {
        headers: { "Authorization": `Bearer ${TOKEN}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `upstream ${upstream.status}` }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = await upstream.text();
    return new Response(body, {
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
