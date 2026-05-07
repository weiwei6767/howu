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

const TYPE_LABEL_SHORT: Record<string, string> = {
  slider: "滑桿",
  multi_choice: "多選",
  short_text: "短文",
  guess_partner: "猜對方",
  mood_tags: "心情",
  letter: "✍️ 信",
};

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
  const [metaDirty, setMetaDirty] = useState(false);

  const [tab, setTab] = useState<SuggestionCategory>("daily");

  // 自己加題
  const [newType, setNewType] = useState<SuggestionType>("short_text");
  const [newText, setNewText] = useState("");
  const [newOptions, setNewOptions] = useState("");
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

  async function saveAll() {
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
      setMetaDirty(false);
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
    <div className="flex flex-col gap-5">
      {/* ─────────── 模板基本資料 + 儲存 */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            value={emoji}
            onChange={(e) => {
              setEmoji(e.target.value);
              setMetaDirty(true);
            }}
            maxLength={4}
            className="w-12 h-12 rounded-[var(--radius-button)] border border-zinc-200 text-2xl text-center bg-white shrink-0"
          />
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setMetaDirty(true);
            }}
            placeholder="模板名稱"
            maxLength={40}
            className="flex-1"
          />
        </div>
        <Textarea
          rows={2}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setMetaDirty(true);
          }}
          placeholder="描述(選填) — 什麼時候適合用這份?"
          maxLength={120}
        />
        <Button
          onClick={saveAll}
          loading={loading}
          size="lg"
          fullWidth
          className={metaDirty ? "" : "opacity-70"}
        >
          {metaDirty ? "💾 儲存模板" : "✓ 模板已儲存"}
        </Button>
      </Card>

      {/* ─────────── 預覽 + 待選 + 已選 三欄 */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr_1fr] gap-5">
        {/* 1. iPhone 預覽 */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <TemplatePreview
            emoji={emoji}
            name={name}
            description={description}
            questions={questions}
            promises={promises}
          />
          <p className="text-center text-[11px] text-zinc-400 mt-3">即時預覽</p>
        </aside>

        {/* 2. 待選 */}
        <section className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h2 className="text-base font-semibold">待選</h2>
              <span className="text-xs text-zinc-400">點擊加入 →</span>
            </header>

            {/* tab */}
            <div className="grid grid-cols-2 rounded-[var(--radius-button)] bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setTab("daily")}
                className={`py-2 text-sm font-medium rounded-md transition ${
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
                className={`py-2 text-sm font-medium rounded-md transition ${
                  tab === "letter"
                    ? "bg-white shadow text-[var(--color-rose)]"
                    : "text-zinc-500"
                }`}
              >
                ✍️ 寫信給對方
              </button>
            </div>

            {tab === "letter" && (
              <p className="text-xs text-zinc-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                情侶常想寫小作文,結果留在 LINE 散失。<br />
                <span className="font-medium">這裡寫,我們幫你存下來。</span>
              </p>
            )}

            {visibleSuggestions.length === 0 ? (
              <p className="text-sm text-zinc-400 py-3 text-center">
                這類建議都加完了
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {visibleSuggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() =>
                        addQuestion(s.text, s.type, s.options ? [...s.options] : null)
                      }
                      disabled={loading}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-zinc-50 text-left text-sm border border-zinc-100 group"
                    >
                      <span className="flex-1 truncate">{s.text}</span>
                      <Badge tone="rose">{s.popularity}%</Badge>
                      <span className="text-zinc-300 group-hover:text-[var(--color-rose)] text-lg leading-none">
                        +
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* 自己加 */}
            <div className="border-t border-zinc-100 pt-3 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 font-medium">自己加一題</p>
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
                    size="sm"
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
                  <Button
                    onClick={() => {
                      addQuestion(newLetterText, "letter", null);
                      setNewLetterText("");
                    }}
                    disabled={!newLetterText.trim() || loading}
                    size="sm"
                  >
                    加寫信題
                  </Button>
                </>
              )}
            </div>
          </Card>
        </section>

        {/* 3. 已選 */}
        <section className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                已選 <span className="text-zinc-400 font-normal text-sm">({questions.length} 題)</span>
              </h2>
              <span className="text-xs text-zinc-400">問卷會照順序出</span>
            </header>

            {questions.length === 0 ? (
              <div className="text-center text-sm text-zinc-400 py-8 border border-dashed border-zinc-200 rounded-md">
                還沒加題目<br />← 從左邊待選挑一條
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {questions.map((q, i) => (
                  <li
                    key={q.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-50 text-sm"
                  >
                    <span className="text-xs text-zinc-400 w-5 tabular-nums">{i + 1}</span>
                    <span className="flex-1 truncate">{q.text}</span>
                    <Badge tone="neutral">{TYPE_LABEL_SHORT[q.type] ?? q.type}</Badge>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="text-zinc-300 hover:text-red-500 px-1"
                      title="刪除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 承諾 */}
          <Card className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h2 className="text-base font-semibold">
                承諾 <span className="text-zinc-400 font-normal text-sm">({promises.length})</span>
              </h2>
            </header>

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
                      className="text-zinc-300 hover:text-red-500 px-1"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {PROMISE_SUGGESTIONS.filter((s) => !usedPromiseTexts.has(s.text)).length > 0 && (
              <div className="flex flex-col gap-1 pt-2 border-t border-zinc-100">
                <p className="text-xs text-zinc-500">推薦承諾(點擊加入):</p>
                {PROMISE_SUGGESTIONS.filter((s) => !usedPromiseTexts.has(s.text)).map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addPromise(s.text)}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-50 text-left text-sm border border-zinc-100 group"
                  >
                    <span className="flex-1 truncate">{s.text}</span>
                    <Badge tone="rose">{s.popularity}%</Badge>
                    <span className="text-zinc-300 group-hover:text-[var(--color-rose)] text-lg leading-none">
                      +
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-zinc-100">
              <Input
                value={newPromise}
                onChange={(e) => setNewPromise(e.target.value)}
                placeholder="自己寫一條承諾"
                maxLength={80}
              />
              <Button
                onClick={() => addPromise(newPromise)}
                disabled={!newPromise.trim()}
                size="sm"
              >
                加
              </Button>
            </div>
          </Card>

          <Button variant="danger" onClick={deleteTemplate} fullWidth>
            刪除這份模板
          </Button>
        </section>
      </div>
    </div>
  );
}
