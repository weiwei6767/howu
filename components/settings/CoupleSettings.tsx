"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
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
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">{t("settings.relationship")}</span>
        <Badge tone={couple.status === "active" ? "rose" : "neutral"}>
          {couple.status ?? "—"}
        </Badge>
      </div>
      <p className="text-sm text-zinc-500">
        {t("settings.relationship_type")}:{" "}
        {t(`invite.relationship_type.${couple.relationship_type ?? "same_city"}` as const)}
      </p>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setPauseOpen(true)} fullWidth>
          {t("settings.pause_relationship")}
        </Button>
        <Button variant="danger" onClick={() => setDiscOpen(true)} fullWidth>
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
    </Card>
  );
}
