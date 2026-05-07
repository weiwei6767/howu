// 每日問卷推播提醒 Edge Function
// 由外部 cron(cron-job.org)定時呼叫,用 X-Cron-Secret header 驗證。
// 找出今天還沒寫今日問卷的 couple 成員,對其 push_subscriptions 推送。
//
// 部署:supabase functions deploy send-daily-reminder --no-verify-jwt
// secrets:VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT / CRON_SECRET
//
// cron-job.org 設定:
//   URL    https://elhmtbzgjsuymtxzyjqc.supabase.co/functions/v1/send-daily-reminder
//   Method POST
//   Header X-Cron-Secret: <CRON_SECRET>
//   Schedule 0 12 * * *  (UTC = 台北 20:00)

// @ts-expect-error remote module
import { createClient } from "jsr:@supabase/supabase-js@2";
// @ts-expect-error npm specifier in Deno
import webpush from "npm:web-push@3.6.7";

interface PushSub {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  // @ts-expect-error Deno global
  const env = Deno.env;

  // 驗證 cron secret
  const expectedSecret = env.get("CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  webpush.setVapidDetails(
    env.get("VAPID_SUBJECT") ?? "mailto:contact@howu.online",
    env.get("VAPID_PUBLIC_KEY") ?? "",
    env.get("VAPID_PRIVATE_KEY") ?? "",
  );

  const supabase = createClient(env.get("SUPABASE_URL")!, env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const today = new Date().toISOString().slice(0, 10);

  const { data: couples } = await supabase
    .from("couples")
    .select("id, partner_a_id, partner_b_id")
    .eq("status", "active");

  const pendingUserIds: string[] = [];
  for (const c of couples ?? []) {
    const ids = [c.partner_a_id, c.partner_b_id].filter(Boolean) as string[];
    const { data: written } = await supabase
      .from("daily_responses")
      .select("responder_id")
      .eq("couple_id", c.id)
      .eq("date", today);
    const writtenIds = new Set((written ?? []).map((r) => r.responder_id));
    for (const id of ids) {
      if (!writtenIds.has(id)) pendingUserIds.push(id);
    }
  }

  if (pendingUserIds.length === 0) {
    return new Response(JSON.stringify({ count: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, keys")
    .in("user_id", pendingUserIds);

  let pushed = 0;
  let failed = 0;
  for (const s of (subs ?? []) as PushSub[]) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys },
        JSON.stringify({
          title: "howu",
          body: "今天還沒寫今日問卷,花 3 分鐘把今天寫進來吧。",
          url: "/",
        }),
      );
      pushed++;
    } catch (e) {
      failed++;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (e as any)?.statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", s.id);
      }
    }
  }

  return new Response(JSON.stringify({ pushed, failed, pending_users: pendingUserIds.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
