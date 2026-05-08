-- 讓 couple member 可以更新 background_photo_path(其他欄位仍維持只能透過特定 RPC)

create or replace function public.set_couple_background(p_couple_id uuid, p_path text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;
  update public.couples
    set background_photo_path = p_path
    where id = p_couple_id;
  return jsonb_build_object('ok', true, 'path', p_path);
end;
$$;

grant execute on function public.set_couple_background(uuid, text) to authenticated;
