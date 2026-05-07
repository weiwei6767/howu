import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refreshSupabaseSession } from "./lib/supabase/middleware-helper";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  await refreshSupabaseSession(request, response);
  return response;
}

export const config = {
  // 排除 api / auth(我們的 route handlers)、_next / _vercel(框架) 與 . 開頭的靜態檔
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
