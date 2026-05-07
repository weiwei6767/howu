"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";
import {
  QUESTION_SUGGESTIONS,
  PROMISE_SUGGESTIONS,
  type SuggestionType,
} from "@/lib/templates/suggestions";

const TYPES: { value: SuggestionType; label: string }[] = [
  { value: "slider", label: "1-10 滑桿" },
  { value: "multi_choice", label: "多選" },
  { value: "short_text", label: "短文字" },
  { value: "guess_partner", label: "猜對方" },
  { value: "mood_tags", label: "心情標籤" },
];

interface Q {
  id: string;
  position: number;
  type: string;
  text: string;
  options: unknown;
}
interface P {
  id: string;
  position: number;
  text: string;
}

interface Props {
  templateId: string;
  templateName: string;
  templateEmoji: string;
  templateDescription: string;
  initialQuestions: Q[];
  initialPromises: P[];
}

export function TemplateEditor({
  templateId,
  templateName,
  templateEmoji,
  templateDescription,
  initialQuestions,
  initialPromises,
}: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [promises, setPromises] = useState(initialPromises);

  // 新題輸入
  const [newType, setNewType] = useState<SuggestionType>("short_text");
  const [newText, setNewText] = useState("");
  const [newOptions, setNewOptions] = useState("");

  // 新承諾輸入
  const [newPromise, setNewPromise] = useState("");

  // 模板基本資料編輯
  const [editingMeta, setEditingMeta] = useState(false);
  const [name, setName] = useState(templateName);
  const [emoji, setEmoji] = useState(templateEmoji);
  const [description, setDescription] = useState(templateDescription);

  const [loading, setLoading] = useState(false);

  async function addQuestion(text: string, type: SuggestionType, options: string[] | null) {
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("template_questions")
        .insert({
          template_id: templateId,
          position: questions.length,
          type,
          text: text.trim(),
          options: type === "multi_choice" && options ? options : null,
        })
        .select("id, position, type, text, options")
        .single();
      if (error) throw new Error(error.message);
      setQuestions([...questions, data as Q]);
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function addManualQuestion() {
    if (!newText.trim()) return;
    const opts =
      newType === "multi_choice"
        ? newOptions
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : null;
    await addQuestion(newText, newType, opts);
    setNewText("");
    setNewOptions("");
  }

  async function removeQuestion(id: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("template_questions").delete().eq("id", id);
    setQuestions(questions.filter((q) => q.id !== id));
  }

  async function addPromise(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("template_promises")
        .insert({
          template_id: templateId,
          position: promises.length,
          text: text.trim(),
        })
        .select("id, position, text")
        .single();
      if (error) throw new Error(error.message);
      setPromises([...promises, data as P]);
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function removePromise(id: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("template_promises").delete().eq("id", id);
    setPromises(promises.filter((p) => p.id !== id));
  }

  async function saveMeta() {
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("templates")
        .update({
          name: name.trim(),
          emoji,
          description: description.trim() || null,
        })
        .eq("id", templateId);
      if (error) throw new Error(error.message);
      toast("已儲存", { tone: "success" });
      setEditingMeta(false);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteTemplate() {
    if (!confirm("確定要刪除這份模板?(已填過的問卷不會被刪)")) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("templates")
      .update({ is_archived: true })
      .eq("id", templateId);
    if (error) {
      toast(error.message, { tone: "error" });
      return;
    }
    router.push("/templates");
  }

  // 過濾掉已加過的建議
  const usedQuestionTexts = new Set(questions.map((q) => q.text));
  const availableSuggestions = QUESTION_SUGGESTIONS.filter(
    (s) => !usedQuestionTexts.has(s.text),
  ).slice(0, 8);
  const usedPromiseTexts = new Set(promises.map((p) => p.text));
  const availablePromiseSugs = PROMISE_SUGGESTIONS.filter(
    (s) => !usedPromiseTexts.has(s.text),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 模板資訊 */}
      {editingMeta ? (
        <Card className="flex flex-col gap-3">
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            className="text-2xl text-center w-20"
          />
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditingMeta(false)} fullWidth>
              取消
            </Button>
            <Button onClick={saveMeta} loading={loading} fullWidth>
              儲存
            </Button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setEditingMeta(true)}
          className="text-xs text-[var(--color-rose)] underline self-start"
        >
          編輯名稱 / 圖示 / 描述
        </button>
      )}

      {/* 題目區 */}
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          題目 <span className="text-zinc-400 font-normal">({questions.length})</span>
        </h2>

        {questions.length === 0 ? (
          <p className="text-sm text-zinc-400">還沒有題目,從下面建議挑或自己加</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100">
            {questions.map((q) => (
              <li key={q.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{q.text}</p>
                  <div className="flex gap-1.5 mt-1">
                    <Badge tone="neutral">{TYPES.find((t) => t.value === q.type)?.label ?? q.type}</Badge>
                  </div>
                </div>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                >
                  刪
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 建議題目 */}
      {availableSuggestions.length > 0 && (
        <Card className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">其他人都這樣寫 · 一鍵加</h3>
          <div className="flex flex-col gap-1.5">
            {availableSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() =>
                  addQuestion(s.text, s.type, s.options ? [...s.options] : null)
                }
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-button)] hover:bg-zinc-50 text-left text-sm border border-zinc-100"
              >
                <span className="flex-1 truncate">{s.text}</span>
                <Badge tone="rose">{s.popularity}%</Badge>
                <span className="text-xs text-zinc-400">
                  {TYPES.find((t) => t.value === s.type)?.label}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* 自己加題 */}
      <Card className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">自己加一題</h3>
        <div className="flex gap-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as SuggestionType)}
            className="px-3 py-2 rounded-[var(--radius-button)] border border-zinc-200 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="題目內容"
          maxLength={80}
        />
        {newType === "multi_choice" && (
          <Textarea
            rows={3}
            value={newOptions}
            onChange={(e) => setNewOptions(e.target.value)}
            placeholder="選項(每行一個)"
          />
        )}
        <Button onClick={addManualQuestion} disabled={!newText.trim() || loading}>
          加入題目
        </Button>
      </Card>

      {/* 承諾區 */}
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          這份模板的承諾 <span className="text-zinc-400 font-normal">({promises.length})</span>
        </h2>
        {promises.length === 0 ? (
          <p className="text-sm text-zinc-400">沒有承諾,可以從下方建議挑或自己加</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100">
            {promises.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 gap-3">
                <span className="text-sm flex-1">🤝 {p.text}</span>
                <button
                  onClick={() => removePromise(p.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                >
                  刪
                </button>
              </li>
            ))}
          </ul>
        )}
        {availablePromiseSugs.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100">
            <span className="text-xs text-zinc-500">推薦承諾:</span>
            {availablePromiseSugs.map((s, i) => (
              <button
                key={i}
                onClick={() => addPromise(s.text)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-button)] hover:bg-zinc-50 text-left text-sm border border-zinc-100"
              >
                <span className="flex-1 truncate">{s.text}</span>
                <Badge tone="rose">{s.popularity}%</Badge>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t border-zinc-100">
          <Input
            value={newPromise}
            onChange={(e) => setNewPromise(e.target.value)}
            placeholder="自己加一條承諾"
            maxLength={80}
          />
          <Button
            onClick={() => {
              addPromise(newPromise);
              setNewPromise("");
            }}
            disabled={!newPromise.trim()}
          >
            加
          </Button>
        </div>
      </Card>

      <Button variant="danger" onClick={deleteTemplate} fullWidth>
        刪除這份模板(封存)
      </Button>
    </div>
  );
}
