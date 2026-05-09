create or replace function public.create_starter_templates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_t1 uuid;
begin
  insert into public.templates (couple_id, name, emoji, description, created_by)
  values (
    new.id,
    '每日心情(5 分鐘版)',
    '☀️',
    '快速版,寫起來不負擔',
    new.partner_a_id
  )
  returning id into v_t1;

  insert into public.template_questions (template_id, position, type, text, options) values
    (v_t1, 0, 'slider',     '今日幸福程度',           null),
    (v_t1, 1, 'slider',     '今天累的程度',           null),
    (v_t1, 2, 'mood_tags',  '今天的心情',             null),
    (v_t1, 3, 'short_text', '今天最想對對方說的一句話', null),
    (v_t1, 4, 'short_text', '今天最印象深刻的瞬間',     null);

  insert into public.template_promises (template_id, position, text) values
    (v_t1, 0, '請對方一杯飲料'),
    (v_t1, 1, '幫對方按摩 10 分鐘');

  return new;
end;
$$;

notify pgrst, 'reload schema';
