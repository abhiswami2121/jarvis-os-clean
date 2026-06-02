import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max — Vercel Hobby limit

const MVP_VPS_URL = process.env.MVP_BUILDER_URL || "http://187.127.250.171:8200";

/**
 * SSE pass-through from VPS mvp-builder to browser.
 * Opens a connection to VPS /status/<slug>?stream=true and pipes events.
 * Heartbeats every 30s to prevent Vercel idle timeout.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug || slug.length > 128) {
    return new Response("Invalid slug", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Heartbeat to keep Vercel edge alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      let vpsReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      try {
        // Connect to VPS SSE endpoint
        // The VPS /status/<slug> endpoint may support ?stream=true or we use /plan /generate etc.
        // For v1, we poll /status/<slug> every 2s and emit phase_update events
        // This avoids needing a persistent VPS SSE connection through Vercel's proxy

        let lastPhases: Record<string, any> = {};
        let consecutiveErrors = 0;
        const MAX_ERRORS = 10;

        for (let i = 0; i < 150; i++) { // max 150 polls = 5 min
          try {
            const res = await fetch(
              `${MVP_VPS_URL}/status/${encodeURIComponent(slug)}`,
              { signal: AbortSignal.timeout(5000) }
            );

            if (res.ok) {
              consecutiveErrors = 0;
              const data = await res.json();

              // Emit full status as initial event
              if (i === 0) {
                controller.enqueue(
                  encoder.encode(`event: mvp_status\ndata: ${JSON.stringify(data)}\n\n`)
                );
              }

              // Check for phase changes
              const currentPhases: Record<string, any> = data.phases || {};
              for (const [phaseName, phaseData] of Object.entries(currentPhases)) {
                const prev = lastPhases[phaseName];
                const pd = phaseData as any;
                if (
                  !prev ||
                  prev.status !== pd.status ||
                  prev.duration_ms !== pd.duration_ms
                ) {
                  controller.enqueue(
                    encoder.encode(
                      `event: phase_update\ndata: ${JSON.stringify({
                        phase: phaseName,
                        ...pd,
                      })}\n\n`
                    )
                  );
                }
              }

              lastPhases = { ...currentPhases };

              // Check if complete
              if (data.phase === "verified" || data.productionUrl) {
                controller.enqueue(
                  encoder.encode(
                    `event: mvp_complete\ndata: ${JSON.stringify({
                      url: data.productionUrl,
                      phase: data.phase,
                    })}\n\n`
                  )
                );
                break;
              }

              // Check for errors
              if (data.error) {
                controller.enqueue(
                  encoder.encode(
                    `event: mvp_error\ndata: ${JSON.stringify({ error: data.error })}\n\n`
                  )
                );
                break;
              }

              // If still in early phases and no changes for a while, slow down polling
              if (i > 60 && Object.keys(currentPhases).length === 0) {
                break; // Nothing happening after 2 min, likely stale
              }
            } else if (res.status === 404 && i < 3) {
              // MVP might still be initializing, keep polling
            } else {
              consecutiveErrors++;
              if (consecutiveErrors >= MAX_ERRORS) {
                controller.enqueue(
                  encoder.encode(
                    `event: mvp_error\ndata: ${JSON.stringify({ error: "VPS connection lost" })}\n\n`
                  )
                );
                break;
              }
            }
          } catch {
            consecutiveErrors++;
            if (consecutiveErrors >= MAX_ERRORS) break;
          }

          // Wait between polls
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(
            `event: mvp_error\ndata: ${JSON.stringify({ error: err?.message || "Stream failed" })}\n\n`
          )
        );
      } finally {
        clearInterval(heartbeat);
        if (vpsReader) {
          try { vpsReader.cancel(); } catch {}
        }
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
