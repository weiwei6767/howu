// 對方完成今日問卷時觸發,推播給未完成方
// 由 calculate-sync 或 client 完成 insert 後直接 invoke

// @ts-expect-error remote module
import { createClient } from "jsr:@supabase/supabase-js@2";
// @ts-expect-error npm specifier
import webpush from "npm:web-push@3.6.7";

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("405", { status: 405 });
  const { couple_id, responder_id } = await req.json();

  // @ts-expect-error Deno global
  const env = Deno.env;
  const supabase = createClient(env.get("SUPABASE_URL")!, env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  webpush.setVapidDetails(
    env.get("VAPID_SUBJECT") ?? "mailto:hello@loamia.xyz",
    env.get("VAPID_PUBLIC_KEY") ?? "",
    env.get("VAPID_PRIVATE_KEY") ?? "",
  );

  const { data: couple } = await supabase
    .from("couples")
    .select("partner_a_id, partner_b_id")
    .eq("id", couple_id)
    .maybeSingle();
  if (!couple) return new Response("404", { status: 404 });

  const partnerId = couple.partner_a_id === responder_id ? couple.partner_b_id : couple.partner_a_id;
  if (!partnerId) return new Response("ok", { status: 200 });

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys")
    .eq("user_id", partnerId);

  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys },
        JSON.stringify({
          title: "howu",
          body: "對方今天也寫好了 ✨",
          url: "/",
        }),
      );
    } catch {}
  }
  return new Response("ok", { status: 200 });
});
