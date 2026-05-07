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
  photos: JournalPhoto[];
  signed_photo_urls: string[];
}

interface RawEntry {
  id: string;
  date: string;
  content: string | null;
  shared_with_partner: boolean | null;
  attached_response_id: string | null;
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

export async function getMyJournalMonth(
  userId: string,
  year: number,
  month: number,
): Promise<JournalEntryFull[]> {
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("journal_entries")
    .select("id, date, content, shared_with_partner, attached_response_id, photos")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  const rows = (data as RawEntry[] | null) ?? [];
  const result: JournalEntryFull[] = [];
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
    result.push({
      id: r.id,
      date: r.date,
      content: r.content,
      shared_with_partner: r.shared_with_partner,
      attached_response_id: r.attached_response_id,
      photos,
      signed_photo_urls: signed.filter((u) => u),
    });
  }
  return result;
}

export async function getJournalEntry(
  userId: string,
  date: string,
): Promise<JournalEntryFull | null> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("journal_entries")
    .select("id, date, content, shared_with_partner, attached_response_id, photos")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  const r = data as RawEntry | null;
  if (!r) return null;
  const photos = parsePhotos(r.photos);
  const signed = await Promise.all(
    photos.map(async (p) => {
      const { data: s } = await supabase.storage
        .from("journal_photos")
        .createSignedUrl(p.path, 60 * 60 * 6);
      return s?.signedUrl ?? "";
    }),
  );
  return {
    id: r.id,
    date: r.date,
    content: r.content,
    shared_with_partner: r.shared_with_partner,
    attached_response_id: r.attached_response_id,
    photos,
    signed_photo_urls: signed.filter((u) => u),
  };
}
