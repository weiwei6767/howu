"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { isPushSupported, subscribePush, unsubscribePush } from "@/lib/push/client";

export function PushToggle() {
  const t = useTranslations();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      <section className="flex flex-col gap-1">
        <span className="text-sm text-[var(--color-ink-mid)]">
          {t("settings.notifications")}
        </span>
        <span className="text-xs text-[var(--color-ink-soft)]">
          {t("settings.push_unsupported")}
        </span>
      </section>
    );
  }

  return (
    <section className="flex items-center justify-between gap-3 border-b border-[var(--color-paper-line)] pb-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm">{t("settings.notifications_daily")}</span>
        <span className="text-xs text-[var(--color-ink-soft)]">
          {t("settings.push_daily_subtext")}
        </span>
      </div>
      {subscribed ? (
        <Button variant="secondary" onClick={turnOff} loading={loading} size="sm">
          {t("common.cancel")}
        </Button>
      ) : (
        <Button onClick={turnOn} loading={loading} size="sm">
          {t("settings.turn_on")}
        </Button>
      )}
    </section>
  );
}
