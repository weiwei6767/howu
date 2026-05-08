"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "howu_install_dismissed_at";
const DISMISS_TTL = 14 * 86400000;

export function InstallPrompt() {
  const t = useTranslations();
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

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && platform && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="fixed inset-x-3 bottom-24 z-40 rounded-[var(--radius-card)] bg-white dark:bg-[#1d1916] shadow-[var(--shadow-modal)] p-4 max-w-md mx-auto border border-[var(--color-paper-line)]"
        >
          <div className="flex flex-col gap-2">
            <div className="text-sm">{t("pwa.install_title")}</div>
            <p className="text-xs text-[var(--color-ink-mid)] leading-relaxed">
              {t("pwa.install_body")}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              {platform === "ios" ? t("pwa.ios_steps") : t("pwa.android_steps")}
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" fullWidth onClick={dismiss}>
                {t("pwa.later")}
              </Button>
              <Button size="sm" fullWidth onClick={dismiss}>
                {t("pwa.got_it")}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
