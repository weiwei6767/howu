import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

  if (!pick) {
    const myTurn = nextPickerRaw === user.id;
    if (myTurn) {
      const tpls = await getCoupleTemplates(couple.id);
      return (
        <TemplatePicker
          coupleId={couple.id}
          templates={tpls}
          streak={streak.current_streak}
        />
      );
    }
    return (
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">今天</h1>
          <p className="text-sm text-zinc-500">兩人每天輪流選模板</p>
        </header>
        <Card className="text-center bg-[var(--color-rose-soft)]/30 py-8 flex flex-col gap-2">
          <div className="text-4xl">⏳</div>
          <p className="text-sm">
            今天輪 {partnerProfile?.display_name ?? "對方"} 選 — 等他開模板,我們才開始寫
          </p>
        </Card>
        <Link href="/templates" className="text-center text-xs text-[var(--color-rose)] underline">
          管理 / 新建模板
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
      <TodayCompleted
        templateName={template.name}
        templateEmoji={template.emoji ?? "📝"}
        my={my}
        partner={partner}
        partnerName={partnerProfile?.display_name ?? null}
        streak={streak}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {template.emoji} {template.name}
          </h1>
          {streak.current_streak > 0 && (
            <Badge tone="rose">🔥 {streak.current_streak} 天</Badge>
          )}
        </div>
        <p className="text-sm text-zinc-500">
          今天 {pick.picked_by === user.id ? "你" : partnerProfile?.display_name ?? "對方"} 選的
        </p>
      </header>
      {partner && (
        <Card className="bg-[var(--color-rose-soft)]/30 py-3 px-4 shadow-none">
          <p className="text-sm">{partnerProfile?.display_name ?? "對方"} 已寫完了</p>
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
