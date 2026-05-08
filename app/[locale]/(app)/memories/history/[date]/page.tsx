import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TodayCompleted } from "@/components/today/TodayCompleted";
import type { DailyResponse } from "@/lib/supabase/queries";

type ResponseRow = DailyResponse;

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function HistoryDatePage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  if (!isValidDate(date)) notFound();

  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  const { data: respRaw, error: respErr } = await supabase
    .from("daily_responses")
    .select("*")
    .eq("couple_id", couple.id)
    .eq("date", date);

  if (respErr) console.error("[history detail] query error:", respErr.message);

  const responses = (respRaw as ResponseRow[] | null) ?? [];
  const my = responses.find((r) => r.responder_id === user.id) ?? null;
  const partnerResp = responses.find((r) => r.responder_id !== user.id) ?? null;

  const [me, partnerProfile] = await Promise.all([
    getProfile(user.id),
    getPartnerProfile(user.id, couple),
  ]);

  if (!my && !partnerResp) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href="/memories/history"
          className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          ← {t("memories.history_title")}
        </Link>
        <p className="text-sm text-[var(--color-ink-soft)] py-12 text-center">
          {t("memories.history_no_record_for_day")}
        </p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tplId = ((my as any)?.template_id ?? (partnerResp as any)?.template_id ?? null) as string | null;
  let templateName = "—";
  let templateEmoji = "";
  if (tplId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tpl } = await (supabase as any)
      .from("templates")
      .select("name, emoji")
      .eq("id", tplId)
      .maybeSingle();
    if (tpl) {
      templateName = (tpl as { name: string }).name;
      templateEmoji = (tpl as { emoji: string | null }).emoji ?? "";
    }
  }

  const d = new Date(`${date}T00:00:00`);
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const wd = String(d.getDay());

  const myFor = (my as unknown as DailyResponse) ?? null;
  const partnerFor = (partnerResp as unknown as DailyResponse | null) ?? null;
  const partnerName = partnerProfile?.display_name ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/memories/history"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        ← {ym}
      </Link>
      {myFor ? (
        <TodayCompleted
          templateName={templateName}
          templateEmoji={templateEmoji}
          my={myFor}
          partner={partnerFor}
          partnerName={partnerName}
          myName={me?.display_name ?? null}
          streak={{ current_streak: 0, longest_streak: 0 }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            {date}
          </p>
          <h1 className="font-serif text-2xl">
            {t("common.month_day", { m: d.getMonth() + 1, d: d.getDate() })} ·{" "}
            {t(`weekday.${wd}` as "weekday.0")}
          </h1>
          <p className="text-sm text-[var(--color-ink-mid)]">
            {t("memories.history_only_partner", {
              name: partnerName ?? t("today_completed.partner_label"),
            })}
          </p>
          <div className="border-l-2 border-[var(--color-accent)] pl-4 py-1 mt-3">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
              {templateEmoji} {templateName}
            </p>
            <ul className="flex flex-col gap-3 mt-2">
              {Array.isArray(partnerResp?.rotating_answers) &&
                (partnerResp!.rotating_answers as Array<{ text?: string; value: unknown }>).map(
                  (a, i) => (
                    <li key={i} className="text-sm">
                      <p className="text-[var(--color-ink-mid)]">
                        {a.text ?? t("today_screen.no_question")}
                      </p>
                      <p className="mt-0.5 text-[var(--color-ink)]">
                        {Array.isArray(a.value)
                          ? a.value.join("、")
                          : String(a.value ?? "—")}
                      </p>
                    </li>
                  ),
                )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
