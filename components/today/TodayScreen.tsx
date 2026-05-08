import Link from "next/link";
import type { User } from "@supabase/supabase-js";
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

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function formatTodayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${WEEK[d.getDay()]}`;
}

export async function TodayScreen({ user, couple }: Props) {
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

  const Header = (
    <div className="flex items-center justify-between border-b border-[var(--color-paper-line)] pb-3">
      <div className="flex flex-col">
        <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-[0.2em]">
          {formatTodayLabel(date)}
        </span>
        <span className="text-sm text-[var(--color-ink)] mt-0.5">
          {meName ?? "你"} & {partnerName ?? "對方"}
        </span>
      </div>
      {streak.current_streak > 0 && (
        <span className="text-xs text-[var(--color-ink-mid)] tabular-nums">
          連續 {streak.current_streak} 天
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
          <p className="font-serif text-2xl">今天輪 {partnerName ?? "對方"} 選</p>
          <p className="text-xs text-[var(--color-ink-mid)] max-w-xs leading-relaxed">
            等他開好模板,你才能開始寫。
            可以提醒一下他。
          </p>
        </div>
        <Link
          href="/templates"
          className="text-center text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition"
        >
          管理模板
        </Link>
      </div>
    );
  }

  const template = await getTemplate(pick.template_id);
  if (!template) {
    return (
      <div className="text-center text-sm text-[var(--color-ink-mid)] py-12">
        今天的模板可能被刪了。請對方到「模板」重選。
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
          {pick.picked_by === user.id ? "你選的題本" : `${partnerName ?? "對方"} 選的題本`}
        </p>
        <h1 className="font-serif text-3xl flex items-center gap-2">
          {template.emoji && <span>{template.emoji}</span>}
          <span>{template.name}</span>
        </h1>
      </header>
      {partner && (
        <p className="text-xs text-[var(--color-ink-mid)] -mt-2">
          {partnerName ?? "對方"} 已寫完了 · 換你
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
