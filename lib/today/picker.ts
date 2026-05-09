import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface TemplateSummary {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  question_count: number;
}

export interface DailyPick {
  template_id: string;
  picked_by: string;
  picked_at: string;
}

export async function getDailyPick(coupleId: string, dateISO: string): Promise<DailyPick | null> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("daily_template_picks")
    .select("template_id, picked_by, picked_at")
    .eq("couple_id", coupleId)
    .eq("date", dateISO)
    .maybeSingle();
  return data as DailyPick | null;
}

export async function getNextPickerId(coupleId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc("next_picker", { p_couple_id: coupleId });
  return (data as string | null) ?? null;
}

export async function getCoupleTemplates(coupleId: string): Promise<TemplateSummary[]> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tplsRaw } = await (supabase as any)
    .from("templates")
    .select("id, name, emoji, description")
    .eq("couple_id", coupleId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  const tpls = ((tplsRaw as Array<{
    id: string;
    name: string;
    emoji: string | null;
    description: string | null;
  }> | null) ?? []);
  if (tpls.length === 0) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: qRaw } = await (supabase as any)
    .from("template_questions")
    .select("template_id")
    .in("template_id", tpls.map((t) => t.id));
  const counts = new Map<string, number>();
  for (const r of (qRaw as Array<{ template_id: string }> | null) ?? []) {
    counts.set(r.template_id, (counts.get(r.template_id) ?? 0) + 1);
  }
  return tpls.map((t) => ({
    ...t,
    question_count: counts.get(t.id) ?? 0,
  }));
}

export interface TemplateFull {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  mood_tag_options: string[] | null;
  questions: Array<{
    id: string;
    position: number;
    type: string;
    text: string;
    options: string[] | null;
  }>;
  promises: Array<{ id: string; position: number; text: string }>;
}

export async function getTemplate(templateId: string): Promise<TemplateFull | null> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tplRaw } = await (supabase as any)
    .from("templates")
    .select("id, name, emoji, description, mood_tag_options")
    .eq("id", templateId)
    .maybeSingle();
  if (!tplRaw) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: qsRaw } = await (supabase as any)
    .from("template_questions")
    .select("id, position, type, text, options")
    .eq("template_id", templateId)
    .order("position");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: psRaw } = await (supabase as any)
    .from("template_promises")
    .select("id, position, text")
    .eq("template_id", templateId)
    .order("position");
  const t = tplRaw as {
    id: string;
    name: string;
    emoji: string | null;
    description: string | null;
    mood_tag_options: unknown;
  };
  return {
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    description: t.description,
    mood_tag_options: Array.isArray(t.mood_tag_options)
      ? (t.mood_tag_options as string[])
      : null,
    questions: ((qsRaw as Array<{
      id: string;
      position: number;
      type: string;
      text: string;
      options: unknown;
    }> | null) ?? []).map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? (q.options as string[]) : null,
    })),
    promises: ((psRaw as Array<{ id: string; position: number; text: string }> | null) ?? []),
  };
}
