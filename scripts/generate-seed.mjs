// scripts/seed-data/*.ts のデータから Supabase 用の seed SQL を生成する
// 使い方: node scripts/generate-seed.mjs > supabase/migrations/0002_seed_masters.sql
import { build } from 'esbuild';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'artmark-seed-'));
const entry = join(dir, 'entry.ts');
writeFileSync(
  entry,
  `export { mockMuseums } from '${process.cwd()}/scripts/seed-data/museums';\n` +
  `export { mockExhibitions } from '${process.cwd()}/scripts/seed-data/exhibitions';\n`
);

const out = join(dir, 'bundle.mjs');
await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile: out, platform: 'node', logLevel: 'silent' });
const { mockMuseums, mockExhibitions } = await import(out);

const q = (v) => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

// 住所の先頭から都道府県を取り出す
const PREF = /^(北海道|東京都|京都府|大阪府|.{2,3}県)/;
const prefOf = (address) => (address.match(PREF)?.[1] ?? '');

const lines = [];
lines.push('-- 自動生成: node scripts/generate-seed.mjs');
lines.push('-- 既存モックデータ（美術館・展覧会）を Supabase に投入します。');
lines.push('-- 何度実行しても結果が同じになるよう upsert にしています。');
lines.push('');
lines.push('insert into public.museums (id, name, name_kana, address, prefecture, area, image_url, description, opening_hours, closed_days, website) values');
lines.push(
  mockMuseums
    .map((m) =>
      `  (${[q(m.id), q(m.name), q(m.nameKana), q(m.address), q(prefOf(m.address)), q(m.area), q(m.imageUrl), q(m.description), q(m.openingHours), q(m.closedDays), q(m.website)].join(', ')})`
    )
    .join(',\n') + '\non conflict (id) do update set'
);
lines.push('  name = excluded.name, name_kana = excluded.name_kana, address = excluded.address,');
lines.push('  prefecture = excluded.prefecture, area = excluded.area, image_url = excluded.image_url,');
lines.push('  description = excluded.description, opening_hours = excluded.opening_hours,');
lines.push('  closed_days = excluded.closed_days, website = excluded.website;');
lines.push('');
lines.push('insert into public.exhibitions (id, museum_id, title, description, start_date, end_date, price, image_url) values');
lines.push(
  mockExhibitions
    .map((e) =>
      `  (${[q(e.id), q(e.museumId), q(e.title), q(e.description), q(e.startDate), q(e.endDate), q(e.price), q(e.imageUrl)].join(', ')})`
    )
    .join(',\n') + '\non conflict (id) do update set'
);
lines.push('  museum_id = excluded.museum_id, title = excluded.title, description = excluded.description,');
lines.push('  start_date = excluded.start_date, end_date = excluded.end_date, price = excluded.price,');
lines.push('  image_url = excluded.image_url;');
lines.push('');
const genreRows = mockExhibitions.flatMap((e) => (e.genre ?? []).map((g) => `  (${q(e.id)}, ${q(g)})`));
lines.push('insert into public.exhibition_genres (exhibition_id, genre) values');
lines.push(genreRows.join(',\n') + '\non conflict do nothing;');
lines.push('');

process.stdout.write(lines.join('\n') + '\n');
