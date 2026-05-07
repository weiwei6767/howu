import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 通用 RPC wrapper(types.ts 還沒含的 functions 用這個避免 type 卡)。
 * 既有的 callRpc(in db.ts) 是 typed,這個是 untyped escape hatch。
 */
export async function callRpcCustom<TReturns = unknown>(
  client: SupabaseClient,
  name: string,
  args?: Record<string, unknown>,
): Promise<{ data: TReturns | null; error: { message: string } | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (client as any).rpc(name, args ?? {});
  return r;
}
