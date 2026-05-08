-- Template sharing: read shared template + clone into caller's couple
-- Both functions are SECURITY DEFINER so they can bypass RLS for the read,
-- and write into caller's couple for the clone.

-- ─── 1) 公開讀取一份模板(含題目、承諾) ───────────────
create or replace function public.get_shared_template(p_template_id uuid)
returns table (
  id uuid,
  name text,
  description text,
  emoji text,
  questions jsonb,
  promises jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    t.id,
    t.name,
    t.description,
    t.emoji,
    coalesce(
      (select jsonb_agg(
                jsonb_build_object(
                  'id', q.id,
                  'position', q.position,
                  'type', q.type,
                  'text', q.text,
                  'options', q.options
                )
                order by q.position
              )
         from template_questions q
        where q.template_id = t.id),
      '[]'::jsonb
    ) as questions,
    coalesce(
      (select jsonb_agg(
                jsonb_build_object(
                  'id', p.id,
                  'position', p.position,
                  'text', p.text
                )
                order by p.position
              )
         from template_promises p
        where p.template_id = t.id),
      '[]'::jsonb
    ) as promises
  from templates t
  where t.id = p_template_id
    and coalesce(t.is_archived, false) = false;
end;
$$;

grant execute on function public.get_shared_template(uuid) to anon, authenticated;

-- ─── 2) 把模板複製到呼叫者所在的 couple ─────────────────
create or replace function public.clone_shared_template(p_template_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_couple_id uuid;
  v_new_id    uuid;
  v_src       record;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select id
    into v_couple_id
    from couples
   where (partner_a_id = v_user_id or partner_b_id = v_user_id)
     and status = 'active'
   limit 1;

  if v_couple_id is null then
    raise exception 'no_couple';
  end if;

  select id, name, description, emoji
    into v_src
    from templates
   where id = p_template_id
     and coalesce(is_archived, false) = false;

  if v_src.id is null then
    raise exception 'template_not_found';
  end if;

  insert into templates (couple_id, name, description, emoji, created_by, is_archived)
  values (v_couple_id, v_src.name, v_src.description, v_src.emoji, v_user_id, false)
  returning id into v_new_id;

  insert into template_questions (template_id, position, type, text, options)
  select v_new_id, position, type, text, options
    from template_questions
   where template_id = p_template_id
   order by position;

  insert into template_promises (template_id, position, text)
  select v_new_id, position, text
    from template_promises
   where template_id = p_template_id
   order by position;

  return v_new_id;
end;
$$;

grant execute on function public.clone_shared_template(uuid) to authenticated;

notify pgrst, 'reload schema';
