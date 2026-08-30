-- Phase 3: 位置情報
-- 座標は国土地理院の地名検索を基準に、マピオン・DBpedia で照合したもの。
-- 地中美術館のみ出典間に約200mの差があり、国土地理院・マピオン側を採用している。

update public.museums set lat = 35.69060, lng = 139.75478 where id = 'm1';  -- 東京国立近代美術館
update public.museums set lat = 35.66033, lng = 139.72924 where id = 'm2';  -- 森美術館（六本木ヒルズ森タワー地上位置）
update public.museums set lat = 36.56090, lng = 136.65822 where id = 'm3';  -- 金沢21世紀美術館
update public.museums set lat = 35.66519, lng = 139.72636 where id = 'm4';  -- 国立新美術館
update public.museums set lat = 34.59614, lng = 133.77071 where id = 'm5';  -- 大原美術館
update public.museums set lat = 35.66221, lng = 139.71713 where id = 'm6';  -- 根津美術館
update public.museums set lat = 35.08001, lng = 137.15180 where id = 'm7';  -- 豊田市美術館
update public.museums set lat = 34.44758, lng = 133.98469 where id = 'm8';  -- 直島・地中美術館
update public.museums set lat = 35.01287, lng = 135.78361 where id = 'm9';  -- 京都市京セラ美術館
update public.museums set lat = 35.45708, lng = 139.63059 where id = 'm10'; -- 横浜美術館

-- 座標の妥当性をデータ側でも守る
alter table public.museums drop constraint if exists museums_lat_range;
alter table public.museums add  constraint museums_lat_range check (lat is null or (lat between -90 and 90));

alter table public.museums drop constraint if exists museums_lng_range;
alter table public.museums add  constraint museums_lng_range check (lng is null or (lng between -180 and 180));

-- 地図の表示範囲で絞り込むとき用
create index if not exists museums_latlng_idx on public.museums (lat, lng);
