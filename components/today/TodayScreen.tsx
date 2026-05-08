import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CoupleAvatars } from "@/components/ui/Avatar";
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
    <div className="flex items-center justify-between gap-3 pt-2">
      <div className="flex items-center gap-3">
        <CoupleAvatars meName={meName} partnerName={partnerName} size="md" />
        <div className="flex flex-col">
          <span className="text-[11px] text-zinc-400 leading-none">{formatTodayLabel(date)}</span>
          <span className="text-sm font-medium leading-tight mt-0.5">
            {meName ?? "你"} <span className="text-[var(--color-rose)]">&</span>{" "}
            {partnerName ?? "對方"}
          </span>
        </div>
      </div>
      {streak.current_streak > 0 && (
        <Badge tone="rose">🔥 {streak.current_streak} 天</Badge>
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
          <div className="mt-2">
            <TemplatePicker
              coupleId={couple.id}
              templates={tpls}
              streak={streak.current_streak}
            />
          </div>
        </>
      );
    }
    return (
      <div className="flex flex-col gap-5">
        {Header}
        <Card className="text-center bg-gradient-to-br from-rose-50 via-amber-50 to-cream py-12 flex flex-col gap-3 border border-rose-100">
          <div className="text-5xl">⏳</div>
          <p className="text-base font-medium">
            今天輪 {partnerName ?? "對方"} 選
          </p>
          <p className="text-xs text-zinc-500">
            等他開模板,我們才開始寫
          </p>
        </Card>
        <Link
          href="/templates"
          className="text-center text-xs text-zinc-400 hover:text-[var(--color-rose)] transition"
        >
          ⚙️ 管理模板
        </Link>
      </div>
    );
  }

  const template = await getTemplate(pick.template_id);
  if (!template) {
    return (
      <div className="text-center text-sm text-zinc-500 py-12">
        今天的模板可能被刪了。請對方到 /templates 重選。
      </div>
    );
  }

  if (my) {
    return (
      <>
        {Header}
        <TodayCompleted
          templateName={template.name}
          templateEmoji={template.emoji ?? "📝"}
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
    <div className="flex flex-col gap-5">
      {Header}
      <header className="flex flex-col gap-1">
        <p className="text-xs text-zinc-500">
          今天 {pick.picked_by === user.id ? "你" : partnerName ?? "對方"} 選的 ↓
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {template.emoji} {template.name}
        </h1>
      </header>
      {partner && (
        <Card className="bg-gradient-to-r from-rose-50 to-amber-50 py-3 px-4 shadow-none border border-rose-100">
          <p className="text-sm">{partnerName ?? "對方"} 已寫完了 ✨ 換你</p>
        </Card>
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
