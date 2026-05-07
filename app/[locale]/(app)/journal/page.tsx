import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils/date";
import { getActiveCouple } from "@/lib/supabase/auth";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalList } from "@/components/journal/JournalList";

interface Entry {
  id: string;
  date: string;
  content: string | null;
  shared_with_partner: boolean | null;
  attached_response_id: string | null;
}

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

  const supabase = await createSupabaseServerClient();

  const date = todayISO();
  const [{ data: entriesRaw }, { data: todayResp }, { data: todayEntryRaw }] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, date, content, shared_with_partner, attached_response_id")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100),
    couple
      ? supabase
          .from("daily_responses")
          .select("id")
          .eq("couple_id", couple.id)
          .eq("responder_id", user.id)
          .eq("date", date)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("journal_entries")
      .select("id, content, shared_with_partner, attached_response_id")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
  ]);
  const entries = (entriesRaw as Entry[] | null) ?? [];
  const todayEntry = todayEntryRaw as
    | { id: string; content: string | null; shared_with_partner: boolean | null; attached_response_id: string | null }
    | null;
  const todayResponseId = (todayResp as { id: string } | null)?.id ?? null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t("journal.title")}</h1>
      <JournalEditor
        userId={user.id}
        todayResponseId={todayResponseId}
        initial={{
          id: todayEntry?.id ?? null,
          content: todayEntry?.content ?? "",
          share: !!todayEntry?.shared_with_partner,
          attach: !!todayEntry?.attached_response_id,
        }}
      />
      <JournalList entries={entries.filter((e) => e.date !== date)} />
    </div>
  );
}
