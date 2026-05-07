import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireUser, requireCouple, getPartnerProfile } from "@/lib/supabase/auth";
import {
  getProfile,
  getPartnerTodayResponse,
  getMilestones,
  getSyncScore,
} from "@/lib/supabase/queries";
import { todayISO } from "@/lib/utils/date";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DDayCard } from "@/components/us/DDayCard";
import { MilestoneList } from "@/components/us/MilestoneList";
import { PartnerToday } from "@/components/us/PartnerToday";
import { SyncTree } from "@/components/sync/SyncTree";

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
  const [me, partnerProfile, partnerToday, milestones, sync] = await Promise.all([
    getProfile(user.id),
    getPartnerProfile(user.id, couple),
    partnerId ? getPartnerTodayResponse(couple.id, partnerId, todayISO()) : Promise.resolve(null),
    getMilestones(couple.id),
    getSyncScore(couple.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <DDayCard
        togetherSince={couple.together_since}
        myName={me?.display_name ?? null}
        partnerName={partnerProfile?.display_name ?? null}
      />

      <Card className="flex flex-col items-center gap-2 py-6">
        <SyncTree level={sync?.level ?? 1} totalScore={sync?.total_score ?? 0} />
        <Link
          href="/leaderboard"
          className="text-xs text-[var(--color-rose)] underline mt-2"
        >
          {t("nav.leaderboard")} →
        </Link>
      </Card>

      <PartnerToday partnerName={partnerProfile?.display_name ?? null} partner={partnerToday} />

      <Card className="flex items-center gap-3">
        <span className="text-sm font-medium flex-1">{t("invite.relationship_type_label")}</span>
        <Badge tone="rose">
          {t(`invite.relationship_type.${couple.relationship_type ?? "same_city"}` as const)}
        </Badge>
      </Card>

      <MilestoneList coupleId={couple.id} milestones={milestones} />

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/four-grid"
          className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 text-center"
        >
          <div className="text-2xl mb-1">🎴</div>
          <div className="text-sm font-medium">{t("couple.four_grid")}</div>
        </Link>
        <Link
          href="/promises"
          className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] p-4 text-center"
        >
          <div className="text-2xl mb-1">🤝</div>
          <div className="text-sm font-medium">{t("couple.promises")}</div>
        </Link>
      </div>
    </div>
  );
}
