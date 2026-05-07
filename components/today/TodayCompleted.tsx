"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { DailyResponse } from "@/lib/supabase/queries";

interface Props {
  my: DailyResponse;
  partner: DailyResponse | null;
  partnerName: string | null;
  streak: { current_streak: number; longest_streak: number };
}

export function TodayCompleted({ my, partner, partnerName, streak }: Props) {
  const t = useTranslations();
  const partnerWaiting = !partner;

  return (
    <div className="flex flex-col gap-5">
      <motion.header
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center gap-3 pt-8"
      >
        <div className="text-5xl" aria-hidden>✨</div>
        <h1 className="text-2xl font-semibold">{t("questionnaire.submitted_title")}</h1>
        <p className="text-sm text-zinc-500 text-center max-w-xs">
          {t("questionnaire.submitted_body")}
        </p>
        {streak.current_streak > 0 && (
          <Badge tone="rose">🔥 {t("us.streak_title", { n: streak.current_streak })}</Badge>
        )}
      </motion.header>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("us.partner_status_title")}</span>
          {partnerWaiting ? (
            <Badge tone="neutral">{t("questionnaire.wait_partner")}</Badge>
          ) : (
            <Badge tone="rose">{t("questionnaire.partner_done")}</Badge>
          )}
        </div>
        {partner ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Cell label={t("questionnaire.fixed.happiness")} value={partner.happiness} />
            <Cell label={t("questionnaire.fixed.energy")} value={partner.energy} />
            <Cell label={t("questionnaire.fixed.stress")} value={partner.stress} />
            <Cell label={t("questionnaire.fixed.us_overall")} value={partner.us_overall} />
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            {partnerName ? `${partnerName} ` : ""}
            {t("questionnaire.partner_pending")}
          </p>
        )}
      </Card>

      <Card>
        <div className="text-xs text-zinc-400 mb-2">{t("questionnaire.section_fixed")}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Cell label={t("questionnaire.fixed.happiness")} value={my.happiness} mine />
          <Cell label={t("questionnaire.fixed.energy")} value={my.energy} mine />
          <Cell label={t("questionnaire.fixed.stress")} value={my.stress} mine />
          <Cell label={t("questionnaire.fixed.miss_partner")} value={my.miss_partner} mine />
          <Cell label={t("questionnaire.fixed.us_overall")} value={my.us_overall} mine />
        </div>
      </Card>

      <div className="text-center">
        <Link href="/us" className="text-sm text-[var(--color-rose)] underline">
          {t("nav.us")} →
        </Link>
      </div>
    </div>
  );
}

function Cell({ label, value, mine }: { label: string; value: number | null; mine?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
      <span className="text-zinc-500 text-xs">{label}</span>
      <span className={`tabular-nums font-semibold ${mine ? "" : "text-[var(--color-rose)]"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}
