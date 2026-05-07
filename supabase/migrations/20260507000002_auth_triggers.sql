-- howu Phase 1 — auth.users 註冊時自動建立 profiles row。
-- 也補上 updated_at 自動更新 trigger 給 journal_entries。

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, locale)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'locale', 'zh-TW')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at 自動更新
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journal_entries_touch on public.journal_entries;
create trigger journal_entries_touch
  before update on public.journal_entries
  for each row execute function public.touch_updated_at();
