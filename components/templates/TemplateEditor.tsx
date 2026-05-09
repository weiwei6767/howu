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
} from "@/lib/templates/suggestions";
import { TemplatePreview } from "./TemplatePreview";

const TYPE_OPTIONS: { value: SuggestionType; label: string }[] = [
  { value: "slider", label: "1-10 滑桿" },
  { value: "short_text", label: "短文字" },
];

const TYPE_LABEL_SHORT: Record<string, string> = {
  slider: "滑桿",
  short_text: "短文",
  // 舊資料相容(不會在新模板建立)
  multi_choice: "多選",
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

  const [newType, setNewType] = useState<SuggestionType>("short_text");
  const [newText, setNewText] = useState("");
  const [newPromise, setNewPromise] = useState("");

  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const usedQuestionTexts = useMemo(
    () => new Set(questions.map((q) => q.text)),
    [questions],
  );
  const usedPromiseTexts = useMemo(
    () => new Set(promises.map((p) => p.text)),
    [promises],
  );

  const visibleSuggestions = useMemo(
    () => QUESTION_SUGGESTIONS.filter((s) => !usedQuestionTexts.has(s.text)),
    [usedQuestionTexts],
  );
  const visiblePromiseSugs = useMemo(
    () => PROMISE_SUGGESTIONS.filter((s) => !usedPromiseTexts.has(s.text)),
    [usedPromiseTexts],
  );

  async function addQuestion(text: string, type: SuggestionType) {
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
          options: null,
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

  const previewBlock = (
    <TemplatePreview
      emoji={emoji}
      name={name}
      description={description}
      questions={questions}
      promises={promises}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ─── 模板基本資料 + 儲存 ─── */}
      <section className="flex flex-col gap-3 border-b border-[var(--color-paper-line)] pb-5">
        <div className="flex items-center gap-2">
          <input
            value={emoji}
            onChange={(e) => {
              setEmoji(e.target.value);
              setMetaDirty(true);
            }}
            maxLength={4}
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
        <div className="flex gap-2">
          <Button onClick={saveAll} loading={loading} fullWidth disabled={!metaDirty}>
            {metaDirty ? "儲存模板" : "已儲存"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPreviewOpen(true)}
            className="lg:hidden shrink-0"
          >
            預覽
          </Button>
        </div>
      </section>

      {/* ─── 桌面三欄、手機單欄 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,340px)] gap-8">
        {/* 左:題目 + 小懲罰(主要編輯區) */}
        <div className="flex flex-col gap-7 min-w-0">
          {/* 已選 */}
          <section className="flex flex-col gap-3">
            <header className="flex items-baseline justify-between">
              <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
                已選 ({questions.length})
              </h2>
              <span className="text-xs text-[var(--color-ink-soft)]">
                依順序出現
              </span>
            </header>
            {questions.length === 0 ? (
              <div className="text-center text-sm text-[var(--color-ink-soft)] py-8 border border-dashed border-[var(--color-paper-line)] rounded-[var(--radius-card)]">
                還沒加題目
                <br />從下方來加入
              </div>
            ) : (
              <ul className="flex flex-col">
                {questions.map((q, i) => (
                  <li
                    key={q.id}
                    className="flex items-center gap-2 py-2.5 border-b border-[var(--color-paper-line)] last:border-b-0"
                  >
                    <span className="text-xs text-[var(--color-ink-soft)] w-5 tabular-nums shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm">{q.text}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)] shrink-0">
                      {TYPE_LABEL_SHORT[q.type] ?? q.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] px-1 shrink-0 text-lg leading-none"
                      title="刪除"
                      aria-label="刪除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 推薦題目 */}
          <section className="flex flex-col gap-3">
            <header className="flex items-baseline justify-between">
              <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
                推薦題目
              </h2>
              <span className="text-xs text-[var(--color-ink-soft)]">點擊加入 →</span>
            </header>
            {visibleSuggestions.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)] py-3 text-center">
                推薦的都加完了
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
                      onClick={() => addQuestion(s.text, s.type)}
                      disabled={loading}
                      className="w-full flex items-center gap-2 py-3 text-left text-sm group active:bg-[var(--color-paper-dim)] transition-colors px-1 rounded"
                    >
                      <span className="flex-1 min-w-0 truncate">{s.text}</span>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-soft)] shrink-0">
                        {TYPE_LABEL_SHORT[s.type] ?? s.type}
                      </span>
                      <span className="text-[10px] text-[var(--color-ink-soft)] tabular-nums shrink-0">
                        {s.popularity}%
                      </span>
                      <span className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] text-lg leading-none w-5 text-center shrink-0">
                        +
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 自己加一題 */}
          <section className="flex flex-col gap-3 border-t border-[var(--color-paper-line)] pt-5">
            <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
              自己加一題
            </h2>
            <div className="grid grid-cols-2 gap-px border border-[var(--color-paper-line)] rounded-[var(--radius-button)] overflow-hidden bg-[var(--color-paper-line)]">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewType(opt.value)}
                  className={`py-2 text-sm transition-colors ${
                    newType === opt.value
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-white text-[var(--color-ink-mid)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="題目內容(例:今天的滿足度)"
              maxLength={80}
            />
            <Button
              onClick={() => {
                addQuestion(newText, newType);
                setNewText("");
              }}
              disabled={!newText.trim() || loading}
              loading={loading}
              className="self-start"
            >
              加進來
            </Button>
          </section>

          {/* 小懲罰 */}
          <section className="flex flex-col gap-3 border-t border-[var(--color-paper-line)] pt-5">
            <header className="flex items-baseline justify-between">
              <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
                小懲罰 ({promises.length})
              </h2>
            </header>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed -mt-1">
              如果對方那天沒寫問卷,要履行的小事(以後會支援自動扣款)
            </p>

            {promises.length === 0 ? (
              <div className="text-center text-sm text-[var(--color-ink-soft)] py-8 border border-dashed border-[var(--color-paper-line)] rounded-[var(--radius-card)]">
                還沒加小懲罰
                <br />從下方來加入
              </div>
            ) : (
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
                      className="text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] px-1 text-lg leading-none"
                      aria-label="刪除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {visiblePromiseSugs.length > 0 && (
              <div className="flex flex-col">
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                  推薦小懲罰
                </p>
                {visiblePromiseSugs.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addPromise(s.text)}
                    disabled={loading}
                    className="flex items-center gap-2 py-2 text-left text-sm border-b border-[var(--color-paper-line)] last:border-b-0 group"
                  >
                    <span className="flex-1 truncate">{s.text}</span>
                    <span className="text-[10px] text-[var(--color-ink-soft)] tabular-nums shrink-0">
                      {s.popularity}%
                    </span>
                    <span className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] text-lg leading-none w-5 text-center shrink-0">
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
                placeholder="自己寫一條小懲罰"
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
          </section>

          <Button variant="danger" onClick={deleteTemplate} fullWidth>
            刪除這份模板
          </Button>
        </div>

        {/* 右:預覽(只在桌面顯示) */}
        <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
          {previewBlock}
          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)] mt-3">
            即時預覽
          </p>
        </aside>
      </div>

      {/* 手機:預覽全螢幕 sheet */}
      {previewOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="w-full bg-[var(--color-paper)] rounded-t-[24px] max-h-[90vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
                即時預覽
              </h3>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[var(--color-paper-dim)] flex items-center justify-center text-[var(--color-ink-mid)]"
                aria-label="關閉"
              >
                ✕
              </button>
            </div>
            {previewBlock}
          </div>
        </div>
      )}
    </div>
  );
}
