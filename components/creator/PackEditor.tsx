"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  text_zh: string;
  text_en: string;
  type: string;
  category: string;
}

interface Props {
  packId: string;
  questions: Question[];
}

const TYPES = ["slider", "multi_choice", "short_text", "guess_partner"] as const;
const CATEGORIES = ["interaction", "observe", "intimacy", "gratitude", "time", "open"] as const;

export function PackEditor({ packId, questions: initial }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initial);
  const [textZh, setTextZh] = useState("");
  const [textEn, setTextEn] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("short_text");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("open");
  const [optionsZh, setOptionsZh] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!textZh.trim()) {
      toast("中文題目必填", { tone: "error" });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const id = `user_${packId.slice(0, 8)}_${Date.now()}`;
      const opts = optionsZh.trim()
        ? optionsZh.split("\n").map((s) => s.trim()).filter(Boolean)
        : null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("questions").insert({
        id,
        pack_id: packId,
        category,
        type,
        text_zh: textZh.trim(),
        text_en: textEn.trim() || textZh.trim(),
        options_zh: type === "multi_choice" && opts ? opts : null,
        options_en: type === "multi_choice" && opts ? opts : null,
        for_relationship_types: ["cohabit", "same_city", "long_distance"],
        is_premium: false,
      });
      if (error) throw new Error(error.message);
      setQuestions([
        { id, text_zh: textZh.trim(), text_en: textEn.trim() || textZh.trim(), type, category },
        ...questions,
      ]);
      setTextZh("");
      setTextEn("");
      setOptionsZh("");
      toast("題目已加入", { tone: "success" });
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("questions").delete().eq("id", id);
    if (error) {
      toast(error.message, { tone: "error" });
      return;
    }
    setQuestions(questions.filter((q) => q.id !== id));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">新增題目</h2>
        <Input
          value={textZh}
          onChange={(e) => setTextZh(e.target.value)}
          placeholder="題目(中文)"
        />
        <Input
          value={textEn}
          onChange={(e) => setTextEn(e.target.value)}
          placeholder="Question (English) — 可不填"
        />
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
            className="flex-1 px-3 py-2 rounded-[var(--radius-button)] border border-zinc-200 text-sm"
          >
            {TYPES.map((tt) => (
              <option key={tt} value={tt}>{tt}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className="flex-1 px-3 py-2 rounded-[var(--radius-button)] border border-zinc-200 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {type === "multi_choice" && (
          <Textarea
            rows={4}
            value={optionsZh}
            onChange={(e) => setOptionsZh(e.target.value)}
            placeholder="選項(每行一個)"
          />
        )}
        <Button onClick={add} loading={loading}>加入題目</Button>
      </Card>

      <Card>
        <h2 className="text-base font-semibold mb-2">已加入 {questions.length} 題</h2>
        {questions.length === 0 ? (
          <p className="text-sm text-zinc-400">沒有題目,加幾題開始吧</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100">
            {questions.map((q) => (
              <li key={q.id} className="flex items-start justify-between py-2 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{q.text_zh}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 flex gap-2">
                    <Badge tone="neutral">{q.category}</Badge>
                    <Badge tone="neutral">{q.type}</Badge>
                  </p>
                </div>
                <button
                  onClick={() => remove(q.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                >
                  刪除
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
