import type { Metadata } from "next";
import "./globals.css";
import "../styles/tokens.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Jarvis Command Center",
  description: "NewLeaf operations agent — Mission Control",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08080f] text-zinc-100 antialiased">
        {children}
        <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: "rgba(18,18,27,0.95)", border: "1px solid rgba(255,255,255,0.08)", color: "#FAFAFA" } }} />
      </body>
    </html>
  );
}
