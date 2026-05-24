"use client";
import { useEffect, useState, useCallback } from "react";
import { listConversations, type Conversation } from "@/lib/jarvis-os-client";

export function useConversationList(userEmail?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await listConversations({ userEmail, limit: 100 });
    if (res.error) {
      setError(res.error);
    } else {
      setError(null);
      setConversations(res.conversations);
    }
    setLoading(false);
  }, [userEmail]);

  useEffect(() => {
    refresh();
    // Poll every 15s so new conversations appear without page refresh
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  return { conversations, loading, error, refresh };
}
