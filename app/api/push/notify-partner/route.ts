import { NextResponse } from "next/server";
import webpush from "web-push";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { strip } from "@/lib/utils/env";

const VAPID_PUBLIC = strip(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
const VAPID_PRIVATE = strip(process.env.VAPID_PRIVATE_KEY);
const VAPID_SUBJECT = strip(process.env.VAPID_SUBJECT) || "mailto:contact@howu.online";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

interface PushSub {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface PartnerCompletedBody {
  reason: "partner_completed";
}

const STRINGS = {
  partner_completed: {
    "zh-TW": (name: string) => ({
      title: "howu · 對方寫完了",
      body: `${name} 已寫完今天的問卷,換你囉 ✦`,
    }),
    en: (name: string) => ({
      title: "howu · they finished",
      body: `${name} finished today's check-in — your turn ✦`,
    }),
  },
};

export async function POST(request: Request) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: "vapid_not_configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as PartnerCompletedBody;
  if (body?.reason !== "partner_completed") {
    return NextResponse.json({ error: "invalid_reason" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 找這位 user 所在的 active couple + partner
  const { data: coupleRow } = await supabase
    .from("couples")
    .select("id, partner_a_id, partner_b_id")
    .or(`partner_a_id.eq.${user.id},partner_b_id.eq.${user.id}`)
    .eq("status", "active")
    .maybeSingle();

  const couple = coupleRow as
    | { id: string; partner_a_id: string; partner_b_id: string | null }
    | null;
  if (!couple) return NextResponse.json({ error: "no_couple" }, { status: 400 });

  const partnerId =
    couple.partner_a_id === user.id ? couple.partner_b_id : couple.partner_a_id;
  if (!partnerId) {
    return NextResponse.json({ error: "no_partner" }, { status: 400 });
  }

  // 用 admin 拿自己 display_name + 對方 locale + 對方 push_subscriptions
  const admin = createSupabaseAdminClient();
  const { data: meRow } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const { data: partnerRow } = await admin
    .from("profiles")
    .select("locale")
    .eq("id", partnerId)
    .maybeSingle();
  const { data: subsRaw } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", partnerId);

  const myName = (meRow as { display_name: string | null } | null)?.display_name ?? "對方";
  const partnerLocale =
    ((partnerRow as { locale: string | null } | null)?.locale ?? "zh-TW") as
      | "zh-TW"
      | "en";
  const subs = (subsRaw as PushSub[] | null) ?? [];

  if (subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no_subscriptions" });
  }

  const pickStrings =
    STRINGS.partner_completed[partnerLocale] ?? STRINGS.partner_completed["zh-TW"];
  const payload = JSON.stringify({
    ...pickStrings(myName),
    url: "/",
    tag: "partner_completed",
  });

  let sent = 0;
  const dead: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          payload,
          { TTL: 60 * 60 * 12 },
        );
        sent += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          dead.push(s.id);
        }
      }
    }),
  );

  if (dead.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", dead);
  }

  return NextResponse.json({ ok: true, sent, dead: dead.length });
}
