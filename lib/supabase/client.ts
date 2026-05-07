import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { strip } from "@/lib/utils/env";

const SUPABASE_URL = strip(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = strip(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
