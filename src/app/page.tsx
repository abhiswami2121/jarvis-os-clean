import { redirect } from "next/navigation";

/**
 * Root (/) → instant server redirect to /chat.
 * No client render. No flash of different UI. No "Starting conversation…".
 * The user always lands on the consistent chat interface.
 */
export default function HomePage() {
  redirect("/chat");
}
