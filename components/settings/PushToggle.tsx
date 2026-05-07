"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
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
      toast(`推播失敗:${r.reason ?? "unknown"}`, { tone: "error" });
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
      <Card>
        <p className="text-sm text-zinc-500">{t("settings.notifications")}</p>
        <p className="text-xs text-zinc-400 mt-1">這台裝置 / 瀏覽器不支援 Web Push。</p>
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{t("settings.notifications_daily")}</span>
        <span className="text-xs text-zinc-400">每天 20:00 提醒今日問卷</span>
      </div>
      {subscribed ? (
        <Button variant="secondary" onClick={turnOff} loading={loading} size="sm">
          {t("common.cancel")}
        </Button>
      ) : (
        <Button onClick={turnOn} loading={loading} size="sm">
          開啟
        </Button>
      )}
    </Card>
  );
}
