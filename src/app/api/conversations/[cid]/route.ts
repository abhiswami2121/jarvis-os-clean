import { NextRequest } from "next/server";

const VPS_URL = process.env.JARVIS_VPS_URL || "http://187.127.250.171:8102";
const TOKEN = process.env.DIAGNOSTICS_API_KEY || "NL2026061471";

export async function GET(req: NextRequest, ctx: { params: Promise<{ cid: string }> }) {
  const { cid } = await ctx.params;
  if (!cid) {
    return new Response(JSON.stringify({ error: "cid required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const upstream = await fetch(`${VPS_URL}/v1/conversations/${encodeURIComponent(cid)}`, {
      headers: { "Authorization": `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(8000),
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
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
