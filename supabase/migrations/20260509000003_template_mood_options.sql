alter table public.templates
  add column if not exists mood_tag_options jsonb;

update public.templates
   set mood_tag_options = '["開心","六六大順","心煩","低氣壓","平常心"]'::jsonb
 where mood_tag_options is null;

alter table public.templates
  alter column mood_tag_options set default '["開心","六六大順","心煩","低氣壓","平常心"]'::jsonb;

notify pgrst, 'reload schema';
