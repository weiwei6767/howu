import { NextResponse } from "next/server";

// LINE Pay subscription stub。
// LINE Pay 訂閱需 LINE Pay Merchant + 開通自動扣款,串 API 較複雜。
// 設 LINE_PAY_CHANNEL_ID + LINE_PAY_CHANNEL_SECRET 後接實際 API。

export async function POST() {
  if (!process.env.LINE_PAY_CHANNEL_ID || !process.env.LINE_PAY_CHANNEL_SECRET) {
    return NextResponse.json(
      { error: "not_configured", message: "LINE Pay 商家還沒申請完成,先用信用卡或街口" },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { error: "not_implemented", message: "LINE Pay 訂閱串接待商家通過後實作" },
    { status: 501 },
  );
}
