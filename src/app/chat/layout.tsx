"use client";

import { JarvisErrorBoundary } from "@/components/error/JarvisErrorBoundary";

/**
 * Chat segment layout — Cardinal Law 1: Chat UI never white-screens.
 *
 * Wraps every /chat/* page in a JarvisErrorBoundary.
 * If any render crashes inside JarvisRuntimeProvider, Thread, or any
 * child component, the boundary catches it and shows the fallback UI
 * instead of a blank white screen.
 *
 * Individual pages ALSO wrap <Thread /> separately for finer-grained
 * recovery — see chat/[id]/page.tsx.
 */

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <JarvisErrorBoundary>{children}</JarvisErrorBoundary>;
}
