-- howu Pivot — 加 letter 題型(寫小作文給對方)

alter table public.template_questions
  drop constraint if exists template_questions_type_check;

alter table public.template_questions
  add constraint template_questions_type_check
    check (type in ('slider', 'multi_choice', 'short_text', 'guess_partner', 'mood_tags', 'letter'));
