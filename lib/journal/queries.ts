import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface JournalPhoto {
  path: string;
  caption?: string | null;
}

export interface JournalEntryFull {
  id: string;
  date: string;
  content: string | null;
  shared_with_partner: boolean | null;
  attached_response_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  photos: JournalPhoto[];
  signed_photo_urls: string[];
}

interface RawEntry {
  id: string;
  date: string;
  content: string | null;
  shared_with_partner: boolean | null;
  attached_response_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  photos: unknown;
}

function parsePhotos(raw: unknown): JournalPhoto[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is JournalPhoto =>
      typeof p === "object" && p !== null && typeof (p as JournalPhoto).path === "string",
    )
    .map((p) => ({ path: (p as JournalPhoto).path, caption: (p as JournalPhoto).caption ?? null }));
}

async function withSignedUrls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  rows: RawEntry[],
): Promise<JournalEntryFull[]> {
  const out: JournalEntryFull[] = [];
  for (const r of rows) {
    const photos = parsePhotos(r.photos);
    const signed = await Promise.all(
      photos.map(async (p) => {
        const { data: s } = await supabase.storage
          .from("journal_photos")
          .createSignedUrl(p.path, 60 * 60 * 6);
        return s?.signedUrl ?? "";
      }),
    );
    out.push({
      id: r.id,
      date: r.date,
      content: r.content,
      shared_with_partner: r.shared_with_partner,
      attached_response_id: r.attached_response_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      photos,
      signed_photo_urls: signed.filter((u) => u),
    });
  }
  return out;
}

/** 月曆 view 用:某月的「每天統計」(篇數 / 有照片 / 有分享) */
export interface DayStat {
  count: number;
  hasPhotos: boolean;
  hasShared: boolean;
  totalChars: number;
}

export async function getJournalMonthSummary(
  userId: string,
  year: number,
  month: number,
): Promise<Map<string, DayStat>> {
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("journal_entries")
    .select("date, content, photos, shared_with_partner")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  const map = new Map<string, DayStat>();
  for (const e of (data as Array<{
    date: string;
    content: string | null;
    photos: unknown;
    shared_with_partner: boolean | null;
  }> | null) ?? []) {
    const cur = map.get(e.date) ?? {
      count: 0,
      hasPhotos: false,
      hasShared: false,
      totalChars: 0,
    };
    cur.count++;
    cur.totalChars += (e.content ?? "").length;
    const ps = parsePhotos(e.photos);
    if (ps.length > 0) cur.hasPhotos = true;
    if (e.shared_with_partner) cur.hasShared = true;
    map.set(e.date, cur);
  }
  return map;
}

/** 某天所有 entries(同一天可有多篇) */
export async function getJournalEntriesOfDate(
  userId: string,
  date: string,
): Promise<JournalEntryFull[]> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("journal_entries")
    .select(
      "id, date, content, shared_with_partner, attached_response_id, photos, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });
  return withSignedUrls(supabase, (data as RawEntry[] | null) ?? []);
}

/** 最近 N 篇 entries(timeline 用) */
export async function getRecentJournalEntries(
  userId: string,
  limit: number,
): Promise<JournalEntryFull[]> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("journal_entries")
    .select(
      "id, date, content, shared_with_partner, attached_response_id, photos, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return withSignedUrls(supabase, (data as RawEntry[] | null) ?? []);
}

/** 對方分享給我的最近 N 篇 — 透過 journal_shared_read RLS 政策可讀 */
export async function getPartnerSharedRecent(
  partnerId: string,
  limit: number,
): Promise<JournalEntryFull[]> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("journal_entries")
    .select(
      "id, date, content, shared_with_partner, attached_response_id, photos, created_at, updated_at",
    )
    .eq("user_id", partnerId)
    .eq("shared_with_partner", true)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return withSignedUrls(supabase, (data as RawEntry[] | null) ?? []);
}

/** 對方在某天分享給我的 entries */
export async function getPartnerSharedOfDate(
  partnerId: string,
  date: string,
): Promise<JournalEntryFull[]> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("journal_entries")
    .select(
      "id, date, content, shared_with_partner, attached_response_id, photos, created_at, updated_at",
    )
    .eq("user_id", partnerId)
    .eq("date", date)
    .eq("shared_with_partner", true)
    .order("created_at", { ascending: true });
  return withSignedUrls(supabase, (data as RawEntry[] | null) ?? []);
}
