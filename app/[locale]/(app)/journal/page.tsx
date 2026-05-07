import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils/date";
import { getActiveCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { getMyJournalMonth, getJournalEntry } from "@/lib/journal/queries";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalCalendar } from "@/components/journal/JournalCalendar";
import { Card } from "@/components/ui/Card";

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();
  const couple = await getActiveCouple(user.id);
  const partnerProfile = await getPartnerProfile(user.id, couple);

  const supabase = await createSupabaseServerClient();
  const date = todayISO();

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth() + 1;

  const [todayEntry, monthEntries, todayResp] = await Promise.all([
    getJournalEntry(user.id, date),
    getMyJournalMonth(user.id, yyyy, mm),
    couple
      ? supabase
          .from("daily_responses")
          .select("id")
          .eq("couple_id", couple.id)
          .eq("responder_id", user.id)
          .eq("date", date)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const todayResponseId = (todayResp.data as { id: string } | null)?.id ?? null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("journal.title")}</h1>

      <JournalEditor
        userId={user.id}
        partnerName={partnerProfile?.display_name ?? null}
        todayResponseId={todayResponseId}
        initial={{
          id: todayEntry?.id ?? null,
          content: todayEntry?.content ?? "",
          share: !!todayEntry?.shared_with_partner,
          attach: !!todayEntry?.attached_response_id,
          photos:
            todayEntry?.photos.map((p, i) => ({
              path: p.path,
              signedUrl: todayEntry.signed_photo_urls[i] ?? "",
            })) ?? [],
        }}
      />

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {yyyy} 年 {mm} 月
          </h2>
          <span className="text-xs text-zinc-400">點任一天打開那天</span>
        </header>
        <JournalCalendar year={yyyy} month={mm} entries={monthEntries} />
      </section>

      {monthEntries.length === 0 && (
        <Card className="text-center text-sm text-zinc-400 py-6">
          {t("journal.empty")}
        </Card>
      )}
    </div>
  );
}
