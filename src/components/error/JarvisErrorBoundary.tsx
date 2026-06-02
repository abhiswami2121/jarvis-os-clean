"use client";

import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * JarvisErrorBoundary — top-level chat surface crash guard.
 *
 * Cardinal Law 1: Chat UI NEVER white-screens.
 * Catches any render error from JarvisRuntimeProvider or Thread.
 * Degrades to a fallback card instead of a white screen.
 *
 * onError: silently posts to /api/log/client-error for telemetry.
 * onReset: full page reload (cleanest guaranteed recovery).
 */

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function JarvisFallbackUI({ error, resetErrorBoundary }: FallbackProps) {
  const message = error?.message ? error.message.slice(0, 200) : "An unexpected render error occurred.";

  return (
    <div className="flex h-screen items-center justify-center bg-[#08080f] text-zinc-300">
      <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="size-5 text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-red-300">Something went wrong</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 break-words">
              {message}
            </p>
            <button
              onClick={resetErrorBoundary}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors"
            >
              <RefreshCw className="size-4" />
              Reload Chat
            </button>
            <p className="mt-3 text-xs text-zinc-600">
              Your conversation history is preserved. Reloading will restore the last good state.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function handleError(error: Error, info: React.ErrorInfo) {
  // Fire-and-forget telemetry — silent failure is OK
  try {
    fetch("/api/log/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack?.slice(0, 1000),
        componentStack: info.componentStack?.slice(0, 1000),
        timestamp: new Date().toISOString(),
        location: window.location.href,
      }),
    }).catch(() => {});
  } catch (_) {
    // no-op — telemetry is best-effort only
  }
}

export function JarvisErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={JarvisFallbackUI}
      onError={handleError}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default JarvisErrorBoundary;
