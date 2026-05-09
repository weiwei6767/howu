"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { isPushSupported, subscribePush, unsubscribePush } from "@/lib/push/client";

type Platform = "ios" | "android" | "desktop";

export function PushToggle() {
  const t = useTranslations();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) && !/(macos|crios|fxios)/.test(ua);
    const isAndroid = /android/.test(ua);
    setPlatform(isIos ? "ios" : isAndroid ? "android" : "desktop");
    const sa =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(window.navigator as any).standalone;
    setStandalone(sa);

    (async () => {
      const ok = await isPushSupported();
      setSupported(ok);
      if (!ok) return;
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(!!sub);
    })();
  }, []);

  async function turnOn() {
    setLoading(true);
    const r = await subscribePush();
    setLoading(false);
    if (r.success) {
      setSubscribed(true);
      toast(t("settings.save_success"), { tone: "success" });
    } else {
      toast(`${r.reason ?? "unknown"}`, { tone: "error" });
    }
  }

  async function turnOff() {
    setLoading(true);
    await unsubscribePush();
    setSubscribed(false);
    setLoading(false);
  }

  // 不支援 push
  if (!supported) {
    return (
      <section className="flex flex-col gap-1 border-b border-[var(--color-paper-line)] pb-4">
        <span className="text-sm">{t("settings.notifications")}</span>
        <span className="text-xs text-[var(--color-ink-soft)]">
          {t("settings.push_unsupported")}
        </span>
      </section>
    );
  }

  // iOS 必須加到主畫面才能收推播,Android 也建議
  const needsInstall = !standalone && (platform === "ios" || platform === "android");

  return (
    <section className="flex flex-col gap-3 border-b border-[var(--color-paper-line)] pb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm">{t("settings.notifications_daily")}</span>
          <span className="text-xs text-[var(--color-ink-soft)]">
            {t("settings.push_daily_subtext")}
          </span>
        </div>
        {!needsInstall && (
          <div className="shrink-0">
            {subscribed ? (
              <Button variant="secondary" onClick={turnOff} loading={loading} size="sm">
                {t("common.cancel")}
              </Button>
            ) : (
              <Button onClick={turnOn} loading={loading} size="sm">
                {t("settings.turn_on")}
              </Button>
            )}
          </div>
        )}
      </div>

      {needsInstall && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-paper-line)] bg-[var(--color-paper-dim)] px-4 py-3 flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-accent-deep)]">
            ✦ 把 howu 加到主畫面才能收到每日通知
          </p>
          {platform === "ios" ? (
            <ol className="flex flex-col gap-1.5 text-xs text-[var(--color-ink-mid)] leading-relaxed pl-1">
              <Step n={1}>
                用 Safari 打開 howu.online(其他瀏覽器收不到推播)
              </Step>
              <Step n={2}>
                點底下中間的「分享」按鈕(框框 + 向上箭頭)
              </Step>
              <Step n={3}>選單滑下去找「加入主畫面」並按右上「加入」</Step>
              <Step n={4}>從主畫面打開 howu,再回來這裡按「開啟」</Step>
            </ol>
          ) : (
            <ol className="flex flex-col gap-1.5 text-xs text-[var(--color-ink-mid)] leading-relaxed pl-1">
              <Step n={1}>用 Chrome 打開 howu.online</Step>
              <Step n={2}>右上角選單 ⋮ → 「加入主畫面」</Step>
              <Step n={3}>從主畫面打開 howu,再回來這裡按「開啟」</Step>
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="font-serif text-[var(--color-ink)] tabular-nums w-4 shrink-0">
        {n}.
      </span>
      <span className="flex-1">{children}</span>
    </li>
  );
}
