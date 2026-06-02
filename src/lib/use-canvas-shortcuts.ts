"use client";

import { useEffect } from "react";
import { useArtifactStore } from "@/stores/artifactStore";

/**
 * useCanvasShortcuts — keyboard shortcuts for canvas control (Phase 4 P1).
 * Wire into the main ChatPage component.
 *
 * Shortcuts:
 *   Cmd+\         → toggle canvas
 *   Cmd+Shift+\   → fullscreen toggle
 *   Cmd+E         → focus composer with artifact context
 *   [ / ]         → prev/next tab (when canvas not focused on input)
 *   Cmd+W         → close current tab (when canvas not focused on input)
 *   Esc           → exit fullscreen / close panel
 */
export function useCanvasShortcuts() {
  const isOpen = useArtifactStore((s) => s.isOpen);
  const mode = useArtifactStore((s) => s.mode);
  const setMode = useArtifactStore((s) => s.setMode);
  const close = useArtifactStore((s) => s.close);
  const openPanel = useArtifactStore((s) => s.openPanel);
  const tabs = useArtifactStore((s) => s.tabs);
  const activeTabId = useArtifactStore((s) => s.activeTabId);
  const switchTab = useArtifactStore((s) => s.switchTab);
  const closeTab = useArtifactStore((s) => s.closeTab);
  const current = useArtifactStore((s) => s.current);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (e.target as HTMLElement)?.tagName
      );
      const isContentEditable = (e.target as HTMLElement)?.isContentEditable;

      // ── Cmd+\ → toggle canvas ──
      if (isCmd && e.key === "\\") {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          openPanel();
        }
        return;
      }

      // ── Cmd+Shift+\ → fullscreen toggle ──
      if (isCmd && e.shiftKey && e.key === "\\") {
        e.preventDefault();
        if (mode === "fullscreen") {
          setMode("split");
        } else {
          setMode("fullscreen");
        }
        return;
      }

      // ── Esc → exit fullscreen / close ──
      if (e.key === "Escape" && !isInput && !isContentEditable) {
        if (mode === "fullscreen") {
          e.preventDefault();
          setMode("split");
          return;
        }
        // DesktopArtifactPanel handles Esc → close already
      }

      // ── Cmd+E → focus composer with artifact context ──
      if (isCmd && e.key === "e" && !isInput) {
        e.preventDefault();
        // Focus the composer textarea
        const composer = document.querySelector(
          '[data-slot="aui_composer-shell"] textarea, .aui-composer-input'
        ) as HTMLTextAreaElement | null;
        if (composer) {
          const prefix = current ? `Tweak this: ${current.title}\n` : "";
          composer.focus();
          if (prefix) {
            // Set value programmatically (assistant-ui manages state)
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              "value"
            )?.set;
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(composer, prefix);
              composer.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
        }
        return;
      }

      // ── [ / ] → prev/next tab (when not in input) ──
      if (!isInput && !isContentEditable && isOpen && tabs.length > 1) {
        if (e.key === "[" && !isCmd) {
          e.preventDefault();
          const currentIdx = tabs.indexOf(activeTabId || "");
          if (currentIdx > 0) {
            switchTab(tabs[currentIdx - 1]);
          } else if (currentIdx === -1 && tabs.length > 0) {
            switchTab(tabs[tabs.length - 1]);
          }
          return;
        }
        if (e.key === "]" && !isCmd) {
          e.preventDefault();
          const currentIdx = tabs.indexOf(activeTabId || "");
          if (currentIdx >= 0 && currentIdx < tabs.length - 1) {
            switchTab(tabs[currentIdx + 1]);
          } else if (currentIdx === -1 && tabs.length > 0) {
            switchTab(tabs[0]);
          }
          return;
        }
      }

      // ── Cmd+W → close current tab (when canvas open and not in input) ──
      if (isCmd && e.key === "w" && !isInput && isOpen && activeTabId) {
        e.preventDefault();
        closeTab(activeTabId);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen, mode, setMode, close, openPanel, tabs, activeTabId,
    switchTab, closeTab, current,
  ]);
}
