import { NextRequest } from "next/server";

const VPS_URL = process.env.JARVIS_VPS_URL || "http://187.127.250.171:8102";
const TOKEN = process.env.DIAGNOSTICS_API_KEY || "NL2026061471";

/**
 * GET /api/conversations?user_email=X&limit=50
 *
 * Lists conversations for sidebar. Proxies VPS /v1/conversations.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userEmail = url.searchParams.get("user_email") || "";
  const limit = url.searchParams.get("limit") || "50";
  const qs = new URLSearchParams({ limit });
  if (userEmail) qs.set("user_email", userEmail);
  try {
    const upstream = await fetch(
      `${VPS_URL}/v1/conversations?${qs.toString()}`,
      {
        headers: { "Authorization": `Bearer ${TOKEN}` },
        signal: AbortSignal.timeout(8000),
      }
    );
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ conversations: [], count: 0, error: e?.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/conversations
 *
 * PRE-CREATE a conversation on the VPS so it appears in sidebar immediately.
 * Body: { id, user_email, title? }
 * This ensures the conversation exists BEFORE the first message is sent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, user_email, title } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: "id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const upstream = await fetch(`${VPS_URL}/v1/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        id,
        user_email: user_email || "aswa0617@gmail.com",
        title: title || null,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const bodyText = await upstream.text();
    return new Response(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  } catch (e: any) {
    // Non-fatal — conversation will be created on first message anyway
    return new Response(JSON.stringify({ warning: "pre-create failed", error: e?.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
