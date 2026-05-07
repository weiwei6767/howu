import { createSupabaseServerClient } from "./server";
import { callRpc } from "./db";
import type { Database } from "./types";

type Tables = Database["public"]["Tables"];
export type Profile = Tables["profiles"]["Row"];
export type Couple = Tables["couples"]["Row"];
export type DailyResponse = Tables["daily_responses"]["Row"];
export type Question = Tables["questions"]["Row"];
export type SyncScore = Tables["sync_scores"]["Row"];
export type Milestone = Tables["milestones"]["Row"];
export type PromiseRow = Tables["promises"]["Row"];

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function getTodayResponse(coupleId: string, userId: string, dateISO: string): Promise<DailyResponse | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("daily_responses")
    .select("*")
    .eq("couple_id", coupleId)
    .eq("responder_id", userId)
    .eq("date", dateISO)
    .maybeSingle();
  return (data as DailyResponse | null) ?? null;
}

export async function getPartnerTodayResponse(coupleId: string, partnerId: string, dateISO: string): Promise<DailyResponse | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("daily_responses")
    .select("*")
    .eq("couple_id", coupleId)
    .eq("responder_id", partnerId)
    .eq("date", dateISO)
    .maybeSingle();
  return (data as DailyResponse | null) ?? null;
}

export async function getRecentQuestionIds(coupleId: string, days: number): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase
    .from("daily_responses")
    .select("rotating_answers, date")
    .eq("couple_id", coupleId)
    .gte("date", since.toISOString().slice(0, 10));
  if (!data) return [];
  const ids = new Set<string>();
  for (const row of data as Array<{ rotating_answers: unknown }>) {
    const answers = (row.rotating_answers as Array<{ question_id?: string }>) ?? [];
    for (const a of answers) if (a?.question_id) ids.add(a.question_id);
  }
  return Array.from(ids);
}

export async function getEligibleQuestions(
  relationshipType: string,
  isPremiumPair: boolean,
  ownedPackIds: string[] = [],
): Promise<Question[]> {
  const supabase = await createSupabaseServerClient();

  // 拉所有 active 題包,算出 user 可存取的 pack id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: packsRaw } = await (supabase as any)
    .from("question_packs")
    .select("id, is_premium_included, price_twd")
    .eq("is_active", true);
  const packs = (packsRaw as Array<{
    id: string;
    is_premium_included: boolean | null;
    price_twd: number | null;
  }> | null) ?? [];
  const accessiblePacks = new Set<string>(ownedPackIds);
  for (const p of packs) {
    if (p.is_premium_included && isPremiumPair) accessiblePacks.add(p.id);
    if ((p.price_twd ?? 0) <= 0) accessiblePacks.add(p.id);
  }

  const { data } = await supabase
    .from("questions")
    .select("*")
    .contains("for_relationship_types", [relationshipType]);
  const all = (data as Array<Question & { pack_id: string | null }> | null) ?? [];

  return all.filter((q) => {
    if (q.pack_id) return accessiblePacks.has(q.pack_id);
    return !q.is_premium || isPremiumPair;
  });
}

export async function getOwnedPackIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  // pack_purchases 還沒在 generated types,cast 繞過
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("pack_purchases")
    .select("pack_id")
    .in("user_id", userIds);
  return ((data as Array<{ pack_id: string }> | null) ?? []).map((r) => r.pack_id);
}

export async function getSyncScore(coupleId: string): Promise<SyncScore | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("sync_scores").select("*").eq("couple_id", coupleId).maybeSingle();
  return (data as SyncScore | null) ?? null;
}

export async function getStreak(coupleId: string): Promise<{ current_streak: number; longest_streak: number }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await callRpc(supabase, "calculate_streak", { p_couple_id: coupleId });
  return {
    current_streak: data?.current_streak ?? 0,
    longest_streak: data?.longest_streak ?? 0,
  };
}

export async function getMilestones(coupleId: string): Promise<Milestone[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("milestones")
    .select("*")
    .eq("couple_id", coupleId)
    .order("date", { ascending: true });
  return ((data as Milestone[] | null) ?? []);
}

export async function getPromises(coupleId: string): Promise<PromiseRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("promises")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  return ((data as PromiseRow[] | null) ?? []);
}
