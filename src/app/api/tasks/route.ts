import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { resolveRoute } from "@/lib/neptune/routing-resolver";
import { createNeptuneTask } from "@/lib/neptune/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Use pg Pool directly (bypasses drizzle for inserts to avoid column-defaults issues)
const DB_URL = (process.env.DATABASE_URL || "").replace("sslmode=require", "sslmode=no-verify");
const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

// ── POST /api/tasks — Create & dispatch a task ────────────────────
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const prompt: string = body.prompt;
    const selectedModel: string = body.selectedModel || body.selected_model || "deepseek-v4-pro";
    const routingMode: "direct" | "gateway" = body.routingMode || body.routing_mode || "gateway";
    const userId: string = req.headers.get("x-user-id") || body.userId || "default";

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json({ error: "Prompt must be at least 3 characters" }, { status: 400 });
    }

    const taskId = `tsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    // ── Step 1: Create task row ──────────────────────────────────
    await client.query(
      `INSERT INTO tasks (id, user_id, prompt, selected_model, routing_mode, status, max_duration, progress, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'routing',300,0,NOW(),NOW())`,
      [taskId, userId, prompt.trim(), selectedModel, routingMode]
    );

    // ── Step 2: Resolve routing ──────────────────────────────────
    let route;
    try {
      route = await resolveRoute(selectedModel, routingMode);
    } catch (routingError: any) {
      await client.query(
        `UPDATE tasks SET status='error', error=$1, updated_at=NOW() WHERE id=$2`,
        [`Routing failed: ${routingError.message}`, taskId]
      );
      return NextResponse.json({ error: routingError.message }, { status: 422 });
    }

    // ── Step 3: Write resolved routing fields ────────────────────
    await client.query(
      `UPDATE tasks SET resolved_model=$1, resolved_provider=$2, resolved_base_url=$3, resolved_key_prefix=$4, status='dispatched', updated_at=NOW() WHERE id=$5`,
      [route.model, route.provider, route.base_url, route.key_prefix, taskId]
    );

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
      await client.query(
        `UPDATE tasks SET status='error', error=$1, updated_at=NOW() WHERE id=$2`,
        [`Dispatch failed: ${dispatchError.message}`, taskId]
      );
      return NextResponse.json({ error: dispatchError.message }, { status: 502 });
    }

    // ── Step 5: Update with VPS session ID ───────────────────────
    await client.query(
      `UPDATE tasks SET agent_session_id=$1, sandbox_id=$1, status='running', updated_at=NOW() WHERE id=$2`,
      [neptuneResult.session_id, taskId]
    );

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
  } finally {
    client.release();
  }
}

// ── GET /api/tasks — List tasks ──────────────────────────────────
export async function GET(req: NextRequest) {
  const client = await pool.connect();
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const userId = req.headers.get("x-user-id") || "default";

    const result = await client.query(
      `SELECT * FROM tasks WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );

    return NextResponse.json({ tasks: result.rows, count: result.rows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to list tasks" }, { status: 500 });
  } finally {
    client.release();
  }
}
