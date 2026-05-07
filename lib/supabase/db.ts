// 對 lib/supabase/types.ts(Supabase 自動生成)做擴充。
// 1) 重新 export Database 等型別供其他檔案使用
// 2) 提供 callRpc — 帶 typed args/returns 的 RPC 呼叫 helper(因為新 RPC 還沒在 types.ts 中)
import type { SupabaseClient } from "@supabase/supabase-js";
export type { Database } from "./types";

interface RPCs {
  create_invitation: {
    args?: { p_message?: string | null; p_message_style?: string };
    returns: { id: string; token: string; expires_at: string };
  };
  accept_invitation: {
    args: { p_token: string; p_together_since: string; p_relationship_type: string };
    returns: { couple_id: string };
  };
  pause_couple: { args?: undefined; returns: { couple_id: string; status: string } };
  resume_couple: { args?: undefined; returns: { couple_id: string; status: string } };
  start_disconnect: { args?: undefined; returns: { couple_id: string; status: string } };
  reconnect_couple: { args?: undefined; returns: { couple_id: string; status: string } };
  calculate_streak: {
    args: { p_couple_id: string };
    returns: { current_streak: number; longest_streak: number };
  };
}

export async function callRpc<K extends keyof RPCs>(
  client: SupabaseClient,
  name: K,
  args?: RPCs[K]["args"],
): Promise<{ data: RPCs[K]["returns"] | null; error: { message: string } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (client as any).rpc(name, args ?? {});
  return r;
}
