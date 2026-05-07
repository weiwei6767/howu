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

export async function getEligibleQuestions(relationshipType: string, isPremium: boolean): Promise<Question[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("questions").select("*").contains("for_relationship_types", [relationshipType]);
  if (!isPremium) q = q.eq("is_premium", false);
  const { data } = await q;
  return ((data as Question[] | null) ?? []);
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
