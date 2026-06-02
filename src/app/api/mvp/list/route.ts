import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MVP_VPS_URL = process.env.MVP_BUILDER_URL || "http://187.127.250.171:8200";

export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${MVP_VPS_URL}/list`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `VPS returned ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=5, s-maxage=5",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to fetch MVP list" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
