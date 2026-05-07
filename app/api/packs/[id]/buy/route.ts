import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

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

interface PackRow {
  id: string;
  name_zh: string;
  price_twd: number | null;
  is_premium_included: boolean | null;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: packId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: packRaw } = await supabase
    .from("question_packs")
    .select("id, name_zh, price_twd, is_premium_included")
    .eq("id", packId)
    .maybeSingle();
  const pack = packRaw as PackRow | null;
  if (!pack) return NextResponse.json({ error: "pack_not_found" }, { status: 404 });

  // 免費包 → 直接 mark 已擁有
  if ((pack.price_twd ?? 0) <= 0) {
    await markPurchased(user.id, packId, "complimentary", null, 0);
    return NextResponse.json({ ok: true, free: true });
  }

  const stripe = await loadStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "not_configured", message: "Stripe 還沒接,先試 Premium 訂閱(內含全部題包)" },
      { status: 503 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://howu.online";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (stripe as any).checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "twd",
          product_data: { name: `howu 題包:${pack.name_zh}` },
          unit_amount: pack.price_twd!,
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${siteUrl}/store/packs/${packId}?purchased=1`,
    cancel_url: `${siteUrl}/store/packs/${packId}`,
    metadata: { user_id: user.id, pack_id: packId, kind: "pack" },
  });

  return NextResponse.json({ url: session.url });
}

async function markPurchased(
  userId: string,
  packId: string,
  provider: string,
  paymentId: string | null,
  amount: number,
) {
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("pack_purchases").upsert(
    {
      user_id: userId,
      pack_id: packId,
      provider,
      provider_payment_id: paymentId,
      amount_twd: amount,
    },
    { onConflict: "user_id,pack_id" },
  );
}
