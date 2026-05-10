"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { isPushSupported, subscribePush, unsubscribePush } from "@/lib/push/client";

type Platform = "ios" | "android" | "desktop";

const REASON_LABEL: Record<string, string> = {
  unsupported: "這台裝置 / 瀏覽器不支援 Web Push",
  no_sw: "Service Worker 沒註冊,試試重新載入頁面",
  denied: "推播權限被拒絕,請到系統設定 → 通知 找到 howu 開啟",
  no_vapid_key: "推播尚未設定(VAPID 金鑰缺失),請聯絡 hello@loamia.xyz",
  invalid_vapid_key: "VAPID 金鑰格式有問題,請聯絡 hello@loamia.xyz",
  invalid_subscription: "訂閱資料異常",
  register_failed: "上傳訂閱失敗,稍後再試",
};

function reasonLabel(reason: string): string {
  if (REASON_LABEL[reason]) return REASON_LABEL[reason];
  if (reason.startsWith("subscribe_failed:")) {
    return `推播訂閱失敗:${reason.slice("subscribe_failed:".length)}`;
  }
  if (reason.startsWith("error:")) {
    return `推播啟用錯誤:${reason.slice("error:".length)}`;
  }
  return `推播啟用失敗(${reason})`;
}

export function PushToggle() {
  const t = useTranslations();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [permState, setPermState] = useState<NotificationPermission | null>(null);

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

    if (typeof Notification !== "undefined") {
      setPermState(Notification.permission);
    }

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
    try {
      const r = await subscribePush();
      if (r.success) {
        setSubscribed(true);
        if (typeof Notification !== "undefined") setPermState(Notification.permission);
        toast(t("settings.save_success"), { tone: "success" });
      } else {
        const reason = r.reason ?? "unknown";
        if (typeof Notification !== "undefined") setPermState(Notification.permission);
        console.error("[push] subscribe failed:", reason);
        toast(reasonLabel(reason), { tone: "error", duration: 7000 });
      }
    } catch (e) {
      console.error("[push] turnOn threw:", e);
      toast(`推播啟用失敗:${(e as Error).message}`, { tone: "error", duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  async function turnOff() {
    setLoading(true);
    try {
      await unsubscribePush();
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
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
  const denied = permState === "denied";

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

      {!needsInstall && denied && !subscribed && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-danger)]/30 bg-red-50/60 px-4 py-3 text-xs text-[var(--color-ink)] leading-relaxed">
          推播權限之前被拒絕。請到{" "}
          <span className="font-medium">
            {platform === "ios"
              ? "設定 → 通知 → howu"
              : platform === "android"
                ? "系統設定 → 通知 → howu"
                : "瀏覽器網址列左側鎖頭 → 通知"}
          </span>{" "}
          手動允許,然後回到這裡按開啟。
        </div>
      )}
    </section>
  );
}
