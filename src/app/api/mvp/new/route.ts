import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MVP_VPS_URL = process.env.MVP_BUILDER_URL || "http://187.127.250.171:8200";

/**
 * POST /api/mvp/new
 * Body: { prompt: string }
 *
 * Proxies to VPS /new which:
 * 1. Creates workspace and stores in manifest.json
 * 2. Kicks off plan→generate pipeline in background
 * 3. Returns immediately with { slug, sessionId, status: "planning" }
 *
 * Client polls GET /api/mvp/<slug> for progress.
 */
export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = String(body.prompt || "").trim();
    if (!prompt || prompt.length < 3) {
      return new Response(JSON.stringify({ error: "Prompt too short (min 3 chars)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Proxy to VPS /new — returns immediately, pipeline runs in background
    const res = await fetch(`${MVP_VPS_URL}/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown VPS error");
      return new Response(
        JSON.stringify({
          error: `VPS /new failed: ${res.status}`,
          detail: errText.slice(0, 200),
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
