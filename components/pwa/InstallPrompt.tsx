"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "howu_install_dismissed_at";
const DISMISS_TTL = 14 * 86400000; // 14 天

export function InstallPrompt() {
  const t = useTranslations();
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - Number(last) < DISMISS_TTL) return;

    // 已是 standalone 不再提示
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
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
          className="fixed inset-x-3 bottom-24 z-40 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-4 max-w-md mx-auto border border-zinc-200/80"
        >
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">{t("pwa.install_title")}</div>
            <p className="text-xs text-zinc-500 leading-relaxed">{t("pwa.install_body")}</p>
            <p className="text-xs text-zinc-400">
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
