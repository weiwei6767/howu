import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";
import type { Database } from "./types";

type Tables = Database["public"]["Tables"];
type CoupleRow = Tables["couples"]["Row"];
type ProfileRow = Tables["profiles"]["Row"];

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

/** 在 (app) 子頁面用:沒 couple 轉首頁,recovery 狀態轉回憶冊 */
export async function requireCouple(userId: string) {
  const couple = await getActiveCouple(userId);
  if (!couple) redirect("/");
  if (couple.status === "recovery") redirect("/memories/book");
  if (couple.status !== "active") redirect("/");
  return couple;
}

/** 給 /memories/book 用:active 跟 recovery 都讓進(避免 redirect 迴圈) */
export async function requireCoupleAllowRecovery(userId: string) {
  const couple = await getActiveCouple(userId);
  if (!couple) redirect("/");
  if (couple.status !== "active" && couple.status !== "recovery") redirect("/");
  return couple;
}

/** 拿目前 user 的 couple(active/paused/recovery 都拿) */
export async function getActiveCouple(userId: string): Promise<CoupleRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("couples")
    .select("*")
    .or(`partner_a_id.eq.${userId},partner_b_id.eq.${userId}`)
    .in("status", ["active", "paused", "recovery"])
    .order("paired_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CoupleRow | null) ?? null;
}

/** 拿 partner 的 profile(若已配對) */
export async function getPartnerProfile(
  userId: string,
  couple: Pick<CoupleRow, "partner_a_id" | "partner_b_id"> | null,
): Promise<ProfileRow | null> {
  if (!couple) return null;
  const partnerId = couple.partner_a_id === userId ? couple.partner_b_id : couple.partner_a_id;
  if (!partnerId) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", partnerId).maybeSingle();
  return (data as ProfileRow | null) ?? null;
}
