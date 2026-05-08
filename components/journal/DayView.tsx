"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/lib/store/toast";
import { createClient } from "@/lib/supabase/client";

interface PhotoEntry {
  path: string;
  signedUrl: string;
}

export interface EntryRow {
  id: string;
  date: string;
  content: string | null;
  shared_with_partner: boolean | null;
  created_at: string | null;
  photos: { path: string }[];
  signedUrls: string[];
}

interface Props {
  userId: string;
  date: string;
  entries: EntryRow[];
}

export function DayView({ userId, date, entries: initialEntries }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [entries, setEntries] = useState<EntryRow[]>(initialEntries);
  const [composing, setComposing] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function deleteEntry(id: string) {
    if (!confirm(t("journal.delete_entry_confirm"))) return;
    const supabase = createClient();
    const target = entries.find((e) => e.id === id);
    if (target && target.photos.length > 0) {
      await supabase.storage.from("journal_photos").remove(target.photos.map((p) => p.path));
    }
    await supabase.from("journal_entries").delete().eq("id", id);
    setEntries(entries.filter((e) => e.id !== id));
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {composing ? (
        <NewEntryEditor
          userId={userId}
          date={date}
          onCancel={() => setComposing(false)}
          onSaved={(entry) => {
            setEntries([...entries, entry]);
            setComposing(false);
            refresh();
          }}
        />
      ) : (
        <Button onClick={() => setComposing(true)} fullWidth>
          {t("journal.write_one_in_day")}
        </Button>
      )}

      {entries.length === 0 && !composing && (
        <p className="text-center text-sm text-[var(--color-ink-soft)] py-8">
          {t("journal.day_no_entry")}
        </p>
      )}

      {entries.map((e) => (
        <EntryCard
          key={e.id}
          userId={userId}
          entry={e}
          onChanged={(updated) => {
            setEntries(entries.map((x) => (x.id === e.id ? updated : x)));
            refresh();
          }}
          onDeleted={() => deleteEntry(e.id)}
        />
      ))}
    </div>
  );
}

function NewEntryEditor({
  userId,
  date,
  onCancel,
  onSaved,
}: {
  userId: string;
  date: string;
  onCancel: () => void;
  onSaved: (entry: EntryRow) => void;
}) {
  const t = useTranslations();
  const [content, setContent] = useState("");
  const [share, setShare] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function ensureEntry(): Promise<string> {
    if (entryId) return entryId;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: userId, date, content: "" })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "create_failed");
    setEntryId(data.id);
    return data.id;
  }

  async function uploadPhotos(files: FileList) {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const eid = await ensureEntry();
      const uploaded: PhotoEntry[] = [];
      for (const f of Array.from(files)) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const photoId = crypto.randomUUID();
        const path = `${userId}/${eid}/${photoId}.${ext}`;
        const { error: upErr } = await supabase.storage.from("journal_photos").upload(path, f);
        if (upErr) {
          toast(`${f.name}: ${upErr.message}`, { tone: "error" });
          continue;
        }
        const { data: signed } = await supabase.storage
          .from("journal_photos")
          .createSignedUrl(path, 60 * 60 * 6);
        uploaded.push({ path, signedUrl: signed?.signedUrl ?? "" });
      }
      const next = [...photos, ...uploaded];
      setPhotos(next);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("journal_entries")
        .update({ photos: next.map((p) => ({ path: p.path })) })
        .eq("id", eid);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto(path: string) {
    const supabase = createClient();
    await supabase.storage.from("journal_photos").remove([path]);
    const next = photos.filter((p) => p.path !== path);
    setPhotos(next);
    if (entryId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("journal_entries")
        .update({ photos: next.map((p) => ({ path: p.path })) })
        .eq("id", entryId);
    }
  }

  async function save() {
    if (!content.trim() && photos.length === 0) {
      toast(t("journal.empty_save_error"), { tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const eid = await ensureEntry();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("journal_entries")
        .update({
          content: content.trim(),
          shared_with_partner: share,
          photos: photos.map((p) => ({ path: p.path })),
        })
        .eq("id", eid)
        .select("id, date, content, shared_with_partner, created_at, photos")
        .single();
      if (error) throw new Error(error.message);
      onSaved({
        id: data.id,
        date: data.date,
        content: data.content,
        shared_with_partner: data.shared_with_partner,
        created_at: data.created_at,
        photos: photos.map((p) => ({ path: p.path })),
        signedUrls: photos.map((p) => p.signedUrl),
      });
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function cancel() {
    if (entryId && (content.trim() || photos.length > 0)) {
      if (!confirm(t("journal.abandon_entry_confirm"))) return;
    }
    if (entryId) {
      const supabase = createClient();
      if (photos.length > 0) {
        await supabase.storage.from("journal_photos").remove(photos.map((p) => p.path));
      }
      await supabase.from("journal_entries").delete().eq("id", entryId);
    }
    onCancel();
  }

  return (
    <div className="surface p-4 flex flex-col gap-3">
      <Textarea
        rows={6}
        autoFocus
        placeholder={t("journal.compose_what")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.path} className="relative aspect-square rounded-md overflow-hidden bg-[var(--color-paper-dim)] group">
              {p.signedUrl && (
                <Image src={p.signedUrl} alt="" fill sizes="33vw" className="object-cover" />
              )}
              <button
                type="button"
                onClick={() => removePhoto(p.path)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-[var(--color-ink-mid)] underline underline-offset-2 hover:text-[var(--color-ink)] disabled:opacity-50"
        >
          {uploading ? t("journal.compose_uploading") : t("journal.compose_add_photo")}
        </button>
        <label className="flex items-center gap-2 text-xs text-[var(--color-ink-mid)]">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          {t("journal.compose_share_partner")}
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={cancel} fullWidth>
          {t("common.cancel")}
        </Button>
        <Button onClick={save} loading={saving} fullWidth>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

function EntryCard({
  userId,
  entry,
  onChanged,
  onDeleted,
}: {
  userId: string;
  entry: EntryRow;
  onChanged: (e: EntryRow) => void;
  onDeleted: () => void;
}) {
  const t = useTranslations();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(entry.content ?? "");
  const [share, setShare] = useState(!!entry.shared_with_partner);
  const [photos, setPhotos] = useState<PhotoEntry[]>(
    entry.photos.map((p, i) => ({ path: p.path, signedUrl: entry.signedUrls[i] ?? "" })),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadPhotos(files: FileList) {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded: PhotoEntry[] = [];
      for (const f of Array.from(files)) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const photoId = crypto.randomUUID();
        const path = `${userId}/${entry.id}/${photoId}.${ext}`;
        const { error: upErr } = await supabase.storage.from("journal_photos").upload(path, f);
        if (upErr) continue;
        const { data: signed } = await supabase.storage
          .from("journal_photos")
          .createSignedUrl(path, 60 * 60 * 6);
        uploaded.push({ path, signedUrl: signed?.signedUrl ?? "" });
      }
      setPhotos([...photos, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto(path: string) {
    const supabase = createClient();
    await supabase.storage.from("journal_photos").remove([path]);
    setPhotos(photos.filter((p) => p.path !== path));
  }

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("journal_entries")
        .update({
          content: content.trim(),
          shared_with_partner: share,
          photos: photos.map((p) => ({ path: p.path })),
        })
        .eq("id", entry.id);
      if (error) throw new Error(error.message);
      onChanged({
        ...entry,
        content: content.trim(),
        shared_with_partner: share,
        photos: photos.map((p) => ({ path: p.path })),
        signedUrls: photos.map((p) => p.signedUrl),
      });
      setEditing(false);
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const time = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  if (editing) {
    return (
      <div className="surface p-4 flex flex-col gap-3">
        <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.path} className="relative aspect-square rounded-md overflow-hidden bg-[var(--color-paper-dim)] group">
                {p.signedUrl && (
                  <Image src={p.signedUrl} alt="" fill sizes="33vw" className="object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p.path)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-[var(--color-ink-mid)] underline underline-offset-2 hover:text-[var(--color-ink)] disabled:opacity-50"
          >
            {uploading ? t("journal.compose_uploading") : t("journal.compose_add_photo")}
          </button>
          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-mid)]">
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
            {t("journal.compose_share_partner")}
          </label>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)} fullWidth>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} loading={saving} fullWidth>
            {t("common.save")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <article className="border-b border-[var(--color-paper-line)] pb-5 last:border-b-0">
      <header className="flex items-center justify-between text-xs text-[var(--color-ink-soft)] mb-3">
        <span>{time && time}</span>
        <div className="flex items-center gap-3">
          {entry.shared_with_partner && (
            <span className="text-[var(--color-accent-deep)]">{t("journal.shared")}</span>
          )}
          <button
            onClick={() => setEditing(true)}
            className="hover:text-[var(--color-ink)] underline underline-offset-2"
          >
            {t("common.edit")}
          </button>
          <button
            onClick={onDeleted}
            className="hover:text-[var(--color-danger)] underline underline-offset-2"
          >
            {t("common.delete")}
          </button>
        </div>
      </header>
      {entry.signedUrls.length > 0 && (
        <div
          className={`grid gap-2 mb-3 ${
            entry.signedUrls.length === 1
              ? "grid-cols-1"
              : entry.signedUrls.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
          }`}
        >
          {entry.signedUrls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md overflow-hidden bg-[var(--color-paper-dim)] hover:opacity-90 transition"
            >
              <Image src={url} alt="" fill sizes="(max-width: 768px) 33vw, 200px" className="object-cover" />
            </a>
          ))}
        </div>
      )}
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-[var(--color-ink)]">
        {entry.content || (
          <span className="text-[var(--color-ink-soft)]">{t("journal.only_photos")}</span>
        )}
      </p>
    </article>
  );
}
