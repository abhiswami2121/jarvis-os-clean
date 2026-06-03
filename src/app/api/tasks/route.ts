import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { resolveRoute } from "@/lib/neptune/routing-resolver";
import { createNeptuneTask } from "@/lib/neptune/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── POST /api/tasks — Create & dispatch a task ────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body.prompt;
    const selectedModel: string = body.selectedModel || body.selected_model || "deepseek-v4-pro";
    const routingMode: "direct" | "gateway" = body.routingMode || body.routing_mode || "gateway";
    const userId: string = req.headers.get("x-user-id") || body.userId || "default";

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json({ error: "Prompt must be at least 3 characters" }, { status: 400 });
    }

    // Generate task ID
    const taskId = `tsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    // ── Step 1: Create task row via raw SQL ────────────────────────
    await db.execute(sql`
      INSERT INTO tasks (id, user_id, prompt, selected_model, routing_mode, status, max_duration, progress)
      VALUES (${taskId}, ${userId}, ${prompt.trim()}, ${selectedModel}, ${routingMode}, 'routing', 300, 0)
    `);

    // ── Step 2: Resolve routing ──────────────────────────────────
    let route;
    try {
      route = await resolveRoute(selectedModel, routingMode);
    } catch (routingError: any) {
      // Write error back and return
      await db.update(tasks).set({
        status: "error",
        error: `Routing failed: ${routingError.message}`,
        updatedAt: new Date(),
      }).where(eq(tasks.id, taskId));
      return NextResponse.json({ error: routingError.message }, { status: 422 });
    }

    // ── Step 3: Write resolved routing fields ────────────────────
    await db.update(tasks).set({
      resolvedModel: route.model,
      resolvedProvider: route.provider,
      resolvedBaseUrl: route.base_url,
      resolvedKeyPrefix: route.key_prefix,
      status: "dispatched",
      updatedAt: new Date(),
    }).where(eq(tasks.id, taskId));

    // ── Step 4: Dispatch to Neptune VPS backend ──────────────────
    let neptuneResult;
    try {
      neptuneResult = await createNeptuneTask({
        goal: prompt.trim(),
        model: route.model,
        api_key: route.api_key,
        base_url: route.base_url,
        routing_mode: route.routing_mode,
        provider: route.provider,
        task_id: taskId,
        max_turns: body.maxTurns || 250,
        user_email: req.headers.get("x-user-email") || "",
        conversation_id: body.conversation_id,
      });
    } catch (dispatchError: any) {
      await db.update(tasks).set({
        status: "error",
        error: `Dispatch failed: ${dispatchError.message}`,
        updatedAt: new Date(),
      }).where(eq(tasks.id, taskId));
      return NextResponse.json({ error: dispatchError.message }, { status: 502 });
    }

    // ── Step 5: Update with VPS session ID ───────────────────────
    await db.update(tasks).set({
      agentSessionId: neptuneResult.session_id,
      status: "running",
      sandboxId: neptuneResult.session_id,
      updatedAt: new Date(),
    }).where(eq(tasks.id, taskId));

    return NextResponse.json({
      ok: true,
      task_id: taskId,
      session_id: neptuneResult.session_id,
      status: "running",
      routing: {
        mode: route.routing_mode,
        provider: route.provider,
        model: route.model,
        base_url: route.base_url,
        key_prefix: route.key_prefix,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Task creation failed" }, { status: 500 });
  }
}

// ── GET /api/tasks — List tasks ──────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") || "default";
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const rows = await db.query.tasks.findMany({
      where: eq(tasks.userId, userId),
      orderBy: [desc(tasks.createdAt)],
      limit,
    });

    return NextResponse.json({ tasks: rows, count: rows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list tasks" }, { status: 500 });
  }
}
