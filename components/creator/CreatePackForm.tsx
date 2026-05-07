"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
}

export function CreatePackForm({ userId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [priceTwd, setPriceTwd] = useState(0);
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast("請填題包名稱", { tone: "error" });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("question_packs")
        .insert({
          creator_id: userId,
          name_zh: name.trim(),
          description_zh: desc.trim() || null,
          price_twd: priceTwd,
          type: priceTwd > 0 ? "creator" : "user_custom",
          is_active: true,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      router.push(`/creator/packs/${data.id}`);
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="text-sm">題包名稱</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例:小情侶口味測試包"
          maxLength={40}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm">介紹(選填)</label>
        <Textarea
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="這個包想記錄什麼?有什麼特色?"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm">售價 (NT$)</label>
        <Input
          type="number"
          min={0}
          value={priceTwd}
          onChange={(e) => setPriceTwd(Number(e.target.value) || 0)}
        />
        <p className="text-xs text-zinc-500">
          0 = 個人版(只有自己用),&gt;0 = 創作者包(待審核才上架商城)
        </p>
      </div>
      <Button onClick={create} loading={loading}>建立</Button>
    </Card>
  );
}
