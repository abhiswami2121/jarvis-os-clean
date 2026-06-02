"use client";
import { useState } from "react";
import { Layers, Plug } from "lucide-react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import ChatPage from "./chat/page";
import MyMvpsDrawer from "@/components/mvp/MyMvpsDrawer";

export default function HomePage() {
  const [mvpsOpen, setMvpsOpen] = useState(false);

  return (
    <>
      {/* Top-right nav bar */}
      <div className="fixed right-4 top-4 z-30 flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0b0d13]/90 px-3.5 py-2 text-xs font-medium text-zinc-400 backdrop-blur-md transition-all hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-zinc-200">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0b0d13]/90 px-3.5 py-2 text-xs font-medium text-emerald-400/80 backdrop-blur-md transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.06] hover:text-emerald-300">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                userButtonBox: "border border-white/[0.06] rounded-xl backdrop-blur-md",
              },
            }}
          />
        </Show>

        {/* Connectors button */}
        <Link
          href="/connectors"
          className="inline-flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-3.5 py-2 text-xs font-medium text-purple-300/80 backdrop-blur-md transition-all hover:border-purple-500/30 hover:bg-purple-500/[0.10] hover:text-purple-200"
          title="Connectors"
        >
          <Plug className="size-3.5" />
          <span className="hidden sm:inline">Connectors</span>
        </Link>

        {/* My MVPs button */}
        <button
          onClick={() => setMvpsOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0b0d13]/90 px-3.5 py-2 text-xs font-medium text-zinc-400 backdrop-blur-md transition-all hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-zinc-200"
          title="My MVPs"
        >
          <Layers className="size-3.5" />
          <span className="hidden sm:inline">My MVPs</span>
        </button>
      </div>

      <ChatPage />

      <MyMvpsDrawer open={mvpsOpen} onClose={() => setMvpsOpen(false)} />
    </>
  );
}
