import { redirect } from "next/navigation";

/**
 * /chat → instant server redirect to a fresh /chat/[cid].
 * No client redirect. No localStorage dance. No "Starting conversation…" flash.
 * The user always sees the same consistent chat UI.
 *
 * To revisit an existing conversation: use the sidebar.
 */
function makeCid() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatEntry() {
  redirect(`/chat/${makeCid()}`);
}
