"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Sparkle, HeartScribble } from "@/components/ui/Ornaments";
import { isPushSupported } from "@/lib/push/client";

const STORAGE_KEY = "howu_onboarding_seen_v1";

type Platform = "ios" | "android" | "desktop";

export function OnboardingSheet() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 已被使用者標記看過 → 不再顯示
    if (localStorage.getItem(STORAGE_KEY)) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/(macos|crios|fxios)/.test(ua);
    const android = /android/.test(ua);
    setPlatform(ios ? "ios" : android ? "android" : "desktop");

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(window.navigator as any).standalone;
    setInstalled(standalone);

    (async () => {
      const ok = await isPushSupported();
      if (!ok) {
        setPushOn(true); // 桌面瀏覽器不支援就當這步「不適用」
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setPushOn(!!sub);
    })();

    // 兩個都齊了就不用打擾
    setTimeout(() => {
      setShow(true);
    }, 1500);
  }, []);

  // 兩件事都做完就靜默關閉並標記
  useEffect(() => {
    if (installed && pushOn && show) {
      localStorage.setItem(STORAGE_KEY, "1");
      setShow(false);
    }
  }, [installed, pushOn, show]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  // 兩件都已完成 → 不彈
  if (installed && pushOn) return null;

  // 桌面只缺推播 → 不需要打擾(用戶也很少需要桌面推播)
  if (platform === "desktop" && installed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-sm p-0 sm:p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md bg-white rounded-t-[24px] sm:rounded-[var(--radius-card)] shadow-[var(--shadow-modal)] flex flex-col max-h-[90vh] overflow-hidden border border-[var(--color-paper-line)]"
          >
            <Sparkle className="absolute top-4 right-5 w-3 h-3 text-[var(--color-accent)]/55" />
            <Sparkle className="absolute top-9 right-12 w-2 h-2 text-[var(--color-accent)]/35" />

            <header className="px-6 pt-7 pb-3 text-center flex flex-col items-center gap-2">
              <HeartScribble className="w-7 h-7 text-[var(--color-accent)]" />
              <h2 className="font-serif text-2xl leading-tight">
                把 howu 帶在身邊
              </h2>
              <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed max-w-xs">
                兩個小步驟,讓每天的問卷不會錯過。
              </p>
            </header>

            <div className="px-5 pb-5 flex flex-col gap-3 overflow-y-auto">
              {/* 步驟 1:加到主畫面 */}
              <Step
                done={installed}
                index={1}
                title="加到主畫面"
                desc={
                  platform === "ios"
                    ? "Safari 點底下分享 → 加入主畫面 → 從桌面打開"
                    : platform === "android"
                      ? "Chrome 右上 ⋮ → 加入主畫面 → 從桌面打開"
                      : "桌面 Chrome / Edge:網址列右側「安裝」icon"
                }
              />

              {/* 步驟 2:開啟推播 */}
              <Step
                done={pushOn}
                index={2}
                title="開啟推播提醒"
                desc={
                  installed
                    ? "對方寫完了會通知你「換你了」,還沒寫晚上 20:00 也會提醒"
                    : "需要先把 howu 加到主畫面才能收到(iOS 限制)"
                }
              />

              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={"/install" as any}
                onClick={dismiss}
                className="mt-2 inline-flex items-center justify-center w-full h-12 rounded-[var(--radius-button)] bg-[var(--color-accent)] text-white text-base hover:bg-[var(--color-accent-deep)] transition-colors"
              >
                看完整教學 →
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] py-2"
              >
                我知道了,先不看
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({
  done,
  index,
  title,
  desc,
}: {
  done: boolean;
  index: number;
  title: string;
  desc: string;
}) {
  return (
    <div
      className={`relative rounded-[12px] border px-4 py-3 flex items-start gap-3 ${
        done
          ? "border-[var(--color-success)]/30 bg-green-50/60"
          : "border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)]/40"
      }`}
    >
      <span
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-serif tabular-nums text-sm ${
          done
            ? "bg-[var(--color-success)] text-white"
            : "bg-[var(--color-accent)] text-white"
        }`}
      >
        {done ? "✓" : index}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium leading-tight text-[var(--color-ink)]">
          {title}
        </p>
        <p className="text-xs text-[var(--color-ink-mid)] mt-1 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
