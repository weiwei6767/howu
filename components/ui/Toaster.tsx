"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore, type ToastTone } from "@/lib/store/toast";
import { cn } from "@/lib/utils/cn";

const TONE_CLASSES: Record<ToastTone, string> = {
  default: "bg-[var(--color-ink)] text-white",
  success: "bg-[var(--color-ink)] text-white",
  error: "bg-[var(--color-danger)] text-white",
  info: "bg-[var(--color-ink)] text-white",
};

export function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:top-auto sm:bottom-24">
      <AnimatePresence>
        {items.map((t) => (
          <motion.button
            key={t.id}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto rounded-[var(--radius-button)] px-4 py-2 text-sm max-w-sm text-left shadow-[var(--shadow-modal)]",
              TONE_CLASSES[t.tone],
            )}
          >
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
