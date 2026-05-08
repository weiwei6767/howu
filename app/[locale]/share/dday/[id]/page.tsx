import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { strip } from "@/lib/utils/env";
import { ddayCount } from "@/lib/utils/date";
import { CopyLinkButton } from "@/components/share/CopyLinkButton";

interface ShareData {
  couple_id: string;
  together_since: string;
  background_photo_path: string | null;
  partner_a_name: string | null;
  partner_b_name: string | null;
}

const SUPABASE_URL = strip(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON = strip(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const SUPABASE_SR = strip(process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchShareData(id: string): Promise<ShareData | null> {
  const client = createServerClient(SUPABASE_URL, SUPABASE_SR || SUPABASE_ANON, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (client as any).rpc("get_share_dday", { p_couple_id: id });
  if (!data || !data.together_since) return null;
  return data as ShareData;
}

async function getBackgroundUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const client = createServerClient(SUPABASE_URL, SUPABASE_SR || SUPABASE_ANON, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
  const { data } = await client.storage
    .from("shared_photos")
    .createSignedUrl(path, 60 * 60 * 24);
  return data?.signedUrl ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await fetchShareData(id);
  if (!d) return { title: "howu" };
  const days = ddayCount(d.together_since);
  const a = d.partner_a_name ?? "我們";
  const b = d.partner_b_name ?? "";
  const title = b ? `${a} & ${b} · ${days} 天` : `${a} · ${days} 天`;
  return {
    title,
    description: "兩個人的日記、一份共寫的日常 · howu",
    openGraph: {
      title,
      description: "兩個人的日記、一份共寫的日常 · howu",
      type: "website",
    },
  };
}

export default async function DDaySharePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const d = await fetchShareData(id);
  if (!d) notFound();

  const days = ddayCount(d.together_since);
  const bg = await getBackgroundUrl(d.background_photo_path);
  const a = d.partner_a_name ?? "你";
  const b = d.partner_b_name ?? "對方";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-rose-50 via-amber-50 to-violet-50">
      {/* 9:16 IG story 大卡 */}
      <div
        className="relative w-full max-w-[360px] rounded-[28px] overflow-hidden shadow-2xl"
        style={{ aspectRatio: "9 / 16" }}
      >
        {/* 背景照片(滿版鋪) */}
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-amber-200 to-violet-300" />
        )}

        {/* 漸層蓋層 — 上下蓋深一點讓文字清楚,中間透明 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* 內容(IG story safe area:上下各留 ~12%) */}
        <div className="relative h-full flex flex-col justify-between px-6 py-8 text-white">
          {/* 頂:logo + 在一起天數標題 */}
          <div className="flex flex-col items-center gap-2 mt-3">
            <span className="text-[10px] tracking-[0.4em] opacity-90">HOWU</span>
            <span className="text-[11px] tracking-[0.3em] opacity-80">
              IN LOVE FOR
            </span>
          </div>

          {/* 中:大數字 */}
          <div className="flex flex-col items-center -mt-8">
            <div
              className="text-[10rem] sm:text-[11rem] font-bold tabular-nums leading-none"
              style={{
                textShadow:
                  "0 4px 32px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              {days}
            </div>
            <p
              className="text-2xl mt-1 opacity-95"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
            >
              天
            </p>
          </div>

          {/* 下:名字 + 起始日期 + URL */}
          <div className="flex flex-col items-center gap-1">
            <p
              className="text-2xl font-semibold"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
            >
              {a} <span className="text-rose-200">&</span> {b}
            </p>
            <p
              className="text-xs opacity-85"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
            >
              自 {d.together_since}
            </p>
            <p className="text-[10px] tracking-[0.2em] opacity-70 mt-3">
              howu.online
            </p>
          </div>
        </div>
      </div>

      {/* 操作 */}
      <div className="flex flex-col items-center gap-3 mt-5 max-w-[360px] w-full">
        <p className="text-xs text-zinc-600 text-center leading-relaxed">
          長按上面圖片儲存,或複製連結傳給朋友 ✨
        </p>
        <CopyLinkButton />
        <a
          href="/"
          className="text-xs text-zinc-400 hover:text-[var(--color-rose)] transition mt-1"
        >
          ← 回 howu
        </a>
      </div>
    </div>
  );
}
