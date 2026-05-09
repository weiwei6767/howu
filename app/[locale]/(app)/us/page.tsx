import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireUser, requireCouple, getPartnerProfile } from "@/lib/supabase/auth";
import {
  getProfile,
  getMilestones,
  getStreak,
} from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DDayCard } from "@/components/us/DDayCard";
import { MilestoneList } from "@/components/us/MilestoneList";
import { WeeklySnapshot } from "@/components/us/WeeklySnapshot";

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

  const [me, partnerProfile, milestones, streak] = await Promise.all([
    getProfile(user.id),
    getPartnerProfile(user.id, couple),
    getMilestones(couple.id),
    getStreak(couple.id),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgPath = (couple as any).background_photo_path as string | null | undefined;
  const backgroundUrl = bgPath
    ? `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(bgPath)}`
    : null;

  const relType = couple.relationship_type ?? "same_city";

  // Asia/Taipei「現在」
  const tpNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }),
  );

  // 本週(週一 → 週日)
  const dow = tpNow.getDay();
  const monOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(tpNow);
  monday.setDate(monday.getDate() + monOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const weekStart = ymd(monday);
  const weekEnd = ymd(sunday);

  // 本月
  const monthStart = ymd(new Date(tpNow.getFullYear(), tpNow.getMonth(), 1));
  const monthEnd = ymd(new Date(tpNow.getFullYear(), tpNow.getMonth() + 1, 0));

  // 今年
  const yearStart = ymd(new Date(tpNow.getFullYear(), 0, 1));
  const yearEnd = ymd(new Date(tpNow.getFullYear(), 11, 31));

  const supabase = await createSupabaseServerClient();
  // 拉一整年的 responses(只 mood 相關欄位),client 端再依切換的時間區間 filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: yearRespRaw } = await (supabase as any)
    .from("daily_responses")
    .select("date, mood_tags, rotating_answers")
    .eq("couple_id", couple.id)
    .gte("date", yearStart)
    .lte("date", yearEnd);

  // 本週瞬間(照片仍然只看本週,不跟著切)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: weekPhotosRaw } = await (supabase as any)
    .from("shared_photos")
    .select("id, url, caption, taken_at")
    .eq("couple_id", couple.id)
    .gte("taken_at", weekStart)
    .lte("taken_at", weekEnd)
    .order("taken_at", { ascending: false })
    .limit(9);

  const yearResponses = yearRespRaw ?? [];
  const weekPhotos = (weekPhotosRaw ?? []).filter(
    (p: { url: string }) => p.url && !p.url.includes("/bg/"),
  );

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

      <WeeklySnapshot
        coupleId={couple.id}
        responses={yearResponses}
        photos={weekPhotos}
        weekStart={weekStart}
        weekEnd={weekEnd}
        monthStart={monthStart}
        monthEnd={monthEnd}
        yearStart={yearStart}
        yearEnd={yearEnd}
      />

      <div className="flex items-center justify-between border-b border-[var(--color-paper-line)] pb-3">
        <span className="text-sm text-[var(--color-ink-mid)]">{t("invite.relationship_type_label")}</span>
        <span className="text-sm">
          {t(`invite.relationship_type.${relType}` as const)}
        </span>
      </div>

      <MilestoneList coupleId={couple.id} milestones={milestones} />

      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/templates" as any}
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
