import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Stripe webhook → 寫 subscriptions table。trigger sync_profile_premium 自動更新 profiles.is_premium。
//
// Stripe Dashboard 設 endpoint:https://howu.online/api/webhooks/stripe
// Events 訂:checkout.session.completed / customer.subscription.updated / .deleted

async function loadStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const mod = await import("stripe");
    const Stripe = mod.default;
    return new Stripe(key, { apiVersion: "2024-12-18.acacia" } as never);
  } catch {
    return null;
  }
}

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

export async function POST(request: Request) {
  const stripe = await loadStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  const body = await request.text();
  if (!sig) return NextResponse.json({ error: "no_signature" }, { status: 400 });

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event = (stripe as any).webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    return NextResponse.json({ error: `invalid_signature: ${(e as Error).message}` }, { status: 400 });
  }

  const supabase = adminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      client_reference_id: string;
      subscription: string;
      metadata: { user_id: string; plan: string };
    };
    const userId = session.metadata?.user_id ?? session.client_reference_id;
    if (!userId) return NextResponse.json({ error: "no_user" }, { status: 400 });

    // 拉 subscription 細節
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = await (stripe as any).subscriptions.retrieve(session.subscription);
    const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "stripe",
        provider_subscription_id: sub.id,
        status: "active",
        plan: session.metadata?.plan ?? "monthly",
        amount_twd: Math.round((sub.items.data[0]?.price?.unit_amount ?? 0) / 100) * 30,
        current_period_end: periodEnd,
      },
      { onConflict: "provider_subscription_id" },
    );
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as {
      id: string;
      status: string;
      current_period_end: number;
    };
    const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
    const status =
      sub.status === "active" || sub.status === "trialing"
        ? "active"
        : sub.status === "past_due"
          ? "past_due"
          : sub.status === "canceled"
            ? "cancelled"
            : "expired";
    await supabase
      .from("subscriptions")
      .update({ status, current_period_end: periodEnd })
      .eq("provider_subscription_id", sub.id);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { id: string };
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("provider_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
