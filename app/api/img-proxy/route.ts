import { createServerClient } from "@supabase/ssr";
import { strip } from "@/lib/utils/env";

const ALLOWED_BUCKETS = new Set(["shared_photos", "journal_photos"]);

/**
 * Same-origin 圖片代理。把 Supabase storage 的圖透過自家 server 送回前端,
 * 避免 cross-origin canvas taint(html-to-image 下載功能要用)。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const bucket = url.searchParams.get("bucket") ?? "shared_photos";
  if (!path) return new Response("missing path", { status: 400 });
  if (!ALLOWED_BUCKETS.has(bucket)) return new Response("invalid bucket", { status: 400 });

  const supabaseUrl = strip(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey =
    strip(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    strip(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const { data, error } = await client.storage.from(bucket).download(path);
  if (error || !data) return new Response("not found", { status: 404 });

  const buf = Buffer.from(await data.arrayBuffer());
  return new Response(buf, {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
