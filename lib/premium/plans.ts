// Premium plan 定義 — 顯示用,真正計費由 Stripe price ID 決定。

export type PlanId = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name_zh: string;
  name_en: string;
  price_twd: number;
  per_month_twd: number;
  saving_label_zh?: string;
  saving_label_en?: string;
  /** Stripe Price ID(在 .env 設;沒設代表 stub) */
  stripe_price_id_env: string;
}

export const PLANS: readonly Plan[] = [
  {
    id: "monthly",
    name_zh: "月訂閱",
    name_en: "Monthly",
    price_twd: 99,
    per_month_twd: 99,
    stripe_price_id_env: "STRIPE_PRICE_PREMIUM_MONTHLY",
  },
  {
    id: "yearly",
    name_zh: "年訂閱",
    name_en: "Yearly",
    price_twd: 990,
    per_month_twd: 83,
    saving_label_zh: "省 16%",
    saving_label_en: "Save 16%",
    stripe_price_id_env: "STRIPE_PRICE_PREMIUM_YEARLY",
  },
] as const;

export const PREMIUM_FEATURES_ZH = [
  "100+ 進階兩人題庫(感情主題、長期關係版)",
  "悄悄話年度回顧、無限制歷史回顧",
  "默契樹皮膚 / 季節限定主題",
  "回憶冊匯出 PDF 自訂封面",
  "推播提醒不限 1 條,可多時段排程",
  "排行榜 / 朋友榜可顯示自訂稱號",
  "AI 日記模板與情緒分析(beta)",
  "客製卡片印製 9 折,每年生日免運",
] as const;

export const PREMIUM_FEATURES_EN = [
  "100+ premium couple questions (deep topics, long-term)",
  "Whisper yearly recap, unlimited history",
  "Sync tree skins, seasonal themes",
  "Memory book PDF custom cover",
  "Multiple push schedules per day",
  "Custom display title in leaderboards",
  "AI journal templates & mood analysis (beta)",
  "10% off custom cards, free shipping on birthdays",
] as const;
