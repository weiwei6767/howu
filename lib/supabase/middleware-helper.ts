import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
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

export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, { ...COOKIE_OPTIONS, ...options });
        }
      },
    },
  });
  await supabase.auth.getUser();
}
