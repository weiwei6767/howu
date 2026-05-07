"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import { FOUR_GRID_THEMES, type FourGridTheme } from "@/lib/four-grid/themes";

interface Props {
  coupleId: string;
  userId: string;
  date: string;
  theme: FourGridTheme;
  myPick: number | null;
  partnerPick: number | null;
  locale: string;
}

export function FourGridChooser({
  coupleId,
  userId,
  date,
  theme,
  myPick,
  partnerPick,
  locale,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const cells = FOUR_GRID_THEMES[theme];
  const [selected, setSelected] = useState<number | null>(myPick);
  const [submitting, setSubmitting] = useState(false);

  const matched = myPick !== null && partnerPick !== null && myPick === partnerPick;
  const both = myPick !== null && partnerPick !== null;

  async function submit() {
    if (selected === null) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("four_grid_responses").insert({
        couple_id: coupleId,
        responder_id: userId,
        date,
        theme,
        selected_index: selected,
      });
      if (error) {
        toast(error.message, { tone: "error" });
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("four_grid.title")}</h1>
          {matched && <Badge tone="rose">+30</Badge>}
        </div>
        <p className="text-sm text-zinc-500">
          {t(`four_grid.themes.${theme}`)} · {t("four_grid.pick_yours")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {cells.map((c, i) => {
          const mine = myPick === i;
          const partner = partnerPick === i;
          const same = mine && partner;
          const inactive = myPick !== null && !mine;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={myPick !== null}
              onClick={() => setSelected(i)}
              className={`aspect-square rounded-[var(--radius-card)] border flex flex-col items-center justify-center gap-2 transition relative ${
                same
                  ? "border-[var(--color-rose)] bg-[var(--color-rose-soft)]/40 ring-2 ring-[var(--color-rose)]"
                  : mine
                    ? "border-[var(--color-rose)] bg-[var(--color-rose-soft)]/20"
                    : selected === i
                      ? "border-[var(--color-rose)] bg-white"
                      : inactive
                        ? "border-zinc-100 bg-white opacity-50"
                        : "border-zinc-200 bg-white"
              }`}
            >
              <span className="text-5xl" aria-hidden>{c.emoji}</span>
              <span className="text-sm font-medium">
                {locale === "en" ? c.label_en : c.label_zh}
              </span>
              <div className="absolute top-2 right-2 flex gap-1">
                {mine && <Badge tone="rose">我</Badge>}
                {partner && <Badge tone="gold">對方</Badge>}
              </div>
            </motion.button>
          );
        })}
      </div>

      {myPick === null && (
        <Button onClick={submit} loading={submitting} disabled={selected === null} fullWidth size="lg">
          {t("common.submit")}
        </Button>
      )}

      {myPick !== null && !partnerPick && (
        <Card className="text-center text-sm text-zinc-500 py-4">
          {t("four_grid.wait_partner")}
        </Card>
      )}

      {both && (
        <Card className="text-center py-4">
          <p className="text-sm font-semibold">
            {matched ? t("four_grid.match_title") : t("four_grid.miss_title")}
          </p>
        </Card>
      )}
    </div>
  );
}
