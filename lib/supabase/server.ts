import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";
import { strip } from "@/lib/utils/env";

const SUPABASE_URL = strip(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = strip(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: true,
  maxAge: 60 * 60 * 24 * 30,
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, { ...COOKIE_OPTIONS, ...options });
          }
        } catch {
          // Server Components 不能 set cookie
        }
      },
    },
  });
}
