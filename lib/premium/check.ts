import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Server-side: 判斷 user 是否 Premium(7 天 grace period 已含) */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc("is_premium_user", { p_user_id: userId });
  return data === true;
}

/** Server-side: couple 是否 premium(任一方 premium 即 true) */
export async function isPremiumCouple(coupleId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc("is_premium_couple", { p_couple_id: coupleId });
  return data === true;
}
