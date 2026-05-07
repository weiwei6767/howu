-- howu — 日記支援多張照片

alter table public.journal_entries
  add column if not exists photos jsonb default '[]'::jsonb;

-- ─────────────────────── journal_photos bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('journal_photos', 'journal_photos', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- 路徑慣例:journal_photos/<user_id>/<entry_id>/<photo_id>.<ext>
-- owner 完整讀寫
drop policy if exists "journal_photos_owner_read" on storage.objects;
create policy "journal_photos_owner_read" on storage.objects
  for select using (
    bucket_id = 'journal_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "journal_photos_owner_write" on storage.objects;
create policy "journal_photos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'journal_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "journal_photos_owner_update" on storage.objects;
create policy "journal_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'journal_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "journal_photos_owner_delete" on storage.objects;
create policy "journal_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'journal_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- partner 透過已分享日記讀:走 server-side signed URL,不開 storage 直接 RLS
