/**
 * useContextWindow — Context window manager for the Jarvis-OS chat.
 *
 * Prevents the "Versailles problem": when EVERY message is sent to the API
 * on every turn, payloads grow unbounded and context windows fill with noise.
 *
 * Strategy:
 *   - Always include the FIRST message (system prompt context)
 *   - Always include the LAST N messages (the active conversation window)
 *   - Optionally summarise the middle into a single synthetic message
 *   - Configurable window size (default 20)
 *
 * assistant-ui best practice: never send the full history. Trim to
 * a relevant context window. See: assistant-ui.com/docs/patterns/context-window
 */
"use client";

export interface WindowConfig {
  /** Number of most-recent messages to keep (default 20) */
  maxRecent: number;
  /** Always keep the first N messages for anchoring (default 1) */
  alwaysKeepFirst: number;
  /** When true, compact middle messages into a summary note (default false) */
  enableSummarization: boolean;
}

const DEFAULT_CONFIG: WindowConfig = {
  maxRecent: 20,
  alwaysKeepFirst: 1,
  enableSummarization: false,
};

export interface WindowedMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Trim a message array to fit within the context window.
 * Returns the trimmed array and a count of how many were removed.
 */
export function trimContextWindow(
  messages: WindowedMessage[],
  config: Partial<WindowConfig> = {},
): { trimmed: WindowedMessage[]; removedCount: number; compacted: boolean } {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (messages.length <= cfg.maxRecent + cfg.alwaysKeepFirst) {
    return { trimmed: messages, removedCount: 0, compacted: false };
  }

  const firstBlock = messages.slice(0, cfg.alwaysKeepFirst);
  const middleBlock = messages.slice(
    cfg.alwaysKeepFirst,
    messages.length - cfg.maxRecent,
  );
  const recentBlock = messages.slice(messages.length - cfg.maxRecent);

  if (cfg.enableSummarization && middleBlock.length > 5) {
    // Compact the middle into one synthetic message
    const summaryNote: WindowedMessage = {
      role: "system" as const,
      content: `[${middleBlock.length} earlier messages compacted. ` +
        `Earliest in this batch: ${middleBlock[0].content.slice(0, 80)}… ` +
        `Latest: ${middleBlock[middleBlock.length - 1].content.slice(0, 80)}…]`,
    };
    return {
      trimmed: [...firstBlock, summaryNote, ...recentBlock],
      removedCount: middleBlock.length - 1,
      compacted: true,
    };
  }

  // Just drop the middle
  return {
    trimmed: [...firstBlock, ...recentBlock],
    removedCount: middleBlock.length,
    compacted: false,
  };
}

/**
 * Truncate a single string content to maxChars (for display, not for API).
 */
export function truncateContent(content: string, maxChars = 200): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + `… [${content.length - maxChars} more chars]`;
}
