-- howu Phase 1 — 邀請、配對、暫停、解綁、重連 的 RPC
-- 全部回傳 jsonb 以便 Supabase JS rpc() 統一處理。

-- ─────────────────────────── create_invitation
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

  -- 把同一個 inviter 之前所有 pending 邀請設為 expired,只留最新
  update public.invitations
    set status = 'expired'
    where inviter_id = v_uid
      and status = 'pending';

  -- 10 hex 字元 token (~40 bits)
  v_token := substring(encode(gen_random_bytes(8), 'hex') from 1 for 10);

  insert into public.invitations (inviter_id, token, message, message_style, expires_at)
  values (v_uid, v_token, p_message, p_message_style, v_expires)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'token', v_token, 'expires_at', v_expires);
end;
$$;

-- ─────────────────────────── accept_invitation
create or replace function public.accept_invitation(
  p_token text,
  p_together_since date,
  p_relationship_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inviter_id uuid;
  v_inv_id uuid;
  v_couple_id uuid;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_relationship_type not in ('cohabit', 'same_city', 'long_distance') then
    raise exception 'invalid relationship_type';
  end if;
  if p_together_since > current_date then
    raise exception 'together_since cannot be in the future';
  end if;

  select id, inviter_id into v_inv_id, v_inviter_id
    from public.invitations
    where token = p_token
      and status = 'pending'
      and expires_at > now()
    for update;
  if v_inv_id is null then
    raise exception 'invitation_not_found_or_expired';
  end if;
  if v_inviter_id = v_uid then
    raise exception 'cannot_accept_own_invitation';
  end if;

  -- 雙方都不在 active/paused/recovery couple
  select id into v_existing
    from public.couples
    where status in ('active', 'paused', 'recovery')
      and (partner_a_id in (v_uid, v_inviter_id) or partner_b_id in (v_uid, v_inviter_id))
    limit 1;
  if v_existing is not null then
    raise exception 'already_in_couple';
  end if;

  insert into public.couples (partner_a_id, partner_b_id, together_since, relationship_type, status)
  values (v_inviter_id, v_uid, p_together_since, p_relationship_type, 'active')
  returning id into v_couple_id;

  insert into public.sync_scores (couple_id, total_score, level)
  values (v_couple_id, 0, 1)
  on conflict (couple_id) do nothing;

  update public.invitations
    set status = 'accepted', accepted_by_id = v_uid
    where id = v_inv_id;

  return jsonb_build_object('couple_id', v_couple_id);
end;
$$;

-- ─────────────────────────── pause / resume
create or replace function public.pause_couple()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  update public.couples set status = 'paused', paused_at = now()
    where status = 'active'
      and v_uid in (partner_a_id, partner_b_id)
    returning id into v_id;
  if v_id is null then raise exception 'no_active_couple'; end if;
  return jsonb_build_object('couple_id', v_id, 'status', 'paused');
end;
$$;

create or replace function public.resume_couple()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  update public.couples set status = 'active', paused_at = null
    where status = 'paused'
      and v_uid in (partner_a_id, partner_b_id)
    returning id into v_id;
  if v_id is null then raise exception 'no_paused_couple'; end if;
  return jsonb_build_object('couple_id', v_id, 'status', 'active');
end;
$$;

-- ─────────────────────────── disconnect (進入 30 天恢復期)
create or replace function public.start_disconnect()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  update public.couples
    set status = 'recovery',
        disconnected_at = now(),
        recovery_until = now() + interval '30 days'
    where status in ('active', 'paused')
      and v_uid in (partner_a_id, partner_b_id)
    returning id into v_id;
  if v_id is null then raise exception 'no_couple_to_disconnect'; end if;
  return jsonb_build_object('couple_id', v_id, 'status', 'recovery');
end;
$$;

-- ─────────────────────────── reconnect (從 recovery 回到 active)
create or replace function public.reconnect_couple()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  update public.couples
    set status = 'active',
        disconnected_at = null,
        recovery_until = null,
        paused_at = null
    where status = 'recovery'
      and v_uid in (partner_a_id, partner_b_id)
      and recovery_until > now()
    returning id into v_id;
  if v_id is null then raise exception 'recovery_expired_or_not_found'; end if;
  return jsonb_build_object('couple_id', v_id, 'status', 'active');
end;
$$;

-- ─────────────────────────── streak 計算
create or replace function public.calculate_streak(p_couple_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_dates date[];
  v_current int := 0;
  v_longest int := 0;
  v_run int := 0;
  v_prev date := null;
  d date;
  v_last date;
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  select array_agg(date order by date) into v_dates
  from (
    select date
      from public.daily_responses
      where couple_id = p_couple_id
      group by date
      having count(distinct responder_id) = 2
  ) sub;

  if v_dates is null or array_length(v_dates, 1) = 0 then
    return jsonb_build_object('current_streak', 0, 'longest_streak', 0);
  end if;

  foreach d in array v_dates loop
    if v_prev is null or d - v_prev = 1 then
      v_run := v_run + 1;
    else
      v_run := 1;
    end if;
    v_longest := greatest(v_longest, v_run);
    v_prev := d;
  end loop;

  v_last := v_dates[array_length(v_dates, 1)];
  if v_last >= (current_date - interval '1 day')::date then
    v_current := v_run;
  end if;

  return jsonb_build_object('current_streak', v_current, 'longest_streak', v_longest);
end;
$$;

grant execute on function public.create_invitation(text, text) to authenticated;
grant execute on function public.accept_invitation(text, date, text) to authenticated;
grant execute on function public.pause_couple() to authenticated;
grant execute on function public.resume_couple() to authenticated;
grant execute on function public.start_disconnect() to authenticated;
grant execute on function public.reconnect_couple() to authenticated;
grant execute on function public.calculate_streak(uuid) to authenticated;
