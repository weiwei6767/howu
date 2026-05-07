"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore, type ToastTone } from "@/lib/store/toast";
import { cn } from "@/lib/utils/cn";

const TONE_CLASSES: Record<ToastTone, string> = {
  default: "bg-zinc-900 text-white",
  success: "bg-[var(--color-success)] text-white",
  error: "bg-[var(--color-danger)] text-white",
  info: "bg-[var(--color-rose)] text-white",
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
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto rounded-full px-4 py-2 text-sm shadow-lg max-w-sm text-left",
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
