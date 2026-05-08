"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
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
  letter: "信",
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
    <div className="flex flex-col gap-6">
      {/* 模板基本資料 */}
      <section className="flex flex-col gap-3 border-b border-[var(--color-paper-line)] pb-5">
        <div className="flex items-center gap-2">
          <input
            value={emoji}
            onChange={(e) => {
              setEmoji(e.target.value);
              setMetaDirty(true);
            }}
            maxLength={4}
            placeholder=""
            className="w-12 h-11 rounded-[var(--radius-button)] border border-[var(--color-paper-line)] text-2xl text-center bg-white shrink-0"
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
          placeholder="描述(選填) — 什麼時候適合用這份"
          maxLength={120}
        />
        <Button onClick={saveAll} loading={loading} fullWidth disabled={!metaDirty}>
          {metaDirty ? "儲存模板" : "已儲存"}
        </Button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr_1fr] gap-6">
        {/* 1. 預覽 */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <TemplatePreview
            emoji={emoji}
            name={name}
            description={description}
            questions={questions}
            promises={promises}
          />
          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] mt-3">
            即時預覽
          </p>
        </aside>

        {/* 2. 待選 */}
        <section className="flex flex-col gap-4">
          <header className="flex items-baseline justify-between">
            <h2 className="text-sm text-[var(--color-ink-mid)] uppercase tracking-[0.18em]">
              待選
            </h2>
            <span className="text-xs text-[var(--color-ink-soft)]">點擊加入 →</span>
          </header>

          <div className="grid grid-cols-2 border border-[var(--color-paper-line)] rounded-[var(--radius-button)] overflow-hidden">
            <button
              type="button"
              onClick={() => setTab("daily")}
              className={`py-2 text-sm transition-colors ${
                tab === "daily"
                  ? "bg-[var(--color-ink)] text-white"
                  : "text-[var(--color-ink-mid)] hover:bg-[var(--color-paper-dim)]"
              }`}
            >
              日常題
            </button>
            <button
              type="button"
              onClick={() => setTab("letter")}
              className={`py-2 text-sm transition-colors ${
                tab === "letter"
                  ? "bg-[var(--color-ink)] text-white"
                  : "text-[var(--color-ink-mid)] hover:bg-[var(--color-paper-dim)]"
              }`}
            >
              寫信給對方
            </button>
          </div>

          {tab === "letter" && (
            <p className="text-xs text-[var(--color-ink-mid)] leading-relaxed border-l-2 border-[var(--color-accent)] pl-3 py-1">
              情侶常想寫小作文,結果留在 LINE 散失。
              <span className="block mt-0.5 text-[var(--color-ink)]">
                這裡寫,我們幫你存下來。
              </span>
            </p>
          )}

          {visibleSuggestions.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)] py-3 text-center">
              這類建議都加完了
            </p>
          ) : (
            <ul className="flex flex-col">
              {visibleSuggestions.map((s, i) => (
                <li
                  key={i}
                  className="border-b border-[var(--color-paper-line)] last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      addQuestion(s.text, s.type, s.options ? [...s.options] : null)
                    }
                    disabled={loading}
                    className="w-full flex items-center gap-2 py-2.5 text-left text-sm group"
                  >
                    <span className="flex-1 truncate">{s.text}</span>
                    <span className="text-[10px] text-[var(--color-ink-soft)] tabular-nums">
                      {s.popularity}%
                    </span>
                    <span className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] text-lg leading-none w-5 text-center">
                      +
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-[var(--color-paper-line)] pt-4 flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
              自己加一題
            </p>
            {tab === "daily" ? (
              <>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as SuggestionType)}
                  className="px-3 py-2 rounded-[var(--radius-button)] border border-[var(--color-paper-line)] text-sm bg-white"
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
                  className="self-start"
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
                  className="self-start"
                >
                  加寫信題
                </Button>
              </>
            )}
          </div>
        </section>

        {/* 3. 已選 + 承諾 */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <header className="flex items-baseline justify-between">
              <h2 className="text-sm text-[var(--color-ink-mid)] uppercase tracking-[0.18em]">
                已選 ({questions.length})
              </h2>
              <span className="text-xs text-[var(--color-ink-soft)]">
                依順序出現
              </span>
            </header>

            {questions.length === 0 ? (
              <div className="text-center text-sm text-[var(--color-ink-soft)] py-8 border border-dashed border-[var(--color-paper-line)] rounded-[var(--radius-card)]">
                還沒加題目
                <br />← 從左邊待選挑一條
              </div>
            ) : (
              <ul className="flex flex-col">
                {questions.map((q, i) => (
                  <li
                    key={q.id}
                    className="flex items-center gap-2 py-2.5 border-b border-[var(--color-paper-line)] last:border-b-0"
                  >
                    <span className="text-xs text-[var(--color-ink-soft)] w-5 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm">{q.text}</span>
                    <span className="text-[10px] text-[var(--color-ink-soft)] uppercase tracking-wider">
                      {TYPE_LABEL_SHORT[q.type] ?? q.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] px-1"
                      title="刪除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--color-paper-line)] pt-5">
            <header className="flex items-baseline justify-between">
              <h2 className="text-sm text-[var(--color-ink-mid)] uppercase tracking-[0.18em]">
                承諾 ({promises.length})
              </h2>
            </header>

            {promises.length > 0 && (
              <ul className="flex flex-col">
                {promises.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 py-2 border-l-2 border-[var(--color-accent)] pl-3 mb-1"
                  >
                    <span className="flex-1 text-sm">{p.text}</span>
                    <button
                      type="button"
                      onClick={() => removePromise(p.id)}
                      className="text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] px-1"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {PROMISE_SUGGESTIONS.filter((s) => !usedPromiseTexts.has(s.text)).length > 0 && (
              <div className="flex flex-col">
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                  推薦承諾(點擊加入)
                </p>
                {PROMISE_SUGGESTIONS.filter((s) => !usedPromiseTexts.has(s.text)).map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addPromise(s.text)}
                    disabled={loading}
                    className="flex items-center gap-2 py-2 text-left text-sm border-b border-[var(--color-paper-line)] last:border-b-0 group"
                  >
                    <span className="flex-1 truncate">{s.text}</span>
                    <span className="text-[10px] text-[var(--color-ink-soft)] tabular-nums">
                      {s.popularity}%
                    </span>
                    <span className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] text-lg leading-none w-5 text-center">
                      +
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 border-t border-[var(--color-paper-line)] pt-3">
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
          </div>

          <Button variant="danger" onClick={deleteTemplate} fullWidth>
            刪除這份模板
          </Button>
        </section>
      </div>
    </div>
  );
}
