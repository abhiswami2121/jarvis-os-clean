/**
 * NEPTUNE-7: Neptune VPS Client
 *
 * Dispatches tasks to the VPS backend (claude-agent-api) with routing metadata.
 * The backend uses the provider-specific api_key and base_url for this task's session.
 */
const VPS_URL = process.env.JARVIS_VPS_URL || "http://187.127.250.171:8102";
const TOKEN = process.env.DIAGNOSTICS_API_KEY || "NL2026061471";

export interface NeptuneTaskPayload {
  goal: string;
  model: string;
  api_key: string;
  base_url: string;
  routing_mode: "direct" | "gateway";
  provider: string;
  task_id?: string;
  max_turns?: number;
  user_email?: string;
  conversation_id?: string;
}

export interface NeptuneTaskResult {
  session_id: string;
  status: string;
  routing: {
    mode: string;
    provider: string;
    model: string;
  };
}

/**
 * Dispatch a task to the VPS backend with full routing metadata.
 * The backend applies env overrides (ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL)
 * per-session based on the resolved route.
 */
export async function createNeptuneTask(payload: NeptuneTaskPayload): Promise<NeptuneTaskResult> {
  const resp = await fetch(`${VPS_URL}/v1/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      goal: payload.goal,
      model: payload.model,
      api_key: payload.api_key,
      base_url: payload.base_url,
      routing_mode: payload.routing_mode,
      provider: payload.provider,
      task_id: payload.task_id,
      max_turns: payload.max_turns || 250,
      user_email: payload.user_email || "unknown",
      conversation_id: payload.conversation_id,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "unknown error");
    throw new Error(`Neptune backend error ${resp.status}: ${errBody.slice(0, 300)}`);
  }

  return resp.json();
}

/**
 * Fetch session status from the VPS backend.
 */
export async function getSessionStatus(sessionId: string): Promise<any> {
  const resp = await fetch(`${VPS_URL}/v1/sessions/${sessionId}`, {
    headers: { "Authorization": `Bearer ${TOKEN}` },
  });
  if (!resp.ok) throw new Error(`Failed to fetch session: ${resp.status}`);
  return resp.json();
}
