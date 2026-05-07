import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/premium/plans";

// 不裝 stripe sdk,避免沒設 key 時也 build 失敗。
// 動態 import,只在 STRIPE_SECRET_KEY 存在時 require。
async function loadStripe(): Promise<unknown | null> {
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

export async function POST(request: Request) {
  const { plan } = (await request.json()) as { plan: PlanId };
  const planDef = PLANS.find((p) => p.id === plan);
  if (!planDef) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stripe = await loadStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "not_configured", message: "Stripe 還沒接上,請先到 .env 設 STRIPE_SECRET_KEY" },
      { status: 503 },
    );
  }

  const priceId = process.env[planDef.stripe_price_id_env];
  if (!priceId) {
    return NextResponse.json(
      {
        error: "price_not_configured",
        message: `請到 .env 設 ${planDef.stripe_price_id_env}`,
      },
      { status: 503 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://howu.online";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (stripe as any).checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${siteUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/premium`,
    metadata: { user_id: user.id, plan: planDef.id },
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}
