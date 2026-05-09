"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/db";

export function RecoveryBanner({ recoveryUntil }: { recoveryUntil: string | null }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const daysLeft = recoveryUntil
    ? Math.max(0, Math.ceil((new Date(recoveryUntil).getTime() - Date.now()) / 86400000))
    : 0;

  async function reconnect() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await callRpc(supabase, "reconnect_couple");
      if (error) throw new Error(error.message);
      toast(t("settings.save_success"), { tone: "success" });
      router.replace("/");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="no-print mb-8 rounded-[var(--radius-card)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent-deep)]">
          {t("disconnect.recovery_title")}
        </p>
        <p className="text-sm leading-relaxed text-[var(--color-ink)]">
          {t("disconnect.recovery_body", { n: daysLeft })}
        </p>
      </div>
      <Button onClick={reconnect} loading={loading} size="sm" className="shrink-0">
        {t("disconnect.reconnect")}
      </Button>
    </div>
  );
}
