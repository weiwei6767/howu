import { getTranslations } from "next-intl/server";
import { PhotoUploadTile } from "@/components/memories/PhotoUploadTile";
import { PhotoGrid } from "@/components/memories/PhotoGrid";
import { MoodRanking } from "./MoodRanking";

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
  myName: string;
  partnerName: string;
  responses: ResponseRow[];
  photos: PhotoRow[];
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  monthEnd: string;
  yearStart: string;
  yearEnd: string;
}

export async function WeeklySnapshot({
  coupleId,
  myId,
  partnerId,
  myName,
  partnerName,
  responses,
  photos,
  weekStart,
  weekEnd,
  monthStart,
  monthEnd,
  yearStart,
  yearEnd,
}: Props) {
  const t = await getTranslations();

  const signedPhotos = photos.map((p) => ({
    id: p.id,
    url: `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(p.url)}`,
    caption: p.caption,
  }));

  return (
    <section className="flex flex-col gap-7">
      {/* 我們的心情 — 雙人排行 + 區間切換 */}
      <MoodRanking
        responses={responses}
        myId={myId}
        partnerId={partnerId}
        myName={myName}
        partnerName={partnerName}
        weekStart={weekStart}
        weekEnd={weekEnd}
        monthStart={monthStart}
        monthEnd={monthEnd}
        yearStart={yearStart}
        yearEnd={yearEnd}
      />

      {/* 本週瞬間 */}
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
