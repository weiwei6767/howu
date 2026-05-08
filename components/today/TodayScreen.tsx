import { Link } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { todayISO } from "@/lib/utils/date";
import {
  getDailyPick,
  getNextPickerId,
  getCoupleTemplates,
  getTemplate,
} from "@/lib/today/picker";
import { getProfile, getTodayResponse, getPartnerTodayResponse, getStreak } from "@/lib/supabase/queries";
import { getPartnerProfile } from "@/lib/supabase/auth";
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

  const d = new Date(`${date}T00:00:00`);
  const wd = String(d.getDay());
  const dateLabel = `${d.getMonth() + 1} / ${d.getDate()} · ${t(`weekday.${wd}` as "weekday.0")}`;

  const Header = (
    <div className="flex items-center justify-between border-b border-[var(--color-paper-line)] pb-3">
      <div className="flex flex-col">
        <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-[0.2em]">
          {dateLabel}
        </span>
        <span className="text-sm text-[var(--color-ink)] mt-0.5">
          {meName ?? t("today_completed.partner_label")} & {partnerName ?? t("today_completed.partner_label")}
        </span>
      </div>
      {streak.current_streak > 0 && (
        <span className="text-xs text-[var(--color-ink-mid)] tabular-nums">
          {t("today_screen.streak_short", { n: streak.current_streak })}
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
        <div className="surface py-12 px-6 flex flex-col items-center gap-3 text-center mt-2">
          <p className="font-serif text-2xl">
            {t("today_screen.partner_turn_today", {
              name: partnerName ?? t("today_completed.partner_label"),
            })}
          </p>
          <p className="text-xs text-[var(--color-ink-mid)] max-w-xs leading-relaxed">
            {t("today_screen.wait_partner_pick_body")}
          </p>
        </div>
        <Link
          href="/templates"
          className="text-center text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition"
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
        <p className="text-xs text-[var(--color-ink-soft)] uppercase tracking-[0.18em]">
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
        <p className="text-xs text-[var(--color-ink-mid)] -mt-2">
          {t("today_screen.partner_done_your_turn", {
            name: partnerName ?? t("today_completed.partner_label"),
          })}
        </p>
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
