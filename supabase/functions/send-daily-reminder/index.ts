// 每日問卷推播提醒 Edge Function
// 由 pg_cron 在 UTC 12:00(台北 20:00)等時段呼叫。
// 找出今天還沒寫今日問卷的 couple 成員,對其 push_subscriptions 推送。
//
// 部署:supabase functions deploy send-daily-reminder
// 設定環境變數:VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (在 supabase secrets set)

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
Deno.serve(async (_req: Request) => {
  // @ts-expect-error Deno global
  const env = Deno.env;
  webpush.setVapidDetails(
    env.get("VAPID_SUBJECT") ?? "mailto:contact@howu.online",
    env.get("VAPID_PUBLIC_KEY") ?? "",
    env.get("VAPID_PRIVATE_KEY") ?? "",
  );

  const supabase = createClient(env.get("SUPABASE_URL")!, env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const today = new Date().toISOString().slice(0, 10);

  // 找出 active couples
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
    return new Response(JSON.stringify({ count: 0 }), { status: 200 });
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
      // 410 Gone — 訂閱失效,清除
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (e as any)?.statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", s.id);
      }
    }
  }

  return new Response(JSON.stringify({ pushed, failed }), { status: 200 });
});
