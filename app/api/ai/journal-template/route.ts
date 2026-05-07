import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// AI 日記模板生成 stub。
// 設 OPENAI_API_KEY 後接 OpenAI;沒設時回 fallback 模板。
//
// 規則(CLAUDE.md):key 不能進前端,所有呼叫走後端代理。

const FALLBACK_TEMPLATES = [
  "今天我注意到對方的{moment},讓我覺得{feeling}。",
  "我想記得今天{when}的時候,因為...",
  "如果今天可以重來一次,我會{wish}。最大的收穫是{insight}。",
  "對 {partner} 想說一件事:{thanks}。",
  "今天最讓我笑的一刻是 {moment}。",
];

interface Body {
  mood?: string;
  partner_name?: string;
  vibe?: "happy" | "tired" | "thoughtful" | "warm";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // fallback:回隨機 template,前端拿到自己 fill
    const tpl = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
    return NextResponse.json({
      source: "fallback",
      template: tpl
        .replace("{partner}", body.partner_name ?? "對方")
        .replace(/\{moment\}/g, "(填入今天的瞬間)")
        .replace(/\{feeling\}/g, "(那種感覺)")
        .replace(/\{when\}/g, "(時刻)")
        .replace(/\{wish\}/g, "(想做的事)")
        .replace(/\{insight\}/g, "(體會)")
        .replace(/\{thanks\}/g, "(想感謝的事)"),
    });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "你是一個溫柔、不矯情的日記啟發者。給用戶 1-2 句話的開頭,讓他能順著寫下今天。用繁體中文,不要過於文藝,不要詢問。",
          },
          {
            role: "user",
            content: `情侶日記 · 今天的氛圍是 ${body.vibe ?? "warm"} · 對方稱呼 ${body.partner_name ?? "對方"} · 心情標籤 ${body.mood ?? "未指定"}。給我一個適合續寫的開頭。`,
          },
        ],
        max_tokens: 120,
        temperature: 0.8,
      }),
    });
    const json = await r.json();
    const text =
      json.choices?.[0]?.message?.content?.trim() ??
      "今天我想記得的是 ...";
    return NextResponse.json({ source: "openai", template: text });
  } catch (e) {
    return NextResponse.json({
      source: "fallback_after_error",
      template: "今天最想記下的一個畫面是 ...",
      error: (e as Error).message,
    });
  }
}
