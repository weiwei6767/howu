"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/install" as any}
          className="rounded-[var(--radius-card)] border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent-soft)]/50 to-white px-4 py-3 flex items-center justify-between gap-3 active:opacity-90 transition-opacity"
        >
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-accent-deep)]">
              ✦ 需要先加到主畫面
            </p>
            <p className="text-sm mt-0.5 leading-snug">
              加到主畫面才能收到每日通知
            </p>
          </div>
          <span className="shrink-0 text-[var(--color-ink-soft)]">→</span>
        </Link>
      )}
    </section>
  );
}
