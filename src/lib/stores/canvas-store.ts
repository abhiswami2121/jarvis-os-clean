"use client";

import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────

export type TemplateType =
  | "weekly-digest"
  | "data-explorer"
  | "billing-summary"
  | "customer-360"
  | "planning-board"
  | "mission-report"
  | "generic";

export interface CanvasData {
  title?: string;
  subtitle?: string;
  [key: string]: unknown;
}

export interface OpenCanvasParams {
  template: TemplateType;
  data: CanvasData;
  title?: string;
}

interface CanvasState {
  isOpen: boolean;
  canvasId: string | null;
  templateType: TemplateType | null;
  data: CanvasData | null;
  url: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  open: (params: OpenCanvasParams) => void;
  close: () => void;
  setData: (data: CanvasData) => void;
  setUrl: (url: string) => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

// ── Store ──────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasState>((set) => ({
  isOpen: false,
  canvasId: null,
  templateType: null,
  data: null,
  url: null,
  isLoading: false,
  error: null,

  open: ({ template, data, title }) =>
    set({
      isOpen: true,
      canvasId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      templateType: template,
      data: { ...data, title: title ?? data.title },
      url: null,
      error: null,
      isLoading: false,
    }),

  close: () =>
    set({
      isOpen: false,
      canvasId: null,
      templateType: null,
      data: null,
      url: null,
      error: null,
      isLoading: false,
    }),

  setData: (data) => set({ data: { ...data } }),
  setUrl: (url) => set({ url }),
  setError: (error) => set({ error, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
