import { NextResponse } from "next/server";

// 街口支付訂閱 stub。
// 設 JKOPAY_MERCHANT_ID + JKOPAY_API_KEY 後接實際 API。

export async function POST() {
  if (!process.env.JKOPAY_MERCHANT_ID || !process.env.JKOPAY_API_KEY) {
    return NextResponse.json(
      { error: "not_configured", message: "街口商家還沒申請完成,先用信用卡或 LINE Pay" },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { error: "not_implemented", message: "街口訂閱串接待商家通過後實作" },
    { status: 501 },
  );
}
