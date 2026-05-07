import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCardProduct } from "@/lib/store/card-products";

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

interface Body {
  product_id: string;
  customization: {
    nameA: string;
    nameB: string;
    together: string;
    extraNote: string;
  };
  shipping_address: {
    recipient: string;
    phone: string;
    addr1: string;
    addr2: string;
    city: string;
    zip: string;
  };
  expedited: boolean;
  total_twd: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const product = getCardProduct(body.product_id);
  if (!product) return NextResponse.json({ error: "product_not_found" }, { status: 404 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 拉 active couple(可能 null,不強制 couple 才能買卡片)
  const { data: coupleRaw } = await supabase
    .from("couples")
    .select("id")
    .or(`partner_a_id.eq.${user.id},partner_b_id.eq.${user.id}`)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const couple = coupleRaw as { id: string } | null;

  // 寫 order
  const { data: orderRaw, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      couple_id: couple?.id ?? null,
      items: [
        {
          type: "card_product",
          sku: product.id,
          qty: 1,
          price: product.base_price_twd,
          customization: body.customization,
        },
      ],
      total_twd: body.total_twd,
      shipping_address: body.shipping_address,
      status: "pending",
      expedited: body.expedited,
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const order = orderRaw as { id: string };

  // Stripe checkout
  const stripe = await loadStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        ok: true,
        message: "訂單已記下,Stripe 還沒接,等實際金流上線會通知付款連結",
        order_id: order.id,
      },
      { status: 200 },
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
          product_data: { name: `howu · ${product.name_zh}` },
          unit_amount: body.total_twd,
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${siteUrl}/orders?paid=${order.id}`,
    cancel_url: `${siteUrl}/store/cards/${product.id}`,
    metadata: { user_id: user.id, order_id: order.id, kind: "card" },
  });

  return NextResponse.json({ url: session.url, order_id: order.id });
}
