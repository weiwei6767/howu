import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, requireCouple } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMilestones } from "@/lib/supabase/queries";
import { nextSpecialDays, daysUntil } from "@/lib/special-days";
import { PhotoUpload } from "@/components/memories/PhotoUpload";
import { PhotoGrid } from "@/components/memories/PhotoGrid";

interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
}

interface ResponseRow {
  date: string;
  responder_id: string;
  template_id: string | null;
}

interface TemplateRow {
  id: string;
  name: string;
  emoji: string | null;
}

export default async function MemoriesPage({
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

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth() + 1;
  const monthStart = new Date(yyyy, mm - 1, 1).toISOString().slice(0, 10);
  const monthEnd = new Date(yyyy, mm, 0).toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: respRaw } = await (supabase as any)
    .from("daily_responses")
    .select("date, responder_id, template_id")
    .eq("couple_id", couple.id)
    .gte("date", monthStart)
    .lte("date", monthEnd);
  const responses = (respRaw as ResponseRow[] | null) ?? [];

  const dayResponders = new Map<string, Set<string>>();
  for (const r of responses) {
    const set = dayResponders.get(r.date) ?? new Set();
    set.add(r.responder_id);
    dayResponders.set(r.date, set);
  }
  const daysBothDone = Array.from(dayResponders.values()).filter((s) => s.size === 2).length;
  const totalEntries = responses.length;

  const templateCount = new Map<string, number>();
  for (const r of responses) {
    if (!r.template_id) continue;
    templateCount.set(r.template_id, (templateCount.get(r.template_id) ?? 0) + 1);
  }
  const topTemplateIds = Array.from(templateCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  let topTemplates: Array<TemplateRow & { count: number }> = [];
  if (topTemplateIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tplsRaw } = await (supabase as any)
      .from("templates")
      .select("id, name, emoji")
      .in("id", topTemplateIds);
    const tplMap = new Map<string, TemplateRow>(
      ((tplsRaw as TemplateRow[] | null) ?? []).map((tpl) => [tpl.id, tpl]),
    );
    topTemplates = topTemplateIds
      .map((id) => {
        const tpl = tplMap.get(id);
        return tpl ? { ...tpl, count: templateCount.get(id) ?? 0 } : null;
      })
      .filter((x): x is TemplateRow & { count: number } => !!x);
  }

  const { data: rawPhotos } = await supabase
    .from("shared_photos")
    .select("id, url, caption, taken_at")
    .eq("couple_id", couple.id)
    .order("taken_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);
  const photos = ((rawPhotos as PhotoRow[] | null) ?? [])
    .filter((p) => p.url && !p.url.includes("/bg/"));

  const signed = photos.map((p) => ({
    id: p.id,
    url: `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(p.url)}`,
    caption: p.caption,
  }));

  const milestones = await getMilestones(couple.id);
  const upcoming = nextSpecialDays(
    milestones.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      recurring: m.recurring,
      type: m.type,
    })),
    1,
  );
  const next = upcoming[0];

  const ymLabel = `${yyyy}-${String(mm).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {t("memories.section_title")}
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("memories.title")}</h1>
      </header>

      {totalEntries > 0 ? (
        <section className="border-b border-[var(--color-paper-line)] pb-6">
          <header className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm text-[var(--color-ink-mid)]">
              {t("memories.monthly", { ym: ymLabel })}
            </h2>
            <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
              {t("memories.history_total", { days: daysBothDone, entries: totalEntries })}
            </span>
          </header>
          <div className="grid grid-cols-2 gap-4">
            <Stat label={t("memories.stat_wrote_together")} value={daysBothDone} unit={t("memories.unit_days")} />
            <Stat label={t("memories.stat_total")} value={totalEntries} unit={t("memories.unit_entries")} />
          </div>

          {topTemplates.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-[var(--color-ink-soft)] uppercase tracking-wider mb-2">
                {t("memories.month_top_templates")}
              </p>
              <ul className="flex flex-col">
                {topTemplates.map((tpl) => (
                  <li
                    key={tpl.id}
                    className="flex items-center gap-3 py-2 border-b border-[var(--color-paper-line)] last:border-b-0"
                  >
                    <span className="w-6 text-center" aria-hidden>
                      {tpl.emoji ?? ""}
                    </span>
                    <span className="flex-1 text-sm">{tpl.name}</span>
                    <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
                      × {tpl.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-[var(--color-ink-soft)]">
          {t("memories.month_no_entries_yet")}
        </p>
      )}

      <section className="border-l-2 border-[var(--color-accent)] pl-4 py-1">
        <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
          {t("memories.slideshow_label")}
        </p>
        <p className="text-sm mt-1 leading-relaxed text-[var(--color-ink-mid)]">
          {t("memories.slideshow_intro")}
        </p>
        {next ? (
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-sm">
              <span className="text-[var(--color-ink)]">{next.name}</span>
              <span className="text-xs text-[var(--color-ink-soft)] ml-2">
                {t("memories.slideshow_days_until", { n: Math.max(0, daysUntil(next.date)) })}
              </span>
            </p>
            <Link
              href={`/memories/slideshow?occasion=${next.id}`}
              className="text-xs underline underline-offset-2 hover:text-[var(--color-ink-mid)]"
            >
              {t("common.preview")}
            </Link>
          </div>
        ) : (
          <Link
            href="/memories/slideshow"
            className="text-xs underline underline-offset-2 mt-3 inline-block"
          >
            {t("memories.see_now")}
          </Link>
        )}
      </section>

      <div className="flex flex-col border-y border-[var(--color-paper-line)]">
        <Link
          href="/memories/history"
          className="flex items-center justify-between py-4 hover:text-[var(--color-ink-mid)] transition-colors border-b border-[var(--color-paper-line)]"
        >
          <div>
            <p className="font-serif text-lg">{t("memories.history_title")}</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              {t("memories.history_subtitle")}
            </p>
          </div>
          <span className="text-[var(--color-ink-soft)]">→</span>
        </Link>

        <Link
          href="/memories/book"
          className="flex items-center justify-between py-4 hover:text-[var(--color-ink-mid)] transition-colors"
        >
          <div>
            <p className="font-serif text-lg">{t("memories.title")}</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              {t("memories.memory_book_sub")}
            </p>
          </div>
          <span className="text-[var(--color-ink-soft)]">→</span>
        </Link>
      </div>

      <PhotoUpload coupleId={couple.id} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-[var(--color-ink-mid)]">
          {t("memories.albums")}
        </h2>
        {signed.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)] py-6">
            {t("journal.empty")}
          </p>
        ) : (
          <PhotoGrid photos={signed.filter((s) => s.url)} />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
        {label}
      </span>
      <div className="font-serif text-3xl tabular-nums mt-1">
        {value}
        <span className="text-base text-[var(--color-ink-mid)] ml-1">{unit}</span>
      </div>
    </div>
  );
}
