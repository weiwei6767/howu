"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/db";

interface Props {
  recoveryUntil: string | null;
}

export function RecoveryScreen({ recoveryUntil }: Props) {
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
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="text-center flex flex-col gap-4 py-10">
      <div className="text-4xl" aria-hidden>🌱</div>
      <h2 className="text-lg font-semibold">{t("disconnect.recovery_title")}</h2>
      <p className="text-sm text-zinc-500 leading-relaxed">
        {t("disconnect.recovery_body", { n: daysLeft })}
      </p>
      <Button onClick={reconnect} loading={loading} fullWidth>
        {t("disconnect.reconnect")}
      </Button>
    </Card>
  );
}
