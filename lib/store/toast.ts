"use client";

import { create } from "zustand";

export type ToastTone = "default" | "success" | "error" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  duration: number;
}

interface ToastState {
  items: ToastItem[];
  push: (msg: string, opts?: { tone?: ToastTone; duration?: number }) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (message, opts) => {
    const id = Math.random().toString(36).slice(2);
    const tone = opts?.tone ?? "default";
    const duration = opts?.duration ?? 3500;
    set({ items: [...get().items, { id, tone, message, duration }] });
    setTimeout(() => get().dismiss(id), duration);
  },
  dismiss: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}));

export function toast(message: string, opts?: { tone?: ToastTone; duration?: number }) {
  useToastStore.getState().push(message, opts);
}
