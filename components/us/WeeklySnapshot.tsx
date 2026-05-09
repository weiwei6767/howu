import { getTranslations } from "next-intl/server";
import { PhotoUploadTile } from "@/components/memories/PhotoUploadTile";
import { PhotoGrid } from "@/components/memories/PhotoGrid";

interface MoodAnswer {
  type: string;
  value: unknown;
}

interface ResponseRow {
  responder_id: string;
  date: string;
  mood_tags: string[] | null;
  rotating_answers: unknown;
}

interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
}

interface Props {
  coupleId: string;
  myId: string;
  partnerId: string | null;
  myName: string | null;
  partnerName: string | null;
  responses: ResponseRow[];
  photos: PhotoRow[];
}

function topMoodsFor(rows: ResponseRow[], userId: string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.responder_id !== userId) continue;
    for (const tag of r.mood_tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    const answers = (r.rotating_answers as MoodAnswer[] | null) ?? [];
    for (const a of answers) {
      if (a.type === "mood_tags" && Array.isArray(a.value)) {
        for (const tag of a.value as string[]) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

export async function WeeklySnapshot({
  coupleId,
  myId,
  partnerId,
  myName,
  partnerName,
  responses,
  photos,
}: Props) {
  const t = await getTranslations();

  const myTop = topMoodsFor(responses, myId);
  const partnerTop = partnerId ? topMoodsFor(responses, partnerId) : [];

  const myDisplay = myName ?? t("today_completed.partner_label");
  const partnerDisplay = partnerName ?? t("today_completed.partner_label");

  const signedPhotos = photos.map((p) => ({
    id: p.id,
    url: `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(p.url)}`,
    caption: p.caption,
  }));

  return (
    <section className="flex flex-col gap-7">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
        {t("us_week.section_label")}
      </p>

      {/* 本週心情 */}
      <div className="flex flex-col gap-4">
        <h2 className="font-serif text-xl">{t("us_week.moods_title")}</h2>
        {myTop.length === 0 && partnerTop.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
            {t("us_week.moods_empty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <PersonMoods
              label={t("us_week.person_top_moods", { name: myDisplay })}
              items={myTop}
            />
            <PersonMoods
              label={t("us_week.person_top_moods", { name: partnerDisplay })}
              items={partnerTop}
            />
          </div>
        )}
      </div>

      {/* 本週瞬間 — 第一格永遠是上傳,後面是本週照片 */}
      <div className="flex flex-col gap-3">
        <header className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl">{t("us_week.moments_title")}</h2>
          {signedPhotos.length > 0 && (
            <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
              {signedPhotos.length}
            </span>
          )}
        </header>
        <div className="grid grid-cols-3 gap-3">
          <PhotoUploadTile coupleId={coupleId} />
          <PhotoGrid photos={signedPhotos} />
        </div>
        {signedPhotos.length === 0 && (
          <p className="text-xs text-[var(--color-ink-soft)] text-center pt-1">
            {t("us_week.moments_empty")}
          </p>
        )}
      </div>
    </section>
  );
}

function PersonMoods({ label, items }: { label: string; items: Array<[string, number]> }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider">
        {label}
      </span>
      {items.length === 0 ? (
        <span className="text-sm text-[var(--color-ink-soft)]">—</span>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map(([tag, n]) => (
            <li key={tag} className="flex items-baseline justify-between text-sm">
              <span className="text-[var(--color-ink)]">{tag}</span>
              <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">× {n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
