-- howu Phase 2 — Supabase Storage buckets + RLS
-- avatars: 公開讀,owner 寫
-- shared_photos: couple 成員 私密讀寫

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('shared_photos', 'shared_photos', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- ─────────────────────── avatars
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─────────────────────── shared_photos (path = <couple_id>/<photo_id>.<ext>)
drop policy if exists "shared_photos_member_read" on storage.objects;
create policy "shared_photos_member_read" on storage.objects
  for select using (
    bucket_id = 'shared_photos'
    and exists (
      select 1 from public.couples c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.partner_a_id, c.partner_b_id)
    )
  );

drop policy if exists "shared_photos_member_write" on storage.objects;
create policy "shared_photos_member_write" on storage.objects
  for insert with check (
    bucket_id = 'shared_photos'
    and exists (
      select 1 from public.couples c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.partner_a_id, c.partner_b_id)
    )
  );

drop policy if exists "shared_photos_member_update" on storage.objects;
create policy "shared_photos_member_update" on storage.objects
  for update using (
    bucket_id = 'shared_photos'
    and exists (
      select 1 from public.couples c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.partner_a_id, c.partner_b_id)
    )
  );

drop policy if exists "shared_photos_uploader_delete" on storage.objects;
create policy "shared_photos_uploader_delete" on storage.objects
  for delete using (
    bucket_id = 'shared_photos'
    and auth.uid() = owner
  );
