-- Phase 2: 社会性（プロフィール・フォロー・いいね・コメント・タグ）
-- Supabase の SQL Editor に貼り付けて実行してください。何度実行しても安全です。

-- ============================================================
-- 1. ビューを呼び出し元の権限で動かす
--    （既定ではビューが RLS を迂回してしまうため）
-- ============================================================
alter view public.target_ratings set (security_invoker = on);

-- ============================================================
-- 2. プロフィールの集計ビュー
--    フォロワー数などは保存せず、常に実データから数える
-- ============================================================
drop view if exists public.profile_stats;
create view public.profile_stats with (security_invoker = on) as
select
  p.id,
  p.handle,
  (select count(*) from public.follows f where f.followee_id = p.id) as follower_count,
  (select count(*) from public.follows f where f.follower_id = p.id) as following_count,
  (select count(*) from public.reviews r where r.user_id = p.id)     as review_count
from public.profiles p;

-- ============================================================
-- 3. 検索・一覧のためのインデックス
-- ============================================================
create index if not exists follows_followee_idx on public.follows (followee_id);
create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists likes_review_idx     on public.likes (review_id);
create index if not exists review_tags_tag_idx  on public.review_tags (tag);
create index if not exists reviews_user_id_idx  on public.reviews (user_id);

-- 表示名・ハンドルの部分一致検索用（ILIKE を効かせる）
create extension if not exists pg_trgm;
create index if not exists profiles_handle_trgm_idx       on public.profiles using gin (handle gin_trgm_ops);
create index if not exists profiles_display_name_trgm_idx on public.profiles using gin (display_name gin_trgm_ops);

-- ============================================================
-- 4. 自己紹介と表示名の長さ制限
--    RLS はアクセス制御であり、値の妥当性は制約で守る
-- ============================================================
alter table public.profiles drop constraint if exists profiles_display_name_length;
alter table public.profiles add  constraint profiles_display_name_length check (char_length(display_name) <= 50);

alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles add  constraint profiles_bio_length check (char_length(bio) <= 500);

-- タグは記号なしの短い文字列に限定する
alter table public.review_tags drop constraint if exists review_tags_tag_format;
alter table public.review_tags add  constraint review_tags_tag_format
  check (char_length(tag) between 1 and 30 and tag !~ '[\s#]');
