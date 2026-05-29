import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/jarvis-proxy/files
 * Proxy to Base44 JarvisFile entity — lists non-archived documents.
 *
 * Query params:
 *   ?id=<id> — fetch single document with content
 *
 * Filters by category: memory_analysis, reference, output, memory_session, memory_knowledge
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE44_API_URL =
  process.env.BASE44_API_URL || "https://api.base44.app/v1";
const BASE44_API_KEY = process.env.BASE44_API_KEY || "";

const TARGET_CATEGORIES = [
  "memory_analysis",
  "reference",
  "output",
  "memory_session",
  "memory_knowledge",
];

interface JarvisFileRecord {
  id: string;
  fileName: string;
  path: string;
  sizeBytes: number;
  updated_date: string;
  category: string;
  fileType: string;
  content?: string;
}

function inferType(
  path: string,
  category: string
): "prd" | "plan" | "spec" | "audit" | "memory" | "output" | "skill" | "report" {
  const lower = path.toLowerCase();
  if (lower.includes("/prd/") || lower.includes("-prd")) return "prd";
  if (lower.includes("/plan/") || lower.includes("plan.md")) return "plan";
  if (lower.includes("/spec/") || lower.includes("spec.md")) return "spec";
  if (lower.includes("/audit/") || lower.includes("audit")) return "audit";
  if (lower.includes("/skills/") || lower.includes("skill")) return "skill";
  if (category === "memory_analysis" || category === "memory_session")
    return "memory";
  if (category === "output") return "output";
  return "report";
}

export async function GET(req: NextRequest) {
  // Single document fetch
  const idParam = req.nextUrl.searchParams.get("id");

  if (idParam) {
    try {
      const res = await fetch(
        `${BASE44_API_URL}/entity/JarvisFile/${encodeURIComponent(idParam)}`,
        {
          headers: {
            Authorization: `Bearer ${BASE44_API_KEY}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        return NextResponse.json(
          { error: `Base44 returned ${res.status}` },
          { status: res.status }
        );
      }

      const record: JarvisFileRecord = await res.json();

      return NextResponse.json({
        document: {
          meta: {
            id: record.id,
            title: record.fileName,
            path: record.path,
            size: record.sizeBytes || 0,
            updatedAt: record.updated_date,
            type: inferType(record.path, record.category),
            source: "base44" as const,
          },
          content: record.content || "",
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Failed to fetch document" },
        { status: 500 }
      );
    }
  }

  // List documents
  try {
    // Fetch from each category, merge
    const allDocs: JarvisFileRecord[] = [];

    for (const cat of TARGET_CATEGORIES) {
      try {
        const res = await fetch(
          `${BASE44_API_URL}/entity/JarvisFile?filter=${encodeURIComponent(
            JSON.stringify({ category: cat, isArchived: false })
          )}&sort=-updated_date&limit=200`,
          {
            headers: {
              Authorization: `Bearer ${BASE44_API_KEY}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        if (res.ok) {
          const data = await res.json();
          const records: JarvisFileRecord[] =
            data.results || data.data || data.records || [];
          allDocs.push(...records);
        }
      } catch {
        // skip category on error
      }
    }

    const documents = allDocs.map((r) => ({
      id: r.id,
      title: r.fileName || r.path?.split("/").pop() || "Untitled",
      path: r.path,
      size: r.sizeBytes || 0,
      updatedAt: r.updated_date,
      type: inferType(r.path, r.category),
      source: "base44" as const,
    }));

    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list Base44 files", documents: [] },
      { status: 500 }
    );
  }
}
