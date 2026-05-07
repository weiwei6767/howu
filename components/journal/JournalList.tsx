"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Entry {
  id: string;
  date: string;
  content: string | null;
  shared_with_partner: boolean | null;
  attached_response_id: string | null;
}

export function JournalList({ entries }: { entries: Entry[] }) {
  const t = useTranslations();
  const router = useRouter();

  async function remove(id: string) {
    if (!confirm(t("journal.delete_confirm"))) return;
    const supabase = createClient();
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) toast(error.message, { tone: "error" });
    else router.refresh();
  }

  if (!entries.length) {
    return (
      <p className="text-center text-sm text-zinc-400 py-8">{t("journal.empty")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((e) => (
        <Card key={e.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{e.date}</span>
            <div className="flex items-center gap-2">
              {e.shared_with_partner ? (
                <Badge tone="rose">{t("journal.shared")}</Badge>
              ) : (
                <Badge tone="neutral">{t("journal.private_note")}</Badge>
              )}
              <button onClick={() => remove(e.id)} className="hover:text-red-500">
                {t("common.delete")}
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{e.content}</p>
        </Card>
      ))}
    </div>
  );
}
