import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/vps-files
 * Lists documents from VPS filesystem via the FastAPI server.
 *
 * Scanned paths:
 *   - /home/hermes/data/planning-crew/**\/*.md
 *   - /home/hermes/cortex/prd/*.md
 *   - /home/hermes/cortex/skills/coding/**\/SKILL.md
 *
 * Query params:
 *   ?path=<path> — read content of a specific file
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VPS_API_BASE =
  process.env.VPS_API_BASE || "http://127.0.0.1:8102";
const VPS_AUTH_TOKEN = process.env.VPS_AUTH_TOKEN || "";

interface VpsFileEntry {
  path: string;
  size: number;
  updatedAt: string;
}

function inferType(
  path: string
): "prd" | "plan" | "spec" | "audit" | "memory" | "output" | "skill" | "report" {
  const lower = path.toLowerCase();
  if (lower.includes("/prd/")) return "prd";
  if (lower.includes("/planning-crew/") && lower.includes("plan")) return "plan";
  if (lower.includes("/specs/")) return "spec";
  if (lower.includes("/audit/")) return "audit";
  if (lower.includes("/skills/coding/")) return "skill";
  if (lower.includes("/memory/")) return "memory";
  if (lower.includes("/data/")) return "output";
  return "report";
}

export async function GET(req: NextRequest) {
  const pathParam = req.nextUrl.searchParams.get("path");

  // Read single file
  if (pathParam) {
    try {
      const res = await fetch(
        `${VPS_API_BASE}/v1/vps-files/read?path=${encodeURIComponent(pathParam)}`,
        {
          headers: {
            Authorization: `Bearer ${VPS_AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        return NextResponse.json(
          { error: `VPS returned ${res.status}` },
          { status: res.status }
        );
      }

      const data = await res.json();

      return NextResponse.json({
        document: {
          meta: {
            id: data.path || pathParam,
            title: (data.path || pathParam).split("/").pop() || "Untitled",
            path: data.path || pathParam,
            size: data.size || 0,
            updatedAt: data.updatedAt || new Date().toISOString(),
            type: inferType(data.path || pathParam),
            source: "vps" as const,
          },
          content: data.content || "",
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Failed to read VPS file" },
        { status: 500 }
      );
    }
  }

  // List documents
  try {
    const res = await fetch(`${VPS_API_BASE}/v1/vps-files/list`, {
      headers: {
        Authorization: `Bearer ${VPS_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `VPS returned ${res.status}`, documents: [] },
        { status: 200 } // Return empty gracefully
      );
    }

    const data = await res.json();
    const files: VpsFileEntry[] = data.files || [];

    const documents = files.map((f) => ({
      id: f.path,
      title: f.path.split("/").pop() || "Untitled",
      path: f.path,
      size: f.size || 0,
      updatedAt: f.updatedAt || new Date().toISOString(),
      type: inferType(f.path),
      source: "vps" as const,
    }));

    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list VPS files", documents: [] },
      { status: 200 }
    );
  }
}
