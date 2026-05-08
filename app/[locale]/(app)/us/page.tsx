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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgPath = (couple as any).background_photo_path as string | null | undefined;
  const backgroundUrl = bgPath
    ? `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(bgPath)}`
    : null;

  const relType = couple.relationship_type ?? "same_city";

  return (
    <div className="flex flex-col gap-7">
      <DDayCard
        coupleId={couple.id}
        togetherSince={couple.together_since}
        myName={me?.display_name ?? null}
        partnerName={partnerProfile?.display_name ?? null}
        backgroundUrl={backgroundUrl}
      />

      {streak.current_streak > 0 && (
        <div className="flex items-baseline justify-between border-b border-[var(--color-paper-line)] pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
              {t("us.streak_continuous")}
            </p>
            <p className="font-serif text-3xl tabular-nums mt-1">
              {streak.current_streak}{" "}
              <span className="text-base text-[var(--color-ink-mid)]">
                {t("memories.unit_days")}
              </span>
            </p>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)]">
            {t("us.longest_streak", { n: streak.longest_streak })}
          </p>
        </div>
      )}

      <PartnerToday partnerName={partnerProfile?.display_name ?? null} partner={partnerToday} />

      <div className="flex items-center justify-between border-b border-[var(--color-paper-line)] pb-3">
        <span className="text-sm text-[var(--color-ink-mid)]">{t("invite.relationship_type_label")}</span>
        <span className="text-sm">
          {t(`invite.relationship_type.${relType}` as const)}
        </span>
      </div>

      <MilestoneList coupleId={couple.id} milestones={milestones} />

      <Link
        href="/templates"
        className="flex items-center justify-between py-4 border-t border-[var(--color-paper-line)] text-[var(--color-ink)] hover:text-[var(--color-ink-mid)] transition-colors"
      >
        <div>
          <p className="text-sm">{t("us.templates_link")}</p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
            {t("us.templates_link_sub")}
          </p>
        </div>
        <span className="text-[var(--color-ink-soft)]">→</span>
      </Link>
    </div>
  );
}
