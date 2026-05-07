"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/db";

export function PausedScreen() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resume() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await callRpc(supabase, "resume_couple");
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
      <div className="text-4xl" aria-hidden>⏸️</div>
      <h2 className="text-lg font-semibold">{t("disconnect.pause_title")}</h2>
      <p className="text-sm text-zinc-500 leading-relaxed">{t("disconnect.pause_body")}</p>
      <Button onClick={resume} loading={loading} fullWidth>
        {t("common.retry")}
      </Button>
    </Card>
  );
}
