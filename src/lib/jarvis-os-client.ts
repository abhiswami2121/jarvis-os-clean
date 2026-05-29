// Typed API client for Jarvis-OS chat persistence layer
// Wraps the endpoints: /api/conversations, /api/conversations/[cid],
//   /api/jarvis-proxy/resume (full), /api/jarvis-proxy/resume?limit=N (paginated)

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
  has_more?: boolean;
  total_count?: number;
}

export interface ListResponse {
  conversations: Conversation[];
  count: number;
  error?: string;
}

const DEFAULT_USER = "aswa0617@gmail.com";

// ─── localStorage cache keys ───────────────────────────────────────────
const LS_CONVERSATIONS = "jarvis-os:conversations:v1";
const LS_MESSAGES_PREFIX = "jarvis-os:msgs:";
const LS_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

/** Cache wrapper: stamp each write with time so stale reads can be detected */
interface CacheEntry<T> {
  data: T;
  at: number;
}

function lsGet<T>(key: string, maxAge = LS_CACHE_MAX_AGE): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.at > maxAge) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, at: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch { /* quota exceeded — non-critical */ }
}

// ─── Conversation list (with localStorage fallback) ────────────────────

export async function listConversations(opts: { userEmail?: string; limit?: number } = {}): Promise<ListResponse> {
  const params = new URLSearchParams({
    user_email: opts.userEmail || DEFAULT_USER,
    limit: String(opts.limit || 50),
  });
  try {
    const res = await fetch(`/api/conversations?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      // Fall back to localStorage cache on network error
      const cached = lsGet<Conversation[]>(LS_CONVERSATIONS);
      if (cached) return { conversations: cached, count: cached.length };
      return { conversations: [], count: 0, error: `HTTP ${res.status}` };
    }
    const data: ListResponse = await res.json();
    // Cache successful response immediately
    if (data.conversations?.length > 0) {
      lsSet(LS_CONVERSATIONS, data.conversations);
    }
    return data;
  } catch (e: any) {
    const cached = lsGet<Conversation[]>(LS_CONVERSATIONS);
    if (cached) return { conversations: cached, count: cached.length };
    return { conversations: [], count: 0, error: e?.message || "Network error" };
  }
}

export async function getConversation(cid: string): Promise<Conversation | null> {
  try {
    const res = await fetch(`/api/conversations/${encodeURIComponent(cid)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    // Try localStorage list as fallback
    const cached = lsGet<Conversation[]>(LS_CONVERSATIONS);
    if (cached) return cached.find((c) => c.id === cid) || null;
    return null;
  }
}

/**
 * PRE-CREATE a conversation on the VPS before the first message.
 * Ensures it appears in the sidebar immediately.
 */
export async function createConversation(opts: {
  id: string;
  userEmail?: string;
  title?: string;
}): Promise<Conversation | null> {
  try {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: opts.id,
        user_email: opts.userEmail || DEFAULT_USER,
        title: opts.title || null,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null; // Non-fatal — VPS will create on first message
  }
}

/**
 * Full replay from `since` to end. Use this for active stream resumption.
 */
export async function replayConversation(cid: string, since: number = 0): Promise<ReplayResponse | null> {
  const params = new URLSearchParams({ conversation_id: cid, since: String(since) });
  try {
    const res = await fetch(`/api/jarvis-proxy/resume?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Paginated replay — only fetch the LAST N events (or oldest N before a cursor).
 * Default loads the most recent 50 events for instant scroll-to-bottom UX.
 */
export async function replayConversationPage(
  cid: string,
  opts: { limit?: number; before?: number; direction?: "newest" | "oldest" } = {},
): Promise<ReplayResponse | null> {
  const limit = opts.limit ?? 50;
  const params = new URLSearchParams({ conversation_id: cid, since: "0" });
  if (opts.before !== undefined) params.set("before", String(opts.before));
  params.set("limit", String(limit));
  params.set("direction", opts.direction || "newest");

  const fetchWithRetry = async (attempts = 3): Promise<Response> => {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(`/api/jarvis-proxy/resume?${params.toString()}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(10000 + i * 5000),
        });
        if (res.ok) return res;
        if (res.status === 404 || res.status === 400) throw res; // Don't retry 4xx
      } catch (e: any) {
        if (e instanceof Response) throw e;
        if (i === attempts - 1) throw e;
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, (1000 * Math.pow(2, i))));
      }
    }
    throw new Error("Max retries exceeded");
  };

  try {
    const res = await fetchWithRetry(3);
    const full: ReplayResponse = await res.json();

    // Cache latest messages to localStorage for offline/refresh survival
    if (full.events && full.events.length > 0) {
      try {
        if (typeof window !== "undefined") {
          lsSet(`${LS_MESSAGES_PREFIX}${cid}`, {
            events: full.events.slice(-100), // Keep last 100
            total_count: full.total_count ?? full.events.length,
            lastSeq: full.events[full.events.length - 1]?.seq ?? 0,
          });
        }
      } catch { /* non-critical */ }
    }

    // Client-side fallback if VPS ignores pagination params: take last N
    if (full.events && full.events.length > limit && opts.direction !== "oldest") {
      const sliced = full.events.slice(-limit);
      return {
        ...full,
        events: sliced,
        count: sliced.length,
        has_more: full.events.length > limit,
        total_count: full.events.length,
      };
    }
    return {
      ...full,
      has_more: (full.total_count ?? full.count ?? full.events.length) > full.events.length,
    };
  } catch (e: any) {
    // Fall back to localStorage cache
    const cached = lsGet<{ events: ReplayEvent[]; total_count: number; lastSeq: number }>(
      `${LS_MESSAGES_PREFIX}${cid}`,
    );
    if (cached && cached.events.length > 0) {
      return {
        conversation_id: cid,
        since: 0,
        count: cached.events.length,
        events: cached.events,
        has_more: false,
        total_count: cached.total_count,
      };
    }
    return null;
  }
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

/** Get cached messages from localStorage (for instant hydration on refresh) */
export function getLocalCachedMessages(cid: string): ReplayEvent[] {
  const cached = lsGet<{ events: ReplayEvent[]; total_count: number; lastSeq: number }>(
    `${LS_MESSAGES_PREFIX}${cid}`,
  );
  return cached?.events || [];
}

/** Get cached conversation list from localStorage */
export function getLocalCachedConversations(): Conversation[] {
  return lsGet<Conversation[]>(LS_CONVERSATIONS) || [];
}
