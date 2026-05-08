"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
    <section className="text-center flex flex-col gap-4 py-12 max-w-sm mx-auto">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
        Paused
      </p>
      <h2 className="font-serif text-3xl">{t("disconnect.pause_title")}</h2>
      <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
        {t("disconnect.pause_body")}
      </p>
      <Button onClick={resume} loading={loading} className="self-center mt-2">
        {t("common.retry")}
      </Button>
    </section>
  );
}
