import { setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface OrderRow {
  id: string;
  total_twd: number;
  status: string | null;
  expedited: boolean | null;
  created_at: string | null;
  tracking_number: string | null;
  items: unknown;
}

const STATUS_TONE: Record<string, "neutral" | "rose" | "green" | "danger" | "gold"> = {
  pending: "neutral",
  paid: "rose",
  processing: "rose",
  shipped: "gold",
  delivered: "green",
  cancelled: "neutral",
  refunded: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "待付款",
  paid: "已付款",
  processing: "印製中",
  shipped: "已寄出",
  delivered: "已送達",
  cancelled: "已取消",
  refunded: "已退款",
};

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { locale } = await params;
  await searchParams;
  setRequestLocale(locale);

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: ordersRaw } = await supabase
    .from("orders")
    .select("id, total_twd, status, expedited, created_at, tracking_number, items")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);
  const orders = (ordersRaw as OrderRow[] | null) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{locale === "en" ? "My orders" : "我的訂單"}</h1>

      {orders.length === 0 && (
        <Card className="text-center text-sm text-zinc-400 py-8">
          {locale === "en" ? "No orders yet" : "還沒有訂單"}
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {orders.map((o) => {
          const items = (o.items as Array<{ sku: string; type: string }>) ?? [];
          const status = o.status ?? "pending";
          return (
            <Card key={o.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-mono">
                  #{o.id.slice(0, 8)}
                </span>
                <Badge tone={STATUS_TONE[status] ?? "neutral"}>
                  {STATUS_LABEL[status] ?? status}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm">
                  {items.map((i) => i.sku).join(", ")}
                  {o.expedited && (
                    <Badge tone="gold" className="ml-2">急件</Badge>
                  )}
                </span>
                <span className="text-base font-semibold tabular-nums">NT${o.total_twd}</span>
              </div>
              {o.tracking_number && (
                <p className="text-xs text-zinc-500">物流單號:{o.tracking_number}</p>
              )}
              <p className="text-xs text-zinc-400">
                {o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : ""}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
