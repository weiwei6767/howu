"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/store/toast";
import type { CardProduct } from "@/lib/store/card-products";

interface Props {
  product: CardProduct;
  defaultNameA: string;
  defaultNameB: string;
  defaultTogetherSince: string | null;
  ddayCount: number | null;
  syncLevel: number;
  isPremium: boolean;
  locale: string;
}

export function CardCustomize({
  product,
  defaultNameA,
  defaultNameB,
  defaultTogetherSince,
  ddayCount,
  syncLevel,
  isPremium,
  locale,
}: Props) {
  const router = useRouter();
  const [nameA, setNameA] = useState(defaultNameA);
  const [nameB, setNameB] = useState(defaultNameB);
  const [together, setTogether] = useState(defaultTogetherSince ?? "");
  const [extraNote, setExtraNote] = useState("");
  const [shipping, setShipping] = useState({
    recipient: "",
    phone: "",
    addr1: "",
    addr2: "",
    city: "",
    zip: "",
  });
  const [expedited, setExpedited] = useState(false);
  const [loading, setLoading] = useState(false);

  const discount = isPremium ? 0.9 : 1;
  const totalTwd =
    Math.round(
      (product.base_price_twd + (expedited ? product.expedited_extra_twd : 0)) * discount,
    );

  async function checkout() {
    if (!shipping.recipient || !shipping.phone || !shipping.addr1 || !shipping.zip) {
      toast(locale === "en" ? "Please fill shipping info" : "請填寫收件資訊", { tone: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          customization: { nameA, nameB, together, extraNote },
          shipping_address: shipping,
          expedited,
          total_twd: totalTwd,
        }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      if (json.ok) {
        toast(locale === "en" ? "Order created" : "訂單已建立", { tone: "success" });
        router.push(`/orders`);
        return;
      }
      toast(json.message ?? json.error ?? "error", { tone: "info", duration: 5000 });
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 預覽 */}
      <Card className="bg-gradient-to-br from-rose-50 to-amber-50 text-center py-8">
        <div className="text-5xl mb-2">{product.emoji}</div>
        <div className="text-lg font-semibold">
          {nameA || "你"} <span className="text-[var(--color-rose)] mx-1">&</span> {nameB || "對方"}
        </div>
        {ddayCount !== null && (
          <div className="text-3xl font-semibold tabular-nums text-[var(--color-rose)] my-2">
            {ddayCount} 天
          </div>
        )}
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge tone="rose">默契 Lv.{syncLevel}</Badge>
          {extraNote && <span className="text-xs text-zinc-500">「{extraNote}」</span>}
        </div>
      </Card>

      {/* 客製化欄位 */}
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">客製內容</h2>
        {product.fields.includes("display_name_a") && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-500">A 的稱呼</label>
            <Input value={nameA} onChange={(e) => setNameA(e.target.value)} maxLength={20} />
          </div>
        )}
        {product.fields.includes("display_name_b") && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-500">B 的稱呼</label>
            <Input value={nameB} onChange={(e) => setNameB(e.target.value)} maxLength={20} />
          </div>
        )}
        {product.fields.includes("together_since") && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-500">在一起的日期</label>
            <Input type="date" value={together} onChange={(e) => setTogether(e.target.value)} />
          </div>
        )}
        {product.fields.includes("extra_note") && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-500">想印的一句話 (可選)</label>
            <Textarea
              rows={2}
              value={extraNote}
              maxLength={50}
              onChange={(e) => setExtraNote(e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* 收件資訊 */}
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">收件資訊</h2>
        <Input
          placeholder="收件人姓名"
          value={shipping.recipient}
          onChange={(e) => setShipping({ ...shipping, recipient: e.target.value })}
        />
        <Input
          placeholder="聯絡電話"
          value={shipping.phone}
          onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
        />
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="郵遞區號"
            value={shipping.zip}
            onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
            maxLength={5}
          />
          <Input
            className="col-span-2"
            placeholder="縣市"
            value={shipping.city}
            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
          />
        </div>
        <Input
          placeholder="地址(街/巷/弄)"
          value={shipping.addr1}
          onChange={(e) => setShipping({ ...shipping, addr1: e.target.value })}
        />
        <Input
          placeholder="號 / 樓 / 室"
          value={shipping.addr2}
          onChange={(e) => setShipping({ ...shipping, addr2: e.target.value })}
        />
      </Card>

      {/* 急件 + 總價 */}
      <Card className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={expedited}
            onChange={(e) => setExpedited(e.target.checked)}
          />
          <span>
            24 小時急件 +NT${product.expedited_extra_twd}
          </span>
        </label>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-zinc-500">總計</span>
          <span className="text-2xl font-semibold tabular-nums">NT${totalTwd}</span>
        </div>
        {isPremium && (
          <p className="text-xs text-amber-700">✨ Premium 折扣 9 折已套用</p>
        )}
      </Card>

      <Button onClick={checkout} loading={loading} fullWidth size="lg">
        前往結帳
      </Button>

      <p className="text-xs text-zinc-400 text-center leading-relaxed">
        台灣本島免運。下單後 5–7 工作天交付物流(急件 24h 內出貨)。隱私資訊只用於本次寄送,
        90 天後自動抹除。
      </p>
    </div>
  );
}
