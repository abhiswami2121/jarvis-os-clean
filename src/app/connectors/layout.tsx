import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connectors — Jarvis Command Center",
  description: "Manage MCP servers, APIs, n8n workflows, and SDKs",
};

export default function ConnectorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
