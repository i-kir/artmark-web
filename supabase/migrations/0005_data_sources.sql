-- Phase 4: データ調達（来歴の記録・ユーザー投稿・通報）
-- Supabase の SQL Editor に貼り付けて実行してください。何度実行しても安全です。

-- ============================================================
-- 1. 管理者フラグ
--    ポリシー内で profiles を直接参照すると再帰するため、
--    SECURITY DEFINER の関数を経由する
-- ============================================================
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- ============================================================
-- 2. データの来歴
--    「この情報はどこから来たのか」を必ず辿れるようにする。
--    出典を持たないデータは、誤りを見つけても直しようがない。
-- ============================================================
do $$ begin
  create type public.data_source as enum ('seed', 'wikidata', 'crawl', 'user');
exception when duplicate_object then null; end $$;

alter table public.museums add column if not exists source       public.data_source not null default 'seed';
alter table public.museums add column if not exists wikidata_id  text;
alter table public.museums add column if not exists source_url   text;
alter table public.museums add column if not exists updated_at   timestamptz not null default now();

create unique index if not exists museums_wikidata_id_key on public.museums (wikidata_id) where wikidata_id is not null;

alter table public.exhibitions add column if not exists source      public.data_source not null default 'seed';
alter table public.exhibitions add column if not exists source_url  text;
alter table public.exhibitions add column if not exists fetched_at  timestamptz;
alter table public.exhibitions add column if not exists created_by  uuid references public.profiles(id) on delete set null;
alter table public.exhibitions add column if not exists updated_at  timestamptz not null default now();

-- 同じ館・同じ会期開始日・同じタイトルは同一の展覧会とみなす。
-- 巡回取得を繰り返しても増殖しないようにするための鍵。
create unique index if not exists exhibitions_dedupe_key
  on public.exhibitions (museum_id, start_date, title);

drop trigger if exists museums_touch_updated_at on public.museums;
create trigger museums_touch_updated_at
  before update on public.museums
  for each row execute function public.touch_updated_at();

drop trigger if exists exhibitions_touch_updated_at on public.exhibitions;
create trigger exhibitions_touch_updated_at
  before update on public.exhibitions
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 3. ユーザーによる展覧会の登録・修正
--    投稿は即公開。品質は通報と修正で担保する
--    （承認待ちの行列は、さばく人がいないと投稿ごと死ぬ）
-- ============================================================
drop policy if exists "insert exhibition as user" on public.exhibitions;
create policy "insert exhibition as user" on public.exhibitions for insert
  with check (auth.uid() is not null and created_by = auth.uid() and source = 'user');

drop policy if exists "update own or admin exhibition" on public.exhibitions;
create policy "update own or admin exhibition" on public.exhibitions for update
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "delete own or admin exhibition" on public.exhibitions;
create policy "delete own or admin exhibition" on public.exhibitions for delete
  using (public.is_admin() or created_by = auth.uid());

-- 巡回取得と Wikidata 取り込みは service_role キーで実行するため、
-- RLS の対象外（サーバー側スクリプトからのみ使う）

-- ============================================================
-- 4. 通報
--    ユーザー投稿を受け入れる以上、対処の手段は同時に用意する
-- ============================================================
do $$ begin
  create type public.report_target as enum ('review', 'comment', 'exhibition');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_reason as enum ('spam', 'abuse', 'wrong_info', 'copyright', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'closed');
exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  target_type  public.report_target not null,
  target_id    text not null,
  reason       public.report_reason not null,
  detail       text not null default '' check (char_length(detail) <= 1000),
  status       public.report_status not null default 'open',
  created_at   timestamptz not null default now(),
  -- 同じ人が同じ対象を何度も通報しても1件にまとめる
  unique (reporter_id, target_type, target_id)
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "insert own report" on public.reports;
create policy "insert own report" on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "read own or admin reports" on public.reports;
create policy "read own or admin reports" on public.reports for select
  using (public.is_admin() or auth.uid() = reporter_id);

drop policy if exists "admin updates reports" on public.reports;
create policy "admin updates reports" on public.reports for update
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 5. 自分を管理者にする（1回だけ手で実行してください）
--    下の行のメールアドレスを自分のものに変えて実行します。
-- ============================================================
-- update public.profiles set is_admin = true
-- where id = (select id from auth.users where email = 'あなたのメールアドレス');
