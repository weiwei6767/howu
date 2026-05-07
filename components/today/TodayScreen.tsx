import { getTranslations } from "next-intl/server";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getProfile,
  getTodayResponse,
  getPartnerTodayResponse,
  getRecentQuestionIds,
  getEligibleQuestions,
  getStreak,
  type Couple,
} from "@/lib/supabase/queries";
import { todayISO } from "@/lib/utils/date";
import { selectTodayQuestions } from "@/lib/questions/selector";
import type { RotatingQuestion } from "@/lib/questions/rotating";
import { TodayCompleted } from "./TodayCompleted";
import { TodayQuestionnaire } from "./TodayQuestionnaire";

interface Props {
  user: User;
  couple: Couple;
}

export async function TodayScreen({ user, couple }: Props) {
  const t = await getTranslations();
  const date = todayISO();
  const partnerId =
    couple.partner_a_id === user.id ? couple.partner_b_id : couple.partner_a_id;

  const [my, partner, profile, partnerProfile, streak] = await Promise.all([
    getTodayResponse(couple.id, user.id, date),
    partnerId ? getPartnerTodayResponse(couple.id, partnerId, date) : Promise.resolve(null),
    getProfile(user.id),
    partnerId ? getProfile(partnerId) : Promise.resolve(null),
    getStreak(couple.id),
  ]);

  const isPremium = !!(profile?.is_premium || partnerProfile?.is_premium);

  if (my) {
    return (
      <TodayCompleted
        my={my}
        partner={partner}
        partnerName={partnerProfile?.display_name ?? null}
        streak={streak}
      />
    );
  }

  // 還沒寫 → 載入今日題
  const recentIds = await getRecentQuestionIds(couple.id, 14);
  const allQuestions = await getEligibleQuestions(
    couple.relationship_type ?? "same_city",
    isPremium,
  );
  const pool: RotatingQuestion[] = allQuestions.map((q) => ({
    id: q.id,
    category: q.category as RotatingQuestion["category"],
    type: q.type as RotatingQuestion["type"],
    text_zh: q.text_zh,
    text_en: q.text_en,
    options_zh: (q.options_zh as string[] | null) ?? undefined,
    options_en: (q.options_en as string[] | null) ?? undefined,
    for_relationship_types: (q.for_relationship_types ?? []) as RotatingQuestion["for_relationship_types"],
    is_premium: !!q.is_premium,
    weight: q.weight ?? 1,
  }));
  const todayQuestions = selectTodayQuestions({
    pool,
    excludeIds: new Set(recentIds),
    relationshipType: (couple.relationship_type ?? "same_city") as "cohabit" | "same_city" | "long_distance",
    isPremiumCouple: isPremium,
    coupleId: couple.id,
    dateISO: date,
  });

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("questionnaire.title")}</h1>
          {streak.current_streak > 0 && (
            <Badge tone="rose">🔥 {t("us.streak_title", { n: streak.current_streak })}</Badge>
          )}
        </div>
        <p className="text-sm text-zinc-500">{t("questionnaire.subtitle")}</p>
      </header>

      {partner && !my && (
        <Card className="bg-[var(--color-rose-soft)]/30 py-3 px-4 shadow-none">
          <p className="text-sm">{t("questionnaire.partner_done")}</p>
        </Card>
      )}

      <TodayQuestionnaire
        coupleId={couple.id}
        userId={user.id}
        date={date}
        questions={todayQuestions}
        locale={profile?.locale ?? "zh-TW"}
      />
    </div>
  );
}
