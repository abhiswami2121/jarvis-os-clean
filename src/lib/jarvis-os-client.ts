// Typed API client for Jarvis-OS chat persistence layer
// Wraps the 3 endpoints: /api/conversations, /api/conversations/[cid], /api/jarvis-proxy/resume

export interface Conversation {
  id: string;
  user_email: string;
  title: string | null;
  created_at: number;
  updated_at: number;
  last_seq: number;
  archived: number;
  tags: string;
  base44_session_id: string | null;
}

export interface ReplayEvent {
  seq: number;
  event: string;
  data: any;
  t: number;
}

export interface ReplayResponse {
  conversation_id: string;
  since: number;
  count: number;
  events: ReplayEvent[];
}

export interface ListResponse {
  conversations: Conversation[];
  count: number;
  error?: string;
}

const DEFAULT_USER = "aswa0617@gmail.com";

export async function listConversations(opts: { userEmail?: string; limit?: number } = {}): Promise<ListResponse> {
  const params = new URLSearchParams({
    user_email: opts.userEmail || DEFAULT_USER,
    limit: String(opts.limit || 50),
  });
  const res = await fetch(`/api/conversations?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return { conversations: [], count: 0, error: `HTTP ${res.status}` };
  return res.json();
}

export async function getConversation(cid: string): Promise<Conversation | null> {
  const res = await fetch(`/api/conversations/${encodeURIComponent(cid)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function replayConversation(cid: string, since: number = 0): Promise<ReplayResponse | null> {
  const params = new URLSearchParams({ conversation_id: cid, since: String(since) });
  const res = await fetch(`/api/jarvis-proxy/resume?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export function newConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
