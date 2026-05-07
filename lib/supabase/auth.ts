import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

/** Server-side: 拿 user 物件,沒登入時回 null */
export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/** 在 protected route 用:沒登入轉 /login */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** 拿目前 user 的 couple(active),沒配對回 null */
export async function getActiveCouple(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("couples")
    .select("*")
    .or(`partner_a_id.eq.${userId},partner_b_id.eq.${userId}`)
    .in("status", ["active", "paused", "recovery"])
    .order("paired_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** 拿 partner 的 profile(若已配對) */
export async function getPartnerProfile(userId: string, couple: { partner_a_id: string | null; partner_b_id: string | null } | null) {
  if (!couple) return null;
  const partnerId = couple.partner_a_id === userId ? couple.partner_b_id : couple.partner_a_id;
  if (!partnerId) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", partnerId).maybeSingle();
  return data ?? null;
}
