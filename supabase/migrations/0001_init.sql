-- ArtMark 初期スキーマ
-- Supabase の SQL Editor にこのファイルの内容を貼り付けて実行してください。

-- ============================================================
-- 1. プロフィール（auth.users と 1:1）
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text unique not null check (handle ~ '^[a-zA-Z0-9_]{3,20}$'),
  display_name text not null default '',
  avatar_url  text,
  bio         text not null default '',
  created_at  timestamptz not null default now()
);

-- 新規ユーザー登録時にプロフィールを自動生成する
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. 美術館・展覧会マスタ
-- ============================================================
create table if not exists public.museums (
  id            text primary key,
  name          text not null,
  name_kana     text not null default '',
  address       text not null default '',
  prefecture    text not null default '',
  area          text not null default '',
  lat           double precision,
  lng           double precision,
  image_url     text,
  description   text not null default '',
  opening_hours text not null default '',
  closed_days   text not null default '',
  website       text,
  created_at    timestamptz not null default now()
);

create table if not exists public.exhibitions (
  id           text primary key,
  museum_id    text not null references public.museums(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  start_date   date not null,
  end_date     date not null,
  price        text not null default '',
  image_url    text,
  official_url text,
  created_at   timestamptz not null default now(),
  constraint exhibitions_period_valid check (end_date >= start_date)
);

create index if not exists exhibitions_museum_id_idx on public.exhibitions (museum_id);
create index if not exists exhibitions_end_date_idx  on public.exhibitions (end_date);

-- ジャンルは複数持つので別テーブル
create table if not exists public.exhibition_genres (
  exhibition_id text not null references public.exhibitions(id) on delete cascade,
  genre         text not null,
  primary key (exhibition_id, genre)
);

create index if not exists exhibition_genres_genre_idx on public.exhibition_genres (genre);

-- ============================================================
-- 3. レビュー
-- ============================================================
create type public.target_type as enum ('museum', 'exhibition');

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type public.target_type not null,
  target_id   text not null,
  -- 0.5 刻みの 0.5〜5.0。未評価（記録のみ）は null
  rating      numeric(2,1) check (rating is null or (rating >= 0.5 and rating <= 5.0 and (rating * 2) = floor(rating * 2))),
  comment     text not null default '',
  visit_date  date,
  has_spoiler boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 同じ対象に同じユーザーが複数レビューを書けないようにする
  unique (user_id, target_type, target_id)
);

create index if not exists reviews_target_idx     on public.reviews (target_type, target_id);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);

create table if not exists public.review_tags (
  review_id uuid not null references public.reviews(id) on delete cascade,
  tag       text not null,
  primary key (review_id, tag)
);

-- ============================================================
-- 4. クリップ（行きたい / 行った）
-- ============================================================
create type public.clip_status as enum ('want', 'visited');

create table if not exists public.clips (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_type public.target_type not null,
  target_id   text not null,
  status      public.clip_status not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create index if not exists clips_target_idx on public.clips (target_type, target_id);

-- ============================================================
-- 5. 社会性（Phase 2 で使用。テーブルだけ先に用意）
-- ============================================================
create table if not exists public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  review_id  uuid not null references public.reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.reviews(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists comments_review_id_idx on public.comments (review_id);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self check (follower_id <> followee_id)
);

-- ============================================================
-- 6. 集計ビュー（平均スコアは保持せず、常にレビューから算出する）
-- ============================================================
create or replace view public.target_ratings as
select
  target_type,
  target_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(*) filter (where rating is not null) as rating_count,
  count(*) as review_count
from public.reviews
group by target_type, target_id;

-- ============================================================
-- 7. Row Level Security
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.museums           enable row level security;
alter table public.exhibitions       enable row level security;
alter table public.exhibition_genres enable row level security;
alter table public.reviews           enable row level security;
alter table public.review_tags       enable row level security;
alter table public.clips             enable row level security;
alter table public.likes             enable row level security;
alter table public.comments          enable row level security;
alter table public.follows           enable row level security;

-- マスタ系: 誰でも読める。書き込みは管理者（service_role）のみ
create policy "museums are public"           on public.museums           for select using (true);
create policy "exhibitions are public"       on public.exhibitions       for select using (true);
create policy "exhibition_genres are public" on public.exhibition_genres for select using (true);

-- プロフィール: 誰でも読める。自分のものだけ更新できる
create policy "profiles are public"      on public.profiles for select using (true);
create policy "update own profile"       on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- レビュー: 誰でも読める。自分のものだけ作成・更新・削除できる
create policy "reviews are public"  on public.reviews for select using (true);
create policy "insert own review"   on public.reviews for insert with check (auth.uid() = user_id);
create policy "update own review"   on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own review"   on public.reviews for delete using (auth.uid() = user_id);

create policy "review_tags are public" on public.review_tags for select using (true);
create policy "manage own review_tags" on public.review_tags for all
  using (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()));

-- クリップ: 本人のみ読み書きできる（他人の「行きたい」は見せない）
create policy "read own clips"   on public.clips for select using (auth.uid() = user_id);
create policy "manage own clips" on public.clips for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- いいね: 誰でも読める。自分の分だけ付け外しできる
create policy "likes are public"  on public.likes for select using (true);
create policy "manage own likes"  on public.likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- コメント: 誰でも読める。自分のものだけ作成・削除できる
create policy "comments are public" on public.comments for select using (true);
create policy "insert own comment"  on public.comments for insert with check (auth.uid() = user_id);
create policy "delete own comment"  on public.comments for delete using (auth.uid() = user_id);

-- フォロー: 誰でも読める。自分のフォローだけ操作できる
create policy "follows are public"  on public.follows for select using (true);
create policy "manage own follows"  on public.follows for all
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- ============================================================
-- 8. updated_at の自動更新
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_touch_updated_at on public.reviews;
create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();
