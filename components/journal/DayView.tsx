"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
  const router = useRouter();
  const [entries, setEntries] = useState<EntryRow[]>(initialEntries);
  const [composing, setComposing] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function deleteEntry(id: string) {
    if (!confirm("刪掉這篇?")) return;
    const supabase = createClient();
    // 先撈 photos paths
    const target = entries.find((e) => e.id === id);
    if (target && target.photos.length > 0) {
      await supabase.storage.from("journal_photos").remove(target.photos.map((p) => p.path));
    }
    await supabase.from("journal_entries").delete().eq("id", id);
    setEntries(entries.filter((e) => e.id !== id));
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 寫新一篇 */}
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
        <Button onClick={() => setComposing(true)} fullWidth size="lg">
          + 在這天寫一篇
        </Button>
      )}

      {/* entries 列表 */}
      {entries.length === 0 && !composing && (
        <Card className="text-center text-sm text-zinc-400 py-8">
          這天還沒寫
        </Card>
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

// ─────────────────────── 寫新一篇
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
      toast("空的內容存什麼", { tone: "error" });
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
      if (!confirm("放棄這篇?照片也會刪掉。")) return;
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
    <Card className="flex flex-col gap-3 border-2 border-[var(--color-rose)]">
      <h3 className="text-sm font-semibold">✏️ 寫一篇新的</h3>
      <Textarea
        rows={6}
        autoFocus
        placeholder="今天想記下什麼?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.path} className="relative aspect-square rounded-md overflow-hidden bg-zinc-100 group">
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
          className="text-sm text-[var(--color-rose)] hover:underline disabled:opacity-50"
        >
          {uploading ? "上傳中..." : "📷 加照片"}
        </button>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          分享給對方
        </label>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={cancel} fullWidth>
          取消
        </Button>
        <Button onClick={save} loading={saving} fullWidth>
          儲存
        </Button>
      </div>
    </Card>
  );
}

// ─────────────────────── 已存 entry 卡片
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
    ? new Date(entry.created_at).toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  if (editing) {
    return (
      <Card className="flex flex-col gap-3 border border-[var(--color-rose)]">
        <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.path} className="relative aspect-square rounded-md overflow-hidden bg-zinc-100 group">
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
            className="text-sm text-[var(--color-rose)] hover:underline disabled:opacity-50"
          >
            {uploading ? "上傳中..." : "📷 加照片"}
          </button>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
            分享給對方
          </label>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)} fullWidth>
            取消
          </Button>
          <Button onClick={save} loading={saving} fullWidth>
            儲存
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <header className="flex items-center justify-between text-xs text-zinc-400">
        <span>{time && `寫於 ${time}`}</span>
        <div className="flex items-center gap-2">
          {entry.shared_with_partner && <Badge tone="rose">已分享</Badge>}
          <button
            onClick={() => setEditing(true)}
            className="text-[var(--color-rose)] hover:underline"
          >
            編輯
          </button>
          <button onClick={onDeleted} className="hover:text-red-500">
            刪除
          </button>
        </div>
      </header>
      {entry.signedUrls.length > 0 && (
        <div
          className={`grid gap-2 ${
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
              className="relative aspect-square rounded-md overflow-hidden bg-zinc-100 hover:opacity-90 transition"
            >
              <Image src={url} alt="" fill sizes="(max-width: 768px) 33vw, 200px" className="object-cover" />
            </a>
          ))}
        </div>
      )}
      <p className="text-base leading-relaxed whitespace-pre-wrap">
        {entry.content || <span className="text-zinc-400">這篇只有照片</span>}
      </p>
    </Card>
  );
}
