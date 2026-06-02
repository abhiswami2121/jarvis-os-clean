import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MVP_VPS_URL = process.env.MVP_BUILDER_URL || "http://187.127.250.171:8200";
// Same DIAGNOSTICS_API_KEY used by /api/agent for internal VPS calls
const INTERNAL_TOKEN = process.env.DIAGNOSTICS_API_KEY || "NL2026061471";

function sse(event: string, data: any): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * GET /api/mvp/[slug] — fetch MVP status from VPS
 */
async function handleGet(slug: string): Promise<Response> {
  try {
    const url = `${MVP_VPS_URL}/status/${encodeURIComponent(slug)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `MVP not found: ${slug}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "VPS unreachable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/mvp/[slug] — proxy SSE actions to VPS mvp-builder
 * Body: { action: "plan" | "generate" | "preview" | "deploy" | "verify", payload?: any }
 */
async function handlePost(slug: string, body: any): Promise<Response> {
  const action = body?.action;
  if (!action) {
    return new Response(JSON.stringify({ error: "action field required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Map action to VPS endpoint
  const actionMap: Record<string, string> = {
    plan: "/plan",
    generate: "/generate",
    preview: "/preview",
    deploy: "/deploy",
    verify: "/verify",
  };

  const vpsPath = actionMap[action];
  if (!vpsPath) {
    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = body.payload || body;
  // Ensure slug is in the payload
  if (!payload.slug) payload.slug = slug;

  const stream = new ReadableStream({
    async start(controller) {
      // Heartbeat to keep Vercel proxy alive during long operations
      const heartbeat = setInterval(() => {
        try { controller.enqueue(sse("keepalive", { t: Date.now() })); } catch (_) {}
      }, 15000);

      try {
        controller.enqueue(sse("system", { type: "system", subtype: "connecting", action, slug }));

        const res = await fetch(`${MVP_VPS_URL}${vpsPath}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${INTERNAL_TOKEN}`,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(300000), // 5 min max
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          controller.enqueue(
            sse("error", {
              error: `VPS ${action} failed: ${res.status}`,
              detail: errBody.slice(0, 500),
            })
          );
          controller.close();
          return;
        }

        // Check if the response is SSE or JSON
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/event-stream") && res.body) {
          // Pass through SSE stream from VPS
          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } else {
          // JSON response — emit as a single SSE event
          const data = await res.json();
          controller.enqueue(sse(action, data));
        }

        controller.enqueue(sse("done", { type: "done", action, slug }));
      } catch (err: any) {
        try {
          controller.enqueue(sse("error", { error: err?.message || "Unknown error" }));
        } catch (_) {}
      } finally {
        try { clearInterval(heartbeat); } catch (_) {}
        try { controller.close(); } catch (_) {}
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}

/**
 * DELETE /api/mvp/[slug] — destroy workspace via VPS
 */
async function handleDelete(slug: string): Promise<Response> {
  try {
    const res = await fetch(`${MVP_VPS_URL}/status/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${INTERNAL_TOKEN}` },
      signal: AbortSignal.timeout(15000),
    });
    return new Response(
      JSON.stringify({ ok: res.ok, slug, status: res.status }),
      {
        status: res.ok ? 200 : res.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "VPS unreachable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handleGet(slug);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch (_) {
    body = {};
  }
  return handlePost(slug, body);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handleDelete(slug);
}
