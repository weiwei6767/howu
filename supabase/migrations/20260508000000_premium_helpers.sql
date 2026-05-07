-- howu Phase 3 — Premium 訂閱 helpers
-- 規則(CLAUDE.md §7.1):任一方訂閱,雙方共享 Premium。

-- ─── is_premium_user
create or replace function public.is_premium_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select true
      from public.profiles p
      where p.id = p_user_id
        and p.is_premium = true
        and (p.premium_expires_at is null or p.premium_expires_at > now() - interval '7 days')
      limit 1
    ),
    false
  );
$$;

-- ─── is_premium_couple — 任一方 premium 即視為 couple premium
create or replace function public.is_premium_couple(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.is_premium_user(c.partner_a_id)
        or public.is_premium_user(c.partner_b_id)
      from public.couples c
      where c.id = p_couple_id
      limit 1
    ),
    false
  );
$$;

grant execute on function public.is_premium_user(uuid) to authenticated;
grant execute on function public.is_premium_couple(uuid) to authenticated;

-- ─── Subscription webhook 用的 trigger:subscriptions 寫入時順便同步 profile.is_premium
create or replace function public.sync_profile_premium()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    update public.profiles
      set is_premium = true,
          premium_expires_at = new.current_period_end
      where id = new.user_id;
  elsif new.status in ('cancelled', 'expired', 'past_due') then
    -- 7 天 grace period
    update public.profiles
      set is_premium = (new.current_period_end is not null and new.current_period_end > now() - interval '7 days'),
          premium_expires_at = new.current_period_end
      where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists subscriptions_sync_profile on public.subscriptions;
create trigger subscriptions_sync_profile
  after insert or update on public.subscriptions
  for each row execute function public.sync_profile_premium();
