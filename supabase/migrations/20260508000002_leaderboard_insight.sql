-- howu Phase 3 — leaderboard + monthly insight RPCs

-- ─────────────────────── 排行榜 top N
-- 用 sha256(couple_id) 當匿名 ID,絕不洩漏 couple_id
create or replace function public.leaderboard_top(p_limit int default 50)
returns table(rank int, level int, total_score int, anonymous_id text)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      s.total_score,
      s.level,
      s.couple_id,
      row_number() over (order by s.total_score desc) as r
    from public.sync_scores s
    where coalesce(s.total_score, 0) > 0
  )
  select
    r::int as rank,
    coalesce(level, 1) as level,
    coalesce(total_score, 0) as total_score,
    substring(encode(sha256(couple_id::text::bytea), 'hex') from 1 for 8) as anonymous_id
  from ranked
  order by r
  limit p_limit;
$$;

-- ─────────────────────── 自己 couple 的 rank + percentile
create or replace function public.my_couple_rank(p_couple_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total int;
  v_rank int;
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  select count(*) into v_total from public.sync_scores;

  select r into v_rank
  from (
    select couple_id, row_number() over (order by total_score desc) as r
    from public.sync_scores
  ) sub
  where couple_id = p_couple_id;

  if v_rank is null then
    return jsonb_build_object('rank', null, 'percentile', null, 'total_couples', v_total);
  end if;

  return jsonb_build_object(
    'rank', v_rank,
    'percentile', case when v_total > 0
      then ((v_rank::numeric / v_total) * 100)::int
      else 100 end,
    'total_couples', v_total
  );
end;
$$;

grant execute on function public.leaderboard_top(int) to authenticated;
grant execute on function public.my_couple_rank(uuid) to authenticated;

-- ─────────────────────── 月度 insight
create or replace function public.monthly_insight(p_couple_id uuid, p_year int, p_month int)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_start date;
  v_end date;
  v_days_done int;
  v_sync_delta int;
  v_top_tags jsonb;
  v_best_day jsonb;
  v_avg_happy numeric;
begin
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  v_start := make_date(p_year, p_month, 1);
  v_end := (v_start + interval '1 month' - interval '1 day')::date;

  -- 雙方都完成的日期數
  select count(*) into v_days_done
  from (
    select date
    from public.daily_responses
    where couple_id = p_couple_id and date between v_start and v_end
    group by date
    having count(distinct responder_id) = 2
  ) sub;

  -- 默契值成長
  select coalesce(sum(delta), 0) into v_sync_delta
  from public.sync_score_events
  where couple_id = p_couple_id and date between v_start and v_end;

  -- 平均幸福
  select coalesce(avg(happiness), 0) into v_avg_happy
  from public.daily_responses
  where couple_id = p_couple_id and date between v_start and v_end;

  -- 最常出現的心情標籤(雙方合計 top 3)
  select coalesce(jsonb_agg(jsonb_build_object('tag', tag, 'count', cnt)), '[]'::jsonb)
    into v_top_tags
  from (
    select unnest(mood_tags) as tag, count(*) as cnt
    from public.daily_responses
    where couple_id = p_couple_id and date between v_start and v_end
    group by tag
    order by cnt desc
    limit 3
  ) t;

  -- 最佳一天(雙方 happiness + us_overall 加總最高)
  select to_jsonb(t) into v_best_day from (
    select date,
      sum(happiness + us_overall) as score
    from public.daily_responses
    where couple_id = p_couple_id and date between v_start and v_end
    group by date
    order by score desc
    limit 1
  ) t;

  return jsonb_build_object(
    'year', p_year,
    'month', p_month,
    'days_done', v_days_done,
    'sync_delta', v_sync_delta,
    'top_mood_tags', v_top_tags,
    'best_day', v_best_day,
    'avg_happiness', round(v_avg_happy, 1)
  );
end;
$$;

grant execute on function public.monthly_insight(uuid, int, int) to authenticated;
