-- howu — fix create_invitation
-- gen_random_bytes 是 pgcrypto 的 function,在 Supabase 不在預設 search_path,
-- 改用 Postgres 內建的 gen_random_uuid() 取得 entropy。

create or replace function public.create_invitation(
  p_message text default null,
  p_message_style text default 'simple'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
  v_id uuid;
  v_expires timestamptz := now() + interval '30 days';
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.invitations
    set status = 'expired'
    where inviter_id = v_uid
      and status = 'pending';

  v_token := substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10);

  insert into public.invitations (inviter_id, token, message, message_style, expires_at)
  values (v_uid, v_token, p_message, p_message_style, v_expires)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'token', v_token, 'expires_at', v_expires);
end;
$$;
