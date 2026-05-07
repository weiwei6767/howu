import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { DailyResponse } from "@/lib/supabase/queries";

interface Props {
  partnerName: string | null;
  partner: DailyResponse | null;
}

export async function PartnerToday({ partnerName, partner }: Props) {
  const t = await getTranslations();
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {partnerName ?? "對方"} · {t("common.today")}
        </h2>
        {partner ? (
          <Badge tone="rose">{t("questionnaire.partner_done")}</Badge>
        ) : (
          <Badge tone="neutral">{t("questionnaire.wait_partner")}</Badge>
        )}
      </div>
      {partner ? (
        <div className="grid grid-cols-2 gap-3">
          <Cell label={t("questionnaire.fixed.happiness")} value={partner.happiness} accent="#FFB300" />
          <Cell label={t("questionnaire.fixed.energy")} value={partner.energy} accent="#4CAF50" />
          <Cell label={t("questionnaire.fixed.stress")} value={partner.stress} accent="#E53935" />
          <Cell label={t("questionnaire.fixed.us_overall")} value={partner.us_overall} accent="#C2185B" />
        </div>
      ) : (
        <p className="text-sm text-zinc-400">{t("questionnaire.partner_pending")}</p>
      )}
      {partner?.mood_tags && partner.mood_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {partner.mood_tags.map((tg: string) => (
            <Badge key={tg} tone="rose">
              {/* tags 直接顯示 raw key,翻譯由 caller 端處理會更乾淨;此處先放 fallback */}
              #{tg}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

function Cell({ label, value, accent }: { label: string; value: number | null; accent: string }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-zinc-50 px-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="tabular-nums font-semibold" style={{ color: accent }}>
        {value ?? "—"}
      </span>
    </div>
  );
}
