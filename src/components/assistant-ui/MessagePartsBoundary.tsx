"use client";

import React from "react";
import { useAuiState } from "@assistant-ui/react";

/**
 * MessagePartsBoundary
 * ---------------------------------------------------------------
 * Catches render-time crashes inside the assistant-ui message-part
 * tree (most notably the "current scope does not have a 'part'
 * property" error thrown by Unstable_PartsGrouped mid-stream).
 *
 * Instead of letting one malformed/streaming part white-screen the
 * ENTIRE conversation, we degrade gracefully to the plain message
 * text so the chat stays usable. The fallback reads message text via
 * the MESSAGE scope (always present inside MessagePrimitive.Root) and
 * never re-enters the fragile grouped-part scope, so it cannot loop.
 */
function PartsFallback() {
  const text = useAuiState((s: any) => {
    try {
      const parts = s?.message?.parts ?? s?.message?.content ?? [];
      return parts
        .filter((p: any) => p && (p.type === "text" || typeof p.text === "string"))
        .map((p: any) => p.text || "")
        .join("")
        .trim();
    } catch {
      return "";
    }
  });

  return (
    <div className="aui-parts-fallback whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">
      {text || (
        <span className="text-zinc-500 italic">
          This message couldn’t be fully rendered. The rest of your conversation is unaffected.
        </span>
      )}
    </div>
  );
}

class PartsBoundaryInner extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn("[MessagePartsBoundary] recovered from part render error:", error);
  }

  render() {
    if (this.state.hasError) return <PartsFallback />;
    return this.props.children;
  }
}

export function MessagePartsBoundary({ children }: { children: React.ReactNode }) {
  return <PartsBoundaryInner>{children}</PartsBoundaryInner>;
}

export default MessagePartsBoundary;
