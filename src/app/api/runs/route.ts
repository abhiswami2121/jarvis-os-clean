import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VPS_URL = process.env.VPS_API_URL || "http://localhost:8102";
const AUTH_TOKEN = process.env.DIAGNOSTICS_API_KEY || "NL2026061471";
const GOLDEN_DIR = "/home/hermes/data/golden_runs";

interface VPSConversation {
  id: string;
  user_email: string;
  title: string;
  created_at: number;
  updated_at: number;
  last_seq: number;
  archived: number;
  tags: string;
  base44_session_id: string | null;
}

interface VPSConversationList {
  conversations: VPSConversation[];
  count: number;
}

interface VPSEvent {
  conversation_id: string;
  seq: number;
  event_type: string;
  data: unknown;
  timestamp: number;
}

async function vpsFetch(path: string): Promise<unknown> {
  const res = await fetch(`${VPS_URL}${path}`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`VPS ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get("cid");
  const golden = searchParams.get("golden");

  // --- Golden Run MD file ---
  if (golden) {
    try {
      const fs = await import("fs/promises");
      const path = `${GOLDEN_DIR}/${golden}.md`;
      const content = await fs.readFile(path, "utf-8");
      return new NextResponse(content, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    } catch {
      return NextResponse.json(
        { error: "Golden run not found", sid: golden },
        { status: 404 }
      );
    }
  }

  // --- Single conversation detail ---
  if (cid) {
    try {
      const [conv, replay] = await Promise.all([
        vpsFetch(`/v1/conversations/${cid}`) as Promise<unknown>,
        vpsFetch(`/v1/conversations/${cid}/replay`) as Promise<unknown>,
      ]);
      return NextResponse.json({ conversation: conv, replay });
    } catch {
      return NextResponse.json(
        { error: "Conversation not found", cid },
        { status: 404 }
      );
    }
  }

  // --- List conversations ---
  try {
    const limit = searchParams.get("limit") || "100";
    const userEmail = searchParams.get("user_email") || "";
    let path = `/v1/conversations?limit=${limit}`;
    if (userEmail) path += `&user_email=${encodeURIComponent(userEmail)}`;

    const data = (await vpsFetch(path)) as VPSConversationList;
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
