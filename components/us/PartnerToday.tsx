import { getTranslations } from "next-intl/server";
import type { DailyResponse } from "@/lib/supabase/queries";

interface Props {
  partnerName: string | null;
  partner: DailyResponse | null;
}

export async function PartnerToday({ partnerName, partner }: Props) {
  const t = await getTranslations();
  return (
    <section className="border-b border-[var(--color-paper-line)] pb-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-[var(--color-ink-mid)]">
          {partnerName ?? "對方"} · {t("common.today")}
        </h2>
        <span className="text-xs text-[var(--color-ink-soft)]">
          {partner ? t("questionnaire.partner_done") : t("questionnaire.wait_partner")}
        </span>
      </header>

      {partner ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Cell label={t("questionnaire.fixed.happiness")} value={partner.happiness} />
          <Cell label={t("questionnaire.fixed.energy")} value={partner.energy} />
          <Cell label={t("questionnaire.fixed.stress")} value={partner.stress} />
          <Cell label={t("questionnaire.fixed.us_overall")} value={partner.us_overall} />
        </div>
      ) : (
        <p className="text-sm text-[var(--color-ink-soft)]">
          {t("questionnaire.partner_pending")}
        </p>
      )}

      {partner?.mood_tags && partner.mood_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3">
          {partner.mood_tags.map((tg: string) => (
            <span
              key={tg}
              className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-paper-line)] text-[var(--color-ink-mid)]"
            >
              {tg}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Cell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-[var(--color-ink-soft)]">{label}</span>
      <span className="font-serif text-lg tabular-nums text-[var(--color-ink)]">
        {value ?? "—"}
      </span>
    </div>
  );
}
