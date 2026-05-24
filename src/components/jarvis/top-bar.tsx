"use client";

import * as React from "react";
import { Sparkles, Settings, ChevronDown, Zap, Brain, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODELS = [
  { id: "kimi-k2.6", name: "Kimi K2.6", desc: "Deep reasoning - default", icon: Brain, color: "text-blue-500" },
  { id: "kimi-k2.6-fast", name: "Kimi K2.6 Fast", desc: "Quick replies", icon: Zap, color: "text-amber-500" },
  { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", desc: "Tool orchestration", icon: Sparkles, color: "text-orange-500" },
  { id: "deepseek-v4", name: "DeepSeek V4", desc: "Council judge", icon: Bot, color: "text-purple-500" },
];

export function TopBar() {
  const [model, setModel] = React.useState(MODELS[0]);
  const ModelIcon = model.icon;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 glass">
      <div className="flex h-14 items-center justify-between px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight">Jarvis</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">NewLeaf Agentic OS</div>
          </div>
          <Badge variant="outline" className="ml-2 text-[9px] uppercase tracking-wider font-mono">v0.1</Badge>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2 h-9 px-3 rounded-lg">
                  <ModelIcon className={`w-4 h-4 ${model.color}`} />
                  <span className="text-sm font-medium">{model.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Runtime</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MODELS.map((m) => {
                const Icon = m.icon;
                return (
                  <DropdownMenuItem key={m.id} onClick={() => setModel(m)} className="gap-3 py-2.5 cursor-pointer">
                    <Icon className={`w-5 h-5 ${m.color}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                    {m.id === model.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
