import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireUser, requireCouple, getPartnerProfile } from "@/lib/supabase/auth";
import {
  getProfile,
  getPartnerTodayResponse,
  getMilestones,
  getStreak,
} from "@/lib/supabase/queries";
import { todayISO } from "@/lib/utils/date";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DDayCard } from "@/components/us/DDayCard";
import { MilestoneList } from "@/components/us/MilestoneList";
import { PartnerToday } from "@/components/us/PartnerToday";

export default async function UsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();
  const couple = await requireCouple(user.id);

  const partnerId = couple.partner_a_id === user.id ? couple.partner_b_id : couple.partner_a_id;
  const [me, partnerProfile, partnerToday, milestones, streak] = await Promise.all([
    getProfile(user.id),
    getPartnerProfile(user.id, couple),
    partnerId ? getPartnerTodayResponse(couple.id, partnerId, todayISO()) : Promise.resolve(null),
    getMilestones(couple.id),
    getStreak(couple.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <DDayCard
        togetherSince={couple.together_since}
        myName={me?.display_name ?? null}
        partnerName={partnerProfile?.display_name ?? null}
      />

      {streak.current_streak > 0 && (
        <Card className="flex items-center justify-between bg-gradient-to-br from-rose-50 to-amber-50 border border-amber-200">
          <div>
            <div className="text-sm text-zinc-500">連續一起寫</div>
            <div className="text-3xl font-semibold tabular-nums text-[var(--color-rose)]">
              🔥 {streak.current_streak} 天
            </div>
          </div>
          <div className="text-right text-xs text-zinc-500">
            最長 {streak.longest_streak} 天
          </div>
        </Card>
      )}

      <PartnerToday partnerName={partnerProfile?.display_name ?? null} partner={partnerToday} />

      <Card className="flex items-center gap-3">
        <span className="text-sm font-medium flex-1">{t("invite.relationship_type_label")}</span>
        <Badge tone="rose">
          {t(`invite.relationship_type.${couple.relationship_type ?? "same_city"}` as const)}
        </Badge>
      </Card>

      <MilestoneList coupleId={couple.id} milestones={milestones} />

      <Link
        href="/templates"
        className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 flex items-center gap-3 hover:shadow-md"
      >
        <span className="text-2xl">📝</span>
        <div className="flex-1">
          <div className="text-sm font-semibold">問卷模板</div>
          <div className="text-xs text-zinc-500">建立 / 管理你們自己的每日問卷</div>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>
    </div>
  );
}
