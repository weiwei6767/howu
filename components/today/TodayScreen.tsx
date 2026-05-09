import { Link } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { todayISO, ddayCount } from "@/lib/utils/date";
import {
  getDailyPick,
  getNextPickerId,
  getCoupleTemplates,
  getTemplate,
} from "@/lib/today/picker";
import { getProfile, getTodayResponse, getPartnerTodayResponse, getStreak } from "@/lib/supabase/queries";
import { getPartnerProfile } from "@/lib/supabase/auth";
import { HeartScribble, Sparkle } from "@/components/ui/Ornaments";
import type { Couple } from "@/lib/supabase/queries";
import { TemplatePicker } from "./TemplatePicker";
import { TemplateQuestionnaire } from "./TemplateQuestionnaire";
import { TodayCompleted } from "./TodayCompleted";

interface Props {
  user: User;
  couple: Couple;
}

export async function TodayScreen({ user, couple }: Props) {
  const t = await getTranslations();
  const date = todayISO();
  const partnerId =
    couple.partner_a_id === user.id ? couple.partner_b_id : couple.partner_a_id;

  const [pick, nextPickerRaw, profile, partnerProfile, my, partner, streak] = await Promise.all([
    getDailyPick(couple.id, date),
    getNextPickerId(couple.id),
    getProfile(user.id),
    getPartnerProfile(user.id, couple),
    getTodayResponse(couple.id, user.id, date),
    partnerId ? getPartnerTodayResponse(couple.id, partnerId, date) : Promise.resolve(null),
    getStreak(couple.id),
  ]);

  const meName = profile?.display_name ?? null;
  const partnerName = partnerProfile?.display_name ?? null;
  const dday = ddayCount(couple.together_since);

  const d = new Date(`${date}T00:00:00`);
  const wd = String(d.getDay());
  const dateLabel = `${d.getMonth() + 1} / ${d.getDate()} · ${t(`weekday.${wd}` as "weekday.0")}`;

  const Header = (
    <section className="relative overflow-hidden rounded-[20px] border border-[var(--color-accent)]/25 bg-gradient-to-b from-white via-[var(--color-accent-soft)]/40 to-white px-5 pt-7 pb-6">
      {/* 角落小 sparkle 裝飾 */}
      <Sparkle className="absolute top-3 right-4 w-3 h-3 text-[var(--color-accent)]/50" />
      <Sparkle className="absolute bottom-4 left-5 w-2 h-2 text-[var(--color-accent)]/40" />

      {/* 名字 — 手寫感 */}
      <div className="text-center">
        <p
          className="text-[var(--color-ink)] leading-none"
          style={{ fontFamily: "var(--font-caveat), Georgia, serif", fontSize: "2rem" }}
        >
          {meName ?? t("today_completed.partner_label")}{" "}
          <span className="text-[var(--color-accent)]">&</span>{" "}
          {partnerName ?? t("today_completed.partner_label")}
        </p>
      </div>

      {/* D-Day 大數字 */}
      <div className="flex items-baseline justify-center gap-2 mt-4">
        <span className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-ink-mid)]">
          Day
        </span>
        <span
          className="font-serif tabular-nums text-[var(--color-accent-deep)] leading-none italic"
          style={{ fontSize: "3.5rem", letterSpacing: "-0.02em" }}
        >
          {dday}
        </span>
        <HeartScribble className="w-5 h-5 text-[var(--color-accent)]" />
      </div>

      {/* 日期 + streak 一行 */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-[var(--color-ink-mid)]">
        <span className="uppercase tracking-[0.18em]">{dateLabel}</span>
        {streak.current_streak > 0 && (
          <>
            <span className="text-[var(--color-ink-soft)]">·</span>
            <span className="inline-flex items-baseline gap-1">
              <Sparkle className="w-2.5 h-2.5 text-[var(--color-accent)]" />
              <span className="font-serif text-sm tabular-nums text-[var(--color-ink)]">
                {streak.current_streak}
              </span>
              <span className="uppercase tracking-wider">
                {t("memories.unit_days")}
              </span>
            </span>
          </>
        )}
      </div>
    </section>
  );

  if (!pick) {
    const myTurn = nextPickerRaw === user.id;
    if (myTurn) {
      const tpls = await getCoupleTemplates(couple.id);
      return (
        <>
          {Header}
          <TemplatePicker
            coupleId={couple.id}
            templates={tpls}
            streak={streak.current_streak}
          />
        </>
      );
    }
    return (
      <div className="flex flex-col gap-5">
        {Header}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-paper-line)] bg-gradient-to-b from-white to-[var(--color-accent-soft)]/30 py-14 px-6 flex flex-col items-center gap-4 text-center mt-2">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full bg-[var(--color-accent)]/15 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-[var(--color-accent)]/25" />
            <div className="absolute inset-4 rounded-full bg-[var(--color-accent)]" />
          </div>
          <p className="font-serif text-2xl leading-tight">
            {t("today_screen.partner_turn_today", {
              name: partnerName ?? t("today_completed.partner_label"),
            })}
          </p>
          <p className="text-sm text-[var(--color-ink-mid)] max-w-xs leading-relaxed">
            {t("today_screen.wait_partner_pick_body")}
          </p>
        </div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/templates" as any}
          className="text-center text-sm text-[var(--color-ink-mid)] underline underline-offset-2 hover:text-[var(--color-ink)] transition py-2"
        >
          {t("today_screen.manage_templates")}
        </Link>
      </div>
    );
  }

  const template = await getTemplate(pick.template_id);
  if (!template) {
    return (
      <div className="text-center text-sm text-[var(--color-ink-mid)] py-12">
        {t("today_screen.template_missing")}
      </div>
    );
  }

  if (my) {
    return (
      <>
        {Header}
        <TodayCompleted
          templateName={template.name}
          templateEmoji={template.emoji ?? ""}
          my={my}
          partner={partner}
          partnerName={partnerName}
          myName={meName}
          streak={streak}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {Header}
      <header className="flex flex-col gap-1 mt-2">
        <p className="text-xs text-[var(--color-accent-deep)] uppercase tracking-[0.18em]">
          {pick.picked_by === user.id
            ? t("today_screen.your_template")
            : t("today_screen.their_template", {
                name: partnerName ?? t("today_completed.partner_label"),
              })}
        </p>
        <h1 className="font-serif text-3xl flex items-center gap-2">
          {template.emoji && <span>{template.emoji}</span>}
          <span>{template.name}</span>
        </h1>
      </header>
      {partner && (
        <div className="border-l-2 border-[var(--color-accent)] pl-3 py-1 text-sm text-[var(--color-ink-mid)] -mt-2">
          ✦ {t("today_screen.partner_done_your_turn", {
            name: partnerName ?? t("today_completed.partner_label"),
          })}
        </div>
      )}
      <TemplateQuestionnaire
        coupleId={couple.id}
        userId={user.id}
        date={date}
        templateId={template.id}
        questions={template.questions}
        promises={template.promises}
        moodTagOptions={template.mood_tag_options}
        locale={profile?.locale ?? "zh-TW"}
      />
    </div>
  );
}
