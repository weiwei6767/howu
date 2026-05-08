"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { callRpc } from "@/lib/supabase/db";
import type { Couple } from "@/lib/supabase/queries";

export function CoupleSettings({ couple }: { couple: Couple }) {
  const t = useTranslations();
  const router = useRouter();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [discOpen, setDiscOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function pause() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await callRpc(supabase, "pause_couple");
      if (error) throw new Error(error.message);
      toast(t("settings.save_success"), { tone: "success" });
      setPauseOpen(false);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await callRpc(supabase, "start_disconnect");
      if (error) throw new Error(error.message);
      toast(t("settings.save_success"), { tone: "success" });
      setDiscOpen(false);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm text-[var(--color-ink-mid)] uppercase tracking-[0.18em]">
        {t("settings.relationship")}
      </h2>

      <div className="flex items-baseline justify-between border-b border-[var(--color-paper-line)] pb-3">
        <span className="text-sm text-[var(--color-ink-mid)]">狀態</span>
        <span className="text-sm">{couple.status ?? "—"}</span>
      </div>
      <div className="flex items-baseline justify-between border-b border-[var(--color-paper-line)] pb-3">
        <span className="text-sm text-[var(--color-ink-mid)]">
          {t("settings.relationship_type")}
        </span>
        <span className="text-sm">
          {t(`invite.relationship_type.${couple.relationship_type ?? "same_city"}` as const)}
        </span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setPauseOpen(true)} fullWidth size="sm">
          {t("settings.pause_relationship")}
        </Button>
        <Button variant="danger" onClick={() => setDiscOpen(true)} fullWidth size="sm">
          {t("settings.disconnect")}
        </Button>
      </div>

      <Modal
        open={pauseOpen}
        onClose={() => setPauseOpen(false)}
        title={t("disconnect.pause_title")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPauseOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={pause} loading={loading}>
              {t("disconnect.pause_confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed">{t("disconnect.pause_body")}</p>
      </Modal>

      <Modal
        open={discOpen}
        onClose={() => setDiscOpen(false)}
        title={t("disconnect.disconnect_title")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDiscOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={disconnect} loading={loading}>
              {t("disconnect.disconnect_confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed">{t("disconnect.disconnect_body")}</p>
      </Modal>
    </section>
  );
}
