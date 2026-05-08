import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";
import { strip } from "@/lib/utils/env";

/**
 * Service-role server client. RLS bypassed.
 * Only use server-side, only for aggregations / public stats / restricted writes.
 */
export function createSupabaseAdminClient() {
  const url = strip(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = strip(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    strip(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return createServerClient<Database>(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
