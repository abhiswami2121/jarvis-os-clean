import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET /api/user/settings ────────────────────────────────────────────
// Returns user routing preferences + API key provisioning status.
export async function GET(req: NextRequest) {
  try {
    // Resolve user identity from x-user-id header (set by middleware or client)
    const userId = req.headers.get("x-user-id") || "default";

    // Fetch user row or create default
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const routingMode = user?.routingMode || "gateway";

    // Check which API keys are configured (read from env — never echo values)
    const keyStatus = {
      has_ai_gateway_key: !!process.env.AI_GATEWAY_API_KEY,
      has_anthropic_key: !!process.env.ANTHROPIC_API_KEY,
      has_deepseek_key: !!process.env.DEEPSEEK_API_KEY,
      has_openai_key: !!process.env.OPENAI_API_KEY,
      has_gemini_key: !!process.env.GEMINI_API_KEY,
    };

    // Mask key previews for UI display
    const keyPreviews = {
      ai_gateway_key: maskKey(process.env.AI_GATEWAY_API_KEY),
      anthropic_key: maskKey(process.env.ANTHROPIC_API_KEY),
      deepseek_key: maskKey(process.env.DEEPSEEK_API_KEY),
      openai_key: maskKey(process.env.OPENAI_API_KEY),
      gemini_key: maskKey(process.env.GEMINI_API_KEY),
    };

    return NextResponse.json({
      routing_mode: routingMode,
      key_status: keyStatus,
      key_previews: keyPreviews,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

// ── PATCH /api/user/settings ───────────────────────────────────────────
// Updates routing_mode preference for the current user.
export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") || "default";
    const body = await req.json();
    const { routing_mode } = body;

    if (routing_mode && !["direct", "gateway"].includes(routing_mode)) {
      return NextResponse.json({ error: "routing_mode must be 'direct' or 'gateway'" }, { status: 400 });
    }

    // Upsert user
    const existing = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (existing) {
      await db.update(users).set({
        routingMode: routing_mode || existing.routingMode,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));
    } else {
      await db.insert(users).values({
        id: userId,
        routingMode: routing_mode || "gateway",
        email: req.headers.get("x-user-email") || "",
      });
    }

    return NextResponse.json({
      ok: true,
      routing_mode: routing_mode || existing?.routingMode || "gateway",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}

function maskKey(key: string | undefined): string {
  if (!key) return "";
  if (key.length <= 8) return key[0] + "***";
  return key.slice(0, 3) + "..." + key.slice(-4);
}
