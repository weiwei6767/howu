import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCoupleAllowRecovery, getPartnerProfile } from "@/lib/supabase/auth";
import { RecoveryBanner } from "@/components/memories/RecoveryBanner";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getStreak } from "@/lib/supabase/queries";
import { ddayCount } from "@/lib/utils/date";
import { BookControls } from "@/components/memories/BookControls";

interface ResponseRow {
  date: string;
  responder_id: string;
  template_id: string | null;
  rotating_answers: unknown;
  mood_tags: string[] | null;
}

interface TemplateRow {
  id: string;
  name: string;
  emoji: string | null;
}

interface PhotoRow {
  id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
}

const SERIF = 'Georgia, "Noto Serif TC", "Times New Roman", serif';

export default async function MemoryBookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireUser();
  const couple = await requireCoupleAllowRecovery(user.id);
  const isRecovery = couple.status === "recovery";
  const me = await getProfile(user.id);
  const partner = await getPartnerProfile(user.id, couple);
  const streak = await getStreak(couple.id);
  const dday = ddayCount(couple.together_since);

  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: respRaw } = await (supabase as any)
    .from("daily_responses")
    .select("date, responder_id, template_id, rotating_answers, mood_tags")
    .eq("couple_id", couple.id);
  const responses = (respRaw as ResponseRow[] | null) ?? [];

  // 雙方都完成的天數
  const dayResponders = new Map<string, Set<string>>();
  for (const r of responses) {
    const set = dayResponders.get(r.date) ?? new Set();
    set.add(r.responder_id);
    dayResponders.set(r.date, set);
  }
  const totalDaysDone = Array.from(dayResponders.values()).filter((s) => s.size === 2).length;

  // memorable moments — 短文字 + 信件
  type Moment = { date: string; text: string; isLetter: boolean };
  const moments: Moment[] = [];
  for (const r of responses) {
    const arr = (r.rotating_answers as Array<{ type: string; value: unknown }>) ?? [];
    for (const a of arr) {
      if (
        (a.type === "short_text" || a.type === "letter") &&
        typeof a.value === "string" &&
        a.value.trim()
      ) {
        moments.push({
          date: r.date,
          text: a.value.trim(),
          isLetter: a.type === "letter",
        });
      }
    }
  }
  moments.sort((a, b) => (a.date < b.date ? 1 : -1));
  const topMoments = moments.slice(0, 16);

  // mood tags 全期前 8
  const moodCounts = new Map<string, number>();
  for (const r of responses) {
    for (const t of r.mood_tags ?? []) {
      moodCounts.set(t, (moodCounts.get(t) ?? 0) + 1);
    }
  }
  const topMoods = Array.from(moodCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // 模板使用
  const templateCount = new Map<string, number>();
  for (const r of responses) {
    if (!r.template_id) continue;
    templateCount.set(r.template_id, (templateCount.get(r.template_id) ?? 0) + 1);
  }
  const sortedTplIds = Array.from(templateCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  let templates: Array<TemplateRow & { count: number }> = [];
  if (sortedTplIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tplsRaw } = await (supabase as any)
      .from("templates")
      .select("id, name, emoji")
      .in("id", sortedTplIds);
    const map = new Map<string, TemplateRow>(
      ((tplsRaw as TemplateRow[] | null) ?? []).map((t) => [t.id, t]),
    );
    templates = sortedTplIds
      .map((id) => {
        const t = map.get(id);
        return t ? { ...t, count: templateCount.get(id) ?? 0 } : null;
      })
      .filter((x): x is TemplateRow & { count: number } => !!x);
  }

  // 封面背景:用 couple 的 background_photo_path 或第一張共同照片
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgPath = (couple as any).background_photo_path as string | null | undefined;
  let coverPath: string | null = bgPath ?? null;
  if (!coverPath) {
    const { data: firstPhoto } = await supabase
      .from("shared_photos")
      .select("url")
      .eq("couple_id", couple.id)
      .order("taken_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const fp = firstPhoto as PhotoRow | null;
    if (fp?.url && !fp.url.includes("/bg/")) coverPath = fp.url;
  }
  const coverUrl = coverPath
    ? `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(coverPath)}`
    : null;

  // 拉一些精選照片配章節
  const { data: morePhotos } = await supabase
    .from("shared_photos")
    .select("id, url, caption, taken_at")
    .eq("couple_id", couple.id)
    .order("taken_at", { ascending: true })
    .limit(8);
  const sectionPhotos = ((morePhotos as PhotoRow[] | null) ?? [])
    .filter((p) => p.url && !p.url.includes("/bg/"))
    .map((p) => ({
      ...p,
      url: `/api/img-proxy?bucket=shared_photos&path=${encodeURIComponent(p.url)}`,
    }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="memory-book max-w-[820px] mx-auto pb-32 print:pb-0"
      style={{ fontFamily: SERIF }}
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; background-image: none !important; }
          .memory-book { padding: 0; }
          .page-break { page-break-after: always; }
        }
        .ornament {
          font-family: Georgia, serif;
          color: #c2185b;
          letter-spacing: 1em;
        }
      `}</style>

      <BookControls />

      {isRecovery && (
        <RecoveryBanner recoveryUntil={couple.recovery_until} />
      )}

      {/* ─────────── 封面 */}
      <section className="page-break relative rounded-[24px] overflow-hidden shadow-2xl mb-12 mt-2">
        <div className="relative" style={{ aspectRatio: "5 / 7" }}>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-amber-100 to-violet-200" />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.65) 100%)",
            }}
          />
          <div className="absolute inset-0 flex flex-col justify-between p-10 sm:p-14 text-white">
            <div className="text-center">
              <p className="text-[10px] sm:text-xs tracking-[0.5em] opacity-90">HOWU</p>
              <p className="text-[10px] sm:text-xs tracking-[0.4em] opacity-75 mt-1">
                MEMORY BOOK
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <h1
                className="text-3xl sm:text-5xl font-medium leading-tight"
                style={{ textShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
              >
                {me?.display_name ?? "我"}
                <span className="block text-rose-200 italic my-1 text-2xl sm:text-3xl font-light">
                  &
                </span>
                {partner?.display_name ?? "對方"}
              </h1>
              <div
                className="mt-6 sm:mt-10 tabular-nums leading-none"
                style={{
                  fontSize: "clamp(4rem, 14vw, 7rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  textShadow: "0 4px 24px rgba(0,0,0,0.4)",
                }}
              >
                {dday}
              </div>
              <p className="text-xs tracking-[0.3em] opacity-90 mt-2">DAYS</p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-80">
                {couple.together_since} → {today}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── 數字摘要 */}
      <section className="grid grid-cols-3 gap-4 mb-16 px-4">
        <Stat n={totalDaysDone} label="一起寫了" unit="天" />
        <Stat n={responses.length} label="總共" unit="份" />
        <Stat n={streak.longest_streak} label="最長連續" unit="天" />
      </section>

      <Divider />

      {/* ─────────── 序 */}
      <section className="px-6 mb-16">
        <h2
          className="text-center text-3xl mb-6"
          style={{ fontStyle: "italic", letterSpacing: "0.02em" }}
        >
          Preface
        </h2>
        <p
          className="text-center text-sm text-zinc-600 max-w-xl mx-auto leading-loose"
          style={{ fontStyle: "italic" }}
        >
          「兩個人的日記、一份共寫的日常。」
          <br />
          這本書是 {me?.display_name ?? "我"} 與 {partner?.display_name ?? "對方"} 從{" "}
          {couple.together_since} 開始,
          一起寫進來的小日子。沒有什麼大事,但每個小瞬間,
          都是我們的一部分。
        </p>
      </section>

      {/* ─────────── 模板使用 */}
      {templates.length > 0 && (
        <>
          <Divider />
          <section className="px-6 mb-16">
            <SectionTitle index="i" title="我們的問卷" subtitle="WHAT WE WROTE" />
            <ul className="flex flex-col gap-3 max-w-md mx-auto">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-baseline gap-3 border-b border-zinc-200 pb-2"
                >
                  <span className="text-xl">{t.emoji ?? "📝"}</span>
                  <span className="flex-1 text-base">{t.name}</span>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {t.count} 次
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* ─────────── 心情標籤 */}
      {topMoods.length > 0 && (
        <>
          <Divider />
          <section className="px-6 mb-16">
            <SectionTitle index="ii" title="我們的心情" subtitle="HOW WE FELT" />
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {topMoods.map(([tag, count], i) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full text-sm border border-rose-200 bg-rose-50/40"
                  style={{
                    fontSize: `${0.85 + (count / topMoods[0][1]) * 0.5}rem`,
                  }}
                >
                  {tag}
                  <span className="text-xs text-zinc-400 ml-2">{count}</span>
                </span>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ─────────── 照片精選 */}
      {sectionPhotos.length > 0 && (
        <>
          <Divider />
          <section className="px-4 mb-16">
            <SectionTitle index="iii" title="瞬間" subtitle="MOMENTS" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-2xl mx-auto">
              {sectionPhotos.map((p) => (
                <div
                  key={p.id}
                  className="relative aspect-square rounded-md overflow-hidden bg-zinc-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ─────────── memorable moments */}
      {topMoments.length > 0 && (
        <>
          <Divider />
          <section className="px-6 mb-16">
            <SectionTitle index="iv" title="想被記得的話" subtitle="MOMENTS WORTH KEEPING" />
            <ul className="flex flex-col gap-8 max-w-2xl mx-auto">
              {topMoments.map((m, i) => (
                <li key={i} className="flex flex-col gap-2">
                  <span
                    className="text-[10px] tracking-[0.3em] text-zinc-400"
                    style={{ fontFamily: SERIF }}
                  >
                    {m.date.replace(/-/g, ".")}
                  </span>
                  {m.isLetter ? (
                    <p
                      className="text-base leading-loose pl-4 border-l-2 border-rose-300 whitespace-pre-wrap"
                      style={{
                        fontFamily: 'var(--font-handwritten), Georgia, serif',
                        fontSize: "1.2rem",
                      }}
                    >
                      {m.text}
                    </p>
                  ) : (
                    <p
                      className="text-base leading-relaxed"
                      style={{ fontStyle: "italic" }}
                    >
                      <span className="text-3xl text-rose-300 leading-none align-middle mr-1">
                        “
                      </span>
                      {m.text}
                      <span className="text-3xl text-rose-300 leading-none align-middle ml-1">
                        ”
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* ─────────── 結語 */}
      <Divider />
      <section className="px-6 py-16 text-center">
        <p
          className="text-base text-zinc-600 leading-loose max-w-md mx-auto mb-6"
          style={{ fontStyle: "italic" }}
        >
          這本書還沒寫完。
          <br />
          下一頁,還有等著寫的明天。
        </p>
        <div className="ornament text-2xl my-6">· · ·</div>
        <p className="text-[10px] tracking-[0.4em] text-zinc-400 mt-4">HOWU.ONLINE</p>
        <p className="text-[10px] text-zinc-400 mt-1">列印於 {today}</p>
      </section>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center my-8 print:my-4">
      <div className="ornament text-xl">· · ·</div>
    </div>
  );
}

function SectionTitle({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="text-center mb-10">
      <p className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase">
        Chapter {index}
      </p>
      <h2 className="text-3xl mt-2" style={{ letterSpacing: "0.02em" }}>
        {title}
      </h2>
      <p className="text-[10px] tracking-[0.3em] text-zinc-400 mt-2">{subtitle}</p>
    </header>
  );
}

function Stat({ n, label, unit }: { n: number; label: string; unit: string }) {
  return (
    <div className="text-center">
      <div
        className="tabular-nums leading-none"
        style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 400,
          color: "#c2185b",
          letterSpacing: "-0.03em",
        }}
      >
        {n}
      </div>
      <div className="text-[10px] tracking-[0.3em] text-zinc-500 mt-2 uppercase">
        {label}
      </div>
      <div className="text-[9px] text-zinc-400 mt-0.5">{unit}</div>
    </div>
  );
}
