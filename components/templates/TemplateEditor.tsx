"use client";

import { useState, useMemo } from "react";
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
  type SuggestionCategory,
} from "@/lib/templates/suggestions";
import { TemplatePreview } from "./TemplatePreview";

const DAILY_TYPES: { value: SuggestionType; label: string }[] = [
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

  const [name, setName] = useState(templateName);
  const [emoji, setEmoji] = useState(templateEmoji);
  const [description, setDescription] = useState(templateDescription);

  // 兩類 tab
  const [tab, setTab] = useState<SuggestionCategory>("daily");

  // 自己加題(日常 tab)
  const [newType, setNewType] = useState<SuggestionType>("short_text");
  const [newText, setNewText] = useState("");
  const [newOptions, setNewOptions] = useState("");

  // 自己加寫信題
  const [newLetterText, setNewLetterText] = useState("");

  const [newPromise, setNewPromise] = useState("");
  const [loading, setLoading] = useState(false);

  const usedQuestionTexts = useMemo(
    () => new Set(questions.map((q) => q.text)),
    [questions],
  );
  const usedPromiseTexts = useMemo(
    () => new Set(promises.map((p) => p.text)),
    [promises],
  );

  const visibleSuggestions = useMemo(
    () =>
      QUESTION_SUGGESTIONS.filter(
        (s) => s.category === tab && !usedQuestionTexts.has(s.text),
      ),
    [tab, usedQuestionTexts],
  );

  async function addQuestion(text: string, type: SuggestionType, options: string[] | null) {
    if (!text.trim()) return;
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
      setNewPromise("");
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
      {/* 左:iPhone 預覽 */}
      <aside className="lg:w-[55%] lg:sticky lg:top-6 lg:self-start">
        <TemplatePreview
          emoji={emoji}
          name={name}
          description={description}
          questions={questions}
          promises={promises}
        />
        <p className="text-center text-xs text-zinc-400 mt-4 lg:mt-6">
          ← 即時預覽,實際填的時候就長這樣
        </p>
      </aside>

      {/* 右:控制 */}
      <main className="lg:w-[45%] flex flex-col gap-4">
        {/* 模板基本 */}
        <Card className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              className="w-14 h-14 rounded-[var(--radius-button)] border border-zinc-200 text-3xl text-center bg-white"
            />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="模板名稱"
              maxLength={40}
              className="flex-1"
            />
          </div>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="什麼時候用這份?"
            maxLength={120}
          />
          <Button onClick={saveMeta} loading={loading} variant="secondary" size="sm">
            儲存模板資料
          </Button>
        </Card>

        {/* Tab 切換 */}
        <div className="grid grid-cols-2 rounded-[var(--radius-button)] bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setTab("daily")}
            className={`py-2.5 text-sm font-medium rounded-md transition ${
              tab === "daily"
                ? "bg-white shadow text-[var(--color-rose)]"
                : "text-zinc-500"
            }`}
          >
            日常題
          </button>
          <button
            type="button"
            onClick={() => setTab("letter")}
            className={`py-2.5 text-sm font-medium rounded-md transition ${
              tab === "letter"
                ? "bg-white shadow text-[var(--color-rose)]"
                : "text-zinc-500"
            }`}
          >
            ✍️ 寫信給對方
          </button>
        </div>

        {tab === "letter" && (
          <Card className="bg-amber-50 border border-amber-200 text-sm leading-relaxed text-zinc-700">
            情侶常常想寫小作文給對方,結果留在 LINE 聊天室就散失了。
            <br />
            <span className="font-medium">這裡寫,我們幫你存下來。</span>
          </Card>
        )}

        {/* 建議題 */}
        {visibleSuggestions.length > 0 && (
          <Card className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">
                {tab === "daily" ? "其他人都這樣寫" : "靈感題"}
              </h3>
              <span className="text-xs text-zinc-400">點擊加入</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {visibleSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    addQuestion(s.text, s.type, s.options ? [...s.options] : null)
                  }
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-button)] hover:bg-zinc-50 text-left text-sm border border-zinc-100 transition group"
                >
                  <span className="flex-1 truncate">{s.text}</span>
                  <Badge tone="rose">{s.popularity}%</Badge>
                  <span className="text-xs text-zinc-400 hidden sm:inline">
                    {DAILY_TYPES.find((t) => t.value === s.type)?.label ?? "✍️ 寫信"}
                  </span>
                  <span className="text-zinc-300 group-hover:text-[var(--color-rose)] transition">
                    +
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* 自己加題 */}
        <Card className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">自己加一題</h3>
          {tab === "daily" ? (
            <>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as SuggestionType)}
                className="px-3 py-2 rounded-[var(--radius-button)] border border-zinc-200 text-sm"
              >
                {DAILY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
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
              <Button
                onClick={() => {
                  const opts =
                    newType === "multi_choice"
                      ? newOptions.split("\n").map((s) => s.trim()).filter(Boolean)
                      : null;
                  addQuestion(newText, newType, opts);
                  setNewText("");
                  setNewOptions("");
                }}
                disabled={!newText.trim() || loading}
              >
                加進來
              </Button>
            </>
          ) : (
            <>
              <Input
                value={newLetterText}
                onChange={(e) => setNewLetterText(e.target.value)}
                placeholder="例:今天最想跟你說的長話"
                maxLength={80}
              />
              <p className="text-xs text-zinc-400 leading-relaxed">
                這是「寫信題」 — 你跟對方填的時候會看到一個大空格,可以寫長一點。
              </p>
              <Button
                onClick={() => {
                  addQuestion(newLetterText, "letter", null);
                  setNewLetterText("");
                }}
                disabled={!newLetterText.trim() || loading}
              >
                加寫信題
              </Button>
            </>
          )}
        </Card>

        {/* 已選題目 */}
        <Card className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            已選 <span className="text-zinc-400 font-normal">({questions.length} 題)</span>
          </h3>
          {questions.length === 0 ? (
            <p className="text-xs text-zinc-400">還沒有題目,從上面建議挑或自己加</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {questions.map((q, i) => (
                <li
                  key={q.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-50 text-sm"
                >
                  <span className="text-xs text-zinc-400 w-5 tabular-nums">{i + 1}</span>
                  <span className="flex-1 truncate">{q.text}</span>
                  <Badge tone="neutral">
                    {q.type === "letter"
                      ? "✍️"
                      : DAILY_TYPES.find((t) => t.value === q.type)?.label ?? q.type}
                  </Badge>
                  <button
                    type="button"
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

        {/* 承諾 */}
        <Card className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            這份模板的承諾{" "}
            <span className="text-zinc-400 font-normal">({promises.length})</span>
          </h3>
          {promises.length > 0 && (
            <ul className="flex flex-col gap-1">
              {promises.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 text-sm"
                >
                  <span className="flex-1">🤝 {p.text}</span>
                  <button
                    type="button"
                    onClick={() => removePromise(p.id)}
                    className="text-xs text-zinc-400 hover:text-red-500"
                  >
                    刪
                  </button>
                </li>
              ))}
            </ul>
          )}
          {PROMISE_SUGGESTIONS.filter((s) => !usedPromiseTexts.has(s.text)).length > 0 && (
            <div className="flex flex-col gap-1 pt-2 border-t border-zinc-100">
              <span className="text-xs text-zinc-500">推薦承諾:</span>
              {PROMISE_SUGGESTIONS.filter((s) => !usedPromiseTexts.has(s.text)).map((s, i) => (
                <button
                  key={i}
                  onClick={() => addPromise(s.text)}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-50 text-left text-sm border border-zinc-100"
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
              placeholder="自己寫一條"
              maxLength={80}
            />
            <Button
              onClick={() => addPromise(newPromise)}
              disabled={!newPromise.trim()}
            >
              加
            </Button>
          </div>
        </Card>

        <Button variant="danger" onClick={deleteTemplate} fullWidth>
          刪除這份模板
        </Button>
      </main>
    </div>
  );
}
