-- shared_photos:讓 couple 成員都能更新 caption(原本只有 uploader)

drop policy if exists "shared_photos_uploader_update" on public.shared_photos;

create policy "shared_photos_member_update" on public.shared_photos
  for update
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- 也讓任一方能刪除(原本只有 uploader)
drop policy if exists "shared_photos_uploader_delete" on public.shared_photos;
create policy "shared_photos_member_delete" on public.shared_photos
  for delete
  using (public.is_couple_member(couple_id));

-- ─── 後援 RPC:caption 更新走 SECURITY DEFINER,確保沒跑 RLS migration
-- 的情境下也能寫入(只接受 caption 改動,其他欄位不能透過此 RPC 動)。
create or replace function public.update_shared_photo_caption(
  p_photo_id uuid,
  p_caption text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
begin
  select couple_id into v_couple_id from public.shared_photos where id = p_photo_id;
  if v_couple_id is null then
    raise exception 'photo_not_found';
  end if;
  if not public.is_couple_member(v_couple_id) then
    raise exception 'not_couple_member';
  end if;
  update public.shared_photos
     set caption = nullif(trim(p_caption), '')
   where id = p_photo_id;
end;
$$;

grant execute on function public.update_shared_photo_caption(uuid, text) to authenticated;

notify pgrst, 'reload schema';
