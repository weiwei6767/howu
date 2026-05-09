"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Sparkle } from "@/components/ui/Ornaments";

const STORAGE_KEY = "howu_install_dismissed_at";
const DISMISS_TTL = 14 * 86400000;

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - Number(last) < DISMISS_TTL) return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone;
    if (standalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/(macos|crios|fxios)/.test(ua);
    const android = /android/.test(ua);
    if (!ios && !android) return;
    setPlatform(ios ? "ios" : "android");
    setTimeout(() => setShow(true), 6000);
  }, []);

  function dismiss(remember: boolean) {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && platform && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-x-3 bottom-24 z-40 max-w-md mx-auto"
        >
          <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-white border border-[var(--color-accent)]/30 shadow-[0_16px_48px_-16px_rgba(184,50,77,0.35)]">
            <Sparkle className="absolute top-3 right-3 w-3 h-3 text-[var(--color-accent)]/55" />
            <Sparkle className="absolute bottom-3 left-3 w-2.5 h-2.5 text-[var(--color-accent)]/40" />

            <div className="px-5 py-5 flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-accent-deep)]">
                ✦ Install
              </p>
              <h3 className="font-serif text-2xl leading-tight">
                把 howu 加到主畫面
              </h3>
              <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
                {platform === "ios"
                  ? "用 Safari 點下方分享按鈕 → 加入主畫面。從桌面打開才能收到推播通知。"
                  : "用 Chrome 點右上角 ⋮ → 加入主畫面。從桌面打開才能收到推播通知。"}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => dismiss(true)}
                  className="flex-1 h-10 text-sm rounded-[var(--radius-button)] border border-[var(--color-paper-line)] text-[var(--color-ink-mid)] hover:border-[var(--color-ink-mid)] transition-colors"
                >
                  晚點再說
                </button>
                <Link
                  onClick={() => dismiss(false)}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={"/install" as any}
                  className="flex-1 h-10 inline-flex items-center justify-center text-sm rounded-[var(--radius-button)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-deep)] transition-colors"
                >
                  看完整教學 →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
