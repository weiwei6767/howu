// 默契值計算 Edge Function (Deno runtime)
// 觸發時機:雙方都完成當日 daily_responses 後,前端 invoke。
// 規則對應 CLAUDE.md §5.3。冪等:重複 invoke 同一 (couple_id, date) 不重複加分。
//
// 部署:supabase functions deploy calculate-sync
//
// 防作弊:雙方答案完成時間 < 5 秒不計分。

// @ts-expect-error remote module
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTI_FRAUD_GAP_MS = 5_000;

interface RotatingAnswer {
  question_id?: string;
  type?: "slider" | "multi_choice" | "short_text" | "guess_partner";
  category?: string;
  value?: number | string | string[] | null;
}

// @ts-expect-error Deno global
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  try {
    const { couple_id, date } = await req.json();
    if (!couple_id || !date) {
      return json({ error: "missing_params" }, 400);
    }

    const supabase = createClient(
      // @ts-expect-error Deno global
      Deno.env.get("SUPABASE_URL")!,
      // @ts-expect-error Deno global
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: responses } = await supabase
      .from("daily_responses")
      .select("*")
      .eq("couple_id", couple_id)
      .eq("date", date);

    if (!responses || responses.length < 2) {
      return json({ status: "waiting" });
    }

    const [a, b] = responses;
    const ta = new Date(a.completed_at).getTime();
    const tb = new Date(b.completed_at).getTime();
    if (Math.abs(ta - tb) < ANTI_FRAUD_GAP_MS) {
      return json({ status: "anti_fraud_skipped" });
    }

    const { data: existing } = await supabase
      .from("sync_score_events")
      .select("id")
      .eq("couple_id", couple_id)
      .eq("date", date)
      .limit(1);
    if (existing && existing.length > 0) {
      return json({ status: "already_calculated" });
    }

    const events: Array<{
      couple_id: string;
      date: string;
      source: string;
      source_detail: Record<string, unknown>;
      delta: number;
    }> = [];

    // ─── 5 固定滑桿
    for (const field of ["happiness", "energy", "stress", "miss_partner", "us_overall"] as const) {
      const delta = sliderDelta(a[field], b[field]);
      if (delta > 0) {
        events.push({ couple_id, date, source: "fixed_q", source_detail: { field }, delta });
      }
    }

    // ─── 輪換題
    const aRot: RotatingAnswer[] = a.rotating_answers ?? [];
    const bRot: RotatingAnswer[] = b.rotating_answers ?? [];
    for (const ar of aRot) {
      const br = bRot.find((x) => x.question_id === ar.question_id);
      if (!br || !ar.question_id) continue;
      let delta = 0;
      if (ar.type === "slider") {
        delta = sliderDelta(numOrNull(ar.value), numOrNull(br.value));
      } else if (ar.type === "guess_partner") {
        // 兩人各猜對方;規則簡化:雙方猜的數字差距 ≤1 → +20/+10
        delta = guessPartnerDelta(numOrNull(ar.value), numOrNull(br.value));
      } else if (ar.type === "multi_choice") {
        delta = multiChoiceDelta(arrOrEmpty(ar.value), arrOrEmpty(br.value));
      }
      if (delta > 0) {
        events.push({
          couple_id,
          date,
          source: "rotating_q",
          source_detail: { question_id: ar.question_id, type: ar.type },
          delta,
        });
      }
    }

    // ─── 四格題
    const { data: fg } = await supabase
      .from("four_grid_responses")
      .select("responder_id, selected_index, theme")
      .eq("couple_id", couple_id)
      .eq("date", date);
    if (fg && fg.length === 2 && fg[0].selected_index === fg[1].selected_index && fg[0].selected_index !== null) {
      events.push({
        couple_id,
        date,
        source: "four_grid",
        source_detail: { theme: fg[0].theme, index: fg[0].selected_index },
        delta: 30,
      });
    }

    if (events.length > 0) {
      await supabase.from("sync_score_events").insert(events);
    }
    const totalDelta = events.reduce((s, e) => s + e.delta, 0);

    const { data: cur } = await supabase
      .from("sync_scores")
      .select("total_score")
      .eq("couple_id", couple_id)
      .maybeSingle();
    const next = (cur?.total_score ?? 0) + totalDelta;
    const level = computeLevel(next);

    await supabase
      .from("sync_scores")
      .upsert({
        couple_id,
        total_score: next,
        level,
        last_calculated_at: new Date().toISOString(),
      });

    return json({ delta: totalDelta, total: next, level });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function sliderDelta(a: number | null, b: number | null): number {
  if (a == null || b == null) return 0;
  const gap = Math.abs(a - b);
  if (gap === 0) return 5;
  if (gap === 1) return 2;
  return 0;
}
function guessPartnerDelta(a: number | null, b: number | null): number {
  if (a == null || b == null) return 0;
  const gap = Math.abs(a - b);
  if (gap === 0) return 20;
  if (gap === 1) return 10;
  return 0;
}
function multiChoiceDelta(a: string[], b: string[]): number {
  const A = new Set(a), B = new Set(b);
  const same = A.size === B.size && [...A].every((x) => B.has(x));
  if (same) return 5;
  if ([...A].some((x) => B.has(x))) return 2;
  return 0;
}
function computeLevel(score: number): number {
  const t = [0, 100, 300, 600, 1000, 1500, 2200, 3000];
  let lv = 1;
  for (let i = 0; i < t.length; i++) if (score >= t[i]) lv = i + 1;
  return lv;
}
function numOrNull(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}
function arrOrEmpty(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
