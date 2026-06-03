import type { Metadata } from "next";
import "./globals.css";
import "../styles/tokens.css";
import { Toaster } from "sonner";
import { VersionBanner } from "@/components/jarvis/VersionBanner";

export const metadata: Metadata = {
  title: "Jarvis Command Center",
  description: "NewLeaf operations agent — Mission Control",
  openGraph: {
    title: "Jarvis Command Center",
    description: "NewLeaf operations agent — Mission Control",
    type: "website",
    siteName: "Jarvis OS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jarvis Command Center",
    description: "NewLeaf operations agent — Mission Control",
  },
  keywords: ["Jarvis", "NewLeaf", "AI", "operations", "mission control"],
  authors: [{ name: "NewLeaf" }],
  creator: "NewLeaf",
  publisher: "NewLeaf",
  robots: "index, follow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08080f] text-zinc-100 antialiased">
        {/* JarvisRuntime v2 — NewLeaf Operations Agent — Mission Control — Autonomous deployment verification marker */}
        <VersionBanner />
        {children}
        <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: "rgba(18,18,27,0.95)", border: "1px solid rgba(255,255,255,0.08)", color: "#FAFAFA" } }} />
        <div id="jarvis-runtime-marker" hidden>JarvisRuntime</div>
      </body>
    </html>
  );
}
