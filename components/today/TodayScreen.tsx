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
import { CoupleAvatars } from "@/components/ui/Avatar";
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
    <div className="rounded-[var(--radius-card)] border border-[var(--color-paper-line)] bg-gradient-to-br from-[var(--color-accent-soft)]/60 via-white to-[var(--color-paper-dim)]/40 px-4 py-4 flex items-center gap-3">
      <CoupleAvatars
        meName={meName}
        partnerName={partnerName}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-ink)] truncate leading-tight">
          {meName ?? t("today_completed.partner_label")}{" "}
          <span className="text-[var(--color-accent)] mx-0.5">&</span>{" "}
          {partnerName ?? t("today_completed.partner_label")}
        </p>
        <p className="text-[11px] text-[var(--color-ink-mid)] mt-0.5 tabular-nums">
          <span className="font-serif text-[var(--color-accent-deep)]">{dday}</span>
          <span className="ml-1">{t("memories.unit_days")}</span>
          <span className="mx-2 text-[var(--color-ink-soft)]">·</span>
          <span className="uppercase tracking-wider text-[10px]">{dateLabel}</span>
        </p>
      </div>
      {streak.current_streak > 0 && (
        <span className="shrink-0 inline-flex items-baseline gap-1 px-3 py-1.5 rounded-full bg-white border border-[var(--color-accent)]/25 shadow-sm">
          <span className="text-[var(--color-accent)] text-xs leading-none">✦</span>
          <span className="font-serif text-sm tabular-nums text-[var(--color-ink)]">
            {streak.current_streak}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-mid)]">
            {t("memories.unit_days")}
          </span>
        </span>
      )}
    </div>
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
        locale={profile?.locale ?? "zh-TW"}
      />
    </div>
  );
}
