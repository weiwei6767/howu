import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { strip } from "@/lib/utils/env";

const SUPABASE_URL = strip(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = strip(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 顯式設 path=/ 否則 PKCE code_verifier cookie 預設會綁在
// 觸發 signInWithOtp 那個 path(例:/zh-TW/login),等 magic link
// redirect 回 /auth/callback 時讀不到 → "code verifier not found"
const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: true,
  maxAge: 60 * 60 * 24 * 30,
};

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: COOKIE_OPTIONS,
  });
}
