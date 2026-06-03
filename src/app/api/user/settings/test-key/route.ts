import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── POST /api/user/settings/test-key ───────────────────────────────
// Validates an API key by making a minimal ping to the provider.
// Uses model: 'test' and max_tokens: 1 to avoid burning quota.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const keyName: string = body.key_name;

    if (!keyName) {
      return NextResponse.json({ error: "key_name is required" }, { status: 400 });
    }

    const key = process.env[keyName];
    if (!key) {
      return NextResponse.json({ error: "Key not configured", valid: false }, { status: 422 });
    }

    // Determine endpoint based on key type
    let pingUrl: string;
    let pingHeaders: Record<string, string>;

    switch (keyName) {
      case "AI_GATEWAY_API_KEY":
        pingUrl = "https://ai-gateway.vercel.sh/v1/models";
        pingHeaders = { "Authorization": `Bearer ${key}` };
        break;
      case "ANTHROPIC_API_KEY":
        pingUrl = "https://api.anthropic.com/v1/models";
        pingHeaders = { "x-api-key": key, "anthropic-version": "2023-06-01" };
        break;
      case "DEEPSEEK_API_KEY":
        pingUrl = "https://api.deepseek.com/anthropic/v1/models";
        pingHeaders = { "x-api-key": key, "anthropic-version": "2023-06-01" };
        break;
      case "OPENAI_API_KEY":
        pingUrl = "https://api.openai.com/v1/models";
        pingHeaders = { "Authorization": `Bearer ${key}` };
        break;
      case "GEMINI_API_KEY":
        pingUrl = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
        pingHeaders = {};
        break;
      default:
        return NextResponse.json({ error: "Unknown key type", valid: false }, { status: 400 });
    }

    try {
      const resp = await fetch(pingUrl, {
        headers: pingHeaders,
        signal: AbortSignal.timeout(10000),
      });

      if (resp.ok) {
        return NextResponse.json({ valid: true, status: resp.status });
      }

      const errText = await resp.text().catch(() => "");
      return NextResponse.json({
        valid: false,
        status: resp.status,
        detail: errText.slice(0, 200),
      });
    } catch (e: any) {
      return NextResponse.json({
        valid: false,
        detail: e.message || "Connection failed",
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Test failed" }, { status: 500 });
  }
}
