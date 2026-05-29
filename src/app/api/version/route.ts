import { NextResponse } from "next/server";

/**
 * GET /api/version — returns deploy metadata for client-side cache-bust.
 * Cache-Control: no-store ensures the browser always gets the freshest value
 * after a Vercel deploy, breaking through edge-cache staleness.
 */
export async function GET() {
  const buildId = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA
    || "dev";

  return NextResponse.json(
    {
      git_sha: buildId.slice(0, 7),
      timestamp: Date.now(),
      deployed: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    },
  );
}
