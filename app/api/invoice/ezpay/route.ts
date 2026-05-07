import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ezPay 雲端發票開立 stub。
// 設 EZPAY_MERCHANT_ID + EZPAY_HASH_KEY + EZPAY_HASH_IV 之後接實際 API。
// 觸發時機:Stripe webhook checkout.session.completed → call this with order_id

export async function POST(request: Request) {
  const { order_id } = (await request.json()) as { order_id: string };
  if (!order_id) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, total_twd, items, user_id")
    .eq("id", order_id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  if (
    !process.env.EZPAY_MERCHANT_ID ||
    !process.env.EZPAY_HASH_KEY ||
    !process.env.EZPAY_HASH_IV
  ) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: "ezPay 還沒接,訂單已記錄但發票暫不開立",
        order_id,
      },
      { status: 503 },
    );
  }

  // TODO Phase 4:接 ezPay 實際 API
  // POST https://cinv.ezpay.com.tw/Api/invoice_issue
  // 加密 PostData_ 用 EZPAY_HASH_KEY / EZPAY_HASH_IV(AES-256-CBC)
  return NextResponse.json({
    error: "not_implemented",
    message: "ezPay API 串接待 merchant 通過後完成",
  }, { status: 501 });
}
