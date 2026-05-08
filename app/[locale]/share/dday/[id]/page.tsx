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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-rose-50 via-amber-50 to-violet-50">
      {/* 主卡 */}
      <div className="relative w-full max-w-md aspect-[4/5] rounded-[36px] overflow-hidden shadow-2xl">
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-amber-100 to-violet-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55" />
        <div className="relative h-full flex flex-col items-center justify-between p-8 text-white">
          <div className="text-xs tracking-[0.3em] opacity-90 mt-2">HOWU</div>

          <div className="flex flex-col items-center gap-3 -translate-y-2">
            <p className="text-xs tracking-widest opacity-90">IN LOVE FOR</p>
            <div
              className="text-[7rem] sm:text-[8rem] font-bold tabular-nums leading-none"
              style={{ textShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
            >
              {days}
            </div>
            <p className="text-base opacity-90 -mt-2">天</p>
          </div>

          <div className="flex flex-col items-center gap-1 mb-2">
            <p className="text-2xl font-semibold drop-shadow-md">
              {a} <span className="text-rose-200">&</span> {b}
            </p>
            <p className="text-xs opacity-80">自 {d.together_since}</p>
            <p className="text-[10px] tracking-widest opacity-70 mt-3">
              howu.online · 兩個人的日記
            </p>
          </div>
        </div>
      </div>

      {/* 操作 */}
      <div className="flex flex-col items-center gap-3 mt-6 max-w-md w-full">
        <p className="text-sm text-zinc-600 text-center leading-relaxed">
          截這張圖傳給朋友看,或讓對方放桌布 ✨
        </p>
        <CopyLinkButton />
        <a
          href="/"
          className="text-xs text-zinc-400 hover:text-[var(--color-rose)] transition mt-2"
        >
          ← 回 howu
        </a>
      </div>
    </div>
  );
}
