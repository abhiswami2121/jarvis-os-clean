/**
 * jarvis-transport.ts — client constants for Jarvis-OS SSE chat.
 * Hits same-origin /api/agent which proxies to the Jarvis-on-VPS brain.
 */
export const CHAT_API = "/api/agent";
export const RESUME_API = "/api/agent"; // (resume not used yet; placeholder)

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  status: "streaming" | "complete" | "error";
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
};

export const initialState = { messages: [] as ChatMessage[] };
export type JarvisState = typeof initialState;
