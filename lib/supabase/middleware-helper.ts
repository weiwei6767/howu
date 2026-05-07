import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/**
 * 在 proxy.ts (middleware) 中呼叫,把 Supabase auth cookie 寫進 outgoing response。
 * 必須在 next-intl middleware 取得 NextResponse 之後呼叫,以便共用同一個 response 物件。
 */
export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  // getUser 會 force 觸發 access token refresh(若 expired),並把新 cookie 寫入 response
  await supabase.auth.getUser();
}
