-- howu 題庫種子(輪換題)
-- 完整目標:六大類 × ~17 題 ≈ 100 題官方核心(雙語)。
-- 本檔目前 30 題骨架,後續補滿。
-- 對應 lib/questions/rotating.ts 中的 SAMPLE_ROTATING(用相同 id)。

-- 預設「官方核心」題包(無 pack_id 也代表官方,但留一筆方便 UI 顯示)
insert into public.question_packs (id, name_zh, name_en, description_zh, type, price_twd, is_premium_included, published_at)
values
  ('00000000-0000-0000-0000-000000000001', 'howu 官方核心題庫', 'howu Core Questions',
   '預設出現在每日問卷中的核心 100 題', 'official', 0, false, now())
on conflict (id) do nothing;

-- ═════════════════════════════════════════════════ interaction (互動)
insert into public.questions (id, category, type, text_zh, text_en, options_zh, options_en, for_relationship_types, is_premium, pack_id, weight) values
('q_today_quality_time', 'interaction', 'slider',
  '今天我們的相處品質', 'Quality time we had today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_who_initiated_chat', 'interaction', 'multi_choice',
  '今天主要是誰開啟對話?', 'Who started the conversation today?',
  '["我","對方","差不多","今天沒聊"]'::jsonb,
  '["Me","Partner","About even","Didn''t talk"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_argument', 'interaction', 'multi_choice',
  '今天有沒有小爭執?', 'Any disagreement today?',
  '["沒有","小拌嘴","認真討論過","還沒和好"]'::jsonb,
  '["No","Small bicker","Real talk","Not yet resolved"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_laughter', 'interaction', 'slider',
  '今天我們笑了多少次', 'How much we laughed today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_compliment_count', 'interaction', 'multi_choice',
  '今天有沒有稱讚對方?', 'Did you compliment your partner?',
  '["有,不只一次","有一次","沒機會","沒想到"]'::jsonb,
  '["Yes, more than once","Once","No chance","Didn''t think of it"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

-- ═════════════════════════════════════════════════ observe (觀察對方)
('q_partner_mood_today', 'observe', 'guess_partner',
  '猜猜對方今天的心情分數', 'Guess your partner''s mood today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_partner_stress_signal', 'observe', 'multi_choice',
  '今天對方有出現什麼壓力訊號?', 'Any stress signals from your partner today?',
  '["皺眉","話變少","滑手機久","嘆氣","沒有"]'::jsonb,
  '["Frowning","Quieter","On phone a lot","Sighing","None"]'::jsonb,
  '{cohabit,same_city}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_partner_outfit_today', 'observe', 'multi_choice',
  '今天對方穿了什麼?', 'What did your partner wear today?',
  '["很有型","舒適日常","睡衣大師","沒注意到"]'::jsonb,
  '["Stylish","Casual comfy","Pajama master","Didn''t notice"]'::jsonb,
  '{cohabit,same_city}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_partner_health_today', 'observe', 'guess_partner',
  '猜猜對方今天的精神分數', 'Guess your partner''s energy today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_partner_eat_well', 'observe', 'multi_choice',
  '對方今天有好好吃飯嗎?', 'Did your partner eat well today?',
  '["三餐都有","少一餐","只有點心","不確定"]'::jsonb,
  '["All three meals","Skipped one","Only snacks","Not sure"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

-- ═════════════════════════════════════════════════ intimacy (親密)
('q_today_intimacy_level', 'intimacy', 'slider',
  '今天的親密程度', 'Intimacy today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_touch', 'intimacy', 'multi_choice',
  '今天有哪種接觸?', 'What kinds of touch today?',
  '["牽手","擁抱","親吻","靠著","沒有"]'::jsonb,
  '["Holding hands","Hug","Kiss","Leaning","None"]'::jsonb,
  '{cohabit,same_city}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_eye_contact', 'intimacy', 'slider',
  '今天眼神交流的多寡', 'Eye contact today',
  null, null,
  '{cohabit,same_city}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_thinking_of_partner', 'intimacy', 'guess_partner',
  '猜猜對方今天想你幾次', 'Guess how many times your partner thought of you',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_say_love', 'intimacy', 'multi_choice',
  '今天有說「我愛你」嗎?', 'Did you say "I love you" today?',
  '["有,主動說","有,回應對方","用其他話表達","今天沒說"]'::jsonb,
  '["Yes, first","Yes, replied","Said it differently","Not today"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

-- ═════════════════════════════════════════════════ gratitude (感謝)
('q_thanks_today', 'gratitude', 'short_text',
  '今天最想謝謝對方什麼?', 'What are you most thankful for today?',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_partner_did_well', 'gratitude', 'multi_choice',
  '今天對方做得最好的事?', 'What did your partner do best today?',
  '["主動關心我","做家事","聽我說話","逗我笑","支持我的決定"]'::jsonb,
  '["Reached out","Helped with chores","Listened","Made me laugh","Supported me"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_thanks_intensity', 'gratitude', 'slider',
  '今天對對方的感謝程度', 'How thankful for your partner today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_acknowledge_effort', 'gratitude', 'multi_choice',
  '注意到對方今天做了哪件辛苦的事?', 'Noticed something hard your partner did today?',
  '["工作上的努力","家事/育兒","情緒勞動","身體不適還在撐","沒注意到"]'::jsonb,
  '["At work","Chores/parenting","Emotional labor","Pushed through illness","Didn''t notice"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_one_thing_thanks', 'gratitude', 'short_text',
  '一句話的感謝', 'A one-line thank-you',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

-- ═════════════════════════════════════════════════ time (共度時光)
('q_time_satisfaction', 'time', 'slider',
  '今天共度時間滿意度', 'How satisfied with our time today?',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_call_frequency', 'time', 'multi_choice',
  '今天聯絡頻率', 'How often did we connect today?',
  '["很多訊息或通話","幾條訊息","一兩條","沒聯絡"]'::jsonb,
  '["A lot","A few","One or two","None"]'::jsonb,
  '{long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_meal_together', 'time', 'multi_choice',
  '今天有沒有一起吃飯?', 'Did we share a meal today?',
  '["三餐","兩餐","一餐","沒有"]'::jsonb,
  '["Three","Two","One","None"]'::jsonb,
  '{cohabit,same_city}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_today_planned_activity', 'time', 'multi_choice',
  '今天有預先安排的活動嗎?', 'Did we plan something today?',
  '["有,順利完成","有,延期了","沒安排但有同框","沒安排"]'::jsonb,
  '["Yes, done","Yes, postponed","Unplanned but together","Nothing"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_next_meet_distance', 'time', 'slider',
  '下次見面的期待程度', 'Excitement for our next meet',
  null, null,
  '{long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

-- ═════════════════════════════════════════════════ open (開放題)
('q_open_one_word', 'open', 'short_text',
  '用一個詞形容今天的我們', 'One word for us today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_open_funny_moment', 'open', 'short_text',
  '今天最好笑的瞬間', 'Funniest moment today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_open_today_color', 'open', 'multi_choice',
  '今天我們的顏色是?', 'Today''s color for us is?',
  '["粉紅","金黃","藍綠","灰","彩虹"]'::jsonb,
  '["Pink","Gold","Teal","Grey","Rainbow"]'::jsonb,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_open_song_today', 'open', 'short_text',
  '一首代表今天的歌', 'A song that represents today',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1),

('q_open_tomorrow_wish', 'open', 'short_text',
  '對明天的我們有什麼期待?', 'A wish for us tomorrow',
  null, null,
  '{cohabit,same_city,long_distance}', false,
  '00000000-0000-0000-0000-000000000001', 1)
on conflict (id) do nothing;

-- TODO Phase 1:把每個類別擴充到 ~17 題,total 100。
-- 加題時記得:
--   1. 同一 id 不要重複
--   2. for_relationship_types 預設三種都有,只在語境特殊時收窄
--   3. 多選題 options 數量 4-5 個
--   4. 短文字題每類別不超過 4 題(避免短文字佔比過高)
