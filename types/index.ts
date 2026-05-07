// 跨檔共用純 TS 型別。對應 schema 的 row 型別由 lib/supabase/types.ts 自動生成。

export type RelationshipStatus = "active" | "paused" | "disconnected" | "recovery";

export type SecretDeliveryMode = "immediate" | "tomorrow" | "scheduled" | "private";

export type SubscriptionPlan = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "expired";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type FourGridTheme = "mood" | "food" | "animal" | "color" | "scene";
