import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  is_archived: boolean | null;
  created_at: string | null;
  question_count?: number;
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tplRaw } = await (supabase as any)
    .from("templates")
    .select("id, name, description, emoji, is_archived, created_at")
    .eq("couple_id", couple.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  const tpls = (tplRaw as TemplateRow[] | null) ?? [];

  const templateIds = tpls.map((tp) => tp.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: qRaw } = templateIds.length
    ? await (supabase as any)
        .from("template_questions")
        .select("template_id")
        .in("template_id", templateIds)
    : { data: [] };
  const counts = new Map<string, number>();
  for (const r of (qRaw as Array<{ template_id: string }> | null) ?? []) {
    counts.set(r.template_id, (counts.get(r.template_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
            Templates
          </p>
          <h1 className="font-serif text-3xl mt-1">{t("templates.title")}</h1>
        </div>
        <Link href="/templates/new">
          <Button size="sm">{t("common.add")}</Button>
        </Link>
      </header>

      <p className="text-sm text-[var(--color-ink-mid)] leading-relaxed">
        {t("templates.intro")}
      </p>

      {tpls.length === 0 ? (
        <div className="surface text-center text-sm text-[var(--color-ink-soft)] py-12">
          {t("templates.empty")}
        </div>
      ) : (
        <ul className="flex flex-col">
          {tpls.map((tp) => (
            <li
              key={tp.id}
              className="border-b border-[var(--color-paper-line)] last:border-b-0"
            >
              <Link
                href={`/templates/${tp.id}`}
                className="flex items-center gap-4 py-4 group"
              >
                <span className="text-xl w-8 text-center" aria-hidden>
                  {tp.emoji ?? ""}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-[var(--color-ink)] group-hover:text-[var(--color-ink-mid)] transition-colors">
                    {tp.name}
                  </div>
                  {tp.description && (
                    <p className="text-xs text-[var(--color-ink-mid)] mt-0.5 line-clamp-1">
                      {tp.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
                  {t("templates.n_questions", { n: counts.get(tp.id) ?? 0 })}
                </span>
                <span className="text-[var(--color-ink-soft)]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
