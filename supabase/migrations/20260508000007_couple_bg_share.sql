-- howu — D-Day 背景照片
alter table public.couples
  add column if not exists background_photo_path text;

-- 公開分享需要的 RPC:用 couple_id 拿 D-Day 必要資訊(不依 RLS)
create or replace function public.get_share_dday(p_couple_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  select jsonb_build_object(
    'couple_id', c.id,
    'together_since', c.together_since,
    'background_photo_path', c.background_photo_path,
    'partner_a_name', pa.display_name,
    'partner_b_name', pb.display_name
  )
  into v
  from public.couples c
  left join public.profiles pa on pa.id = c.partner_a_id
  left join public.profiles pb on pb.id = c.partner_b_id
  where c.id = p_couple_id
    and c.status = 'active';
  return coalesce(v, '{}'::jsonb);
end;
$$;

grant execute on function public.get_share_dday(uuid) to anon, authenticated;
