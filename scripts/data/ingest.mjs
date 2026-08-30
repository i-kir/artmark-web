#!/usr/bin/env node
// 巡回取得した展覧会を Supabase に投入する。
//
//   node scripts/data/ingest.mjs --dry-run    何が起きるか表示するだけ
//   node scripts/data/ingest.mjs              実際に投入
//
// service_role キーを使うため RLS を迂回します。サーバー側でのみ実行し、
// キーは .env.scripts に置いてください（.gitignore 済み）。
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

async function loadEnv() {
  try {
    const text = await readFile(new URL('../../.env.scripts', import.meta.url), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    // 環境変数で直接渡す運用でも動くようにする
  }
}

async function main() {
  await loadEnv();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。');
    console.error('.env.scripts.example をコピーして .env.scripts を作ってください。');
    process.exit(1);
  }

  let rows;
  try {
    rows = JSON.parse(await readFile(new URL('./data/exhibitions.json', import.meta.url), 'utf8'));
  } catch {
    console.error('scripts/data/data/exhibitions.json がありません。先に crawl.mjs を実行してください。');
    process.exit(1);
  }

  console.log(`投入対象: ${rows.length}件`);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 存在しない美術館に紐づく展覧会は入れない（外部キー違反で全体が止まるため）
  const { data: museums, error: museumError } = await supabase.from('museums').select('id');
  if (museumError) throw museumError;
  const knownMuseums = new Set(museums.map((m) => m.id));

  const valid = [];
  const skipped = [];
  for (const row of rows) {
    if (!knownMuseums.has(row.museumId)) {
      skipped.push(`${row.title}（未登録の美術館 ${row.museumId}）`);
      continue;
    }
    if (!row.title || !row.startDate || !row.endDate) {
      skipped.push(`${row.title ?? '(タイトルなし)'}（会期が不完全）`);
      continue;
    }
    if (row.endDate < row.startDate) {
      skipped.push(`${row.title}（終了日が開始日より前）`);
      continue;
    }
    valid.push(row);
  }

  if (skipped.length > 0) {
    console.log(`\nスキップ ${skipped.length}件:`);
    for (const s of skipped) console.log(`  ・${s}`);
  }

  if (valid.length === 0) {
    console.log('\n投入できるデータがありません。');
    return;
  }

  const payload = valid.map((row) => ({
    // 同一館・同一開始日・同一タイトルを1件に保つ ID
    id: `cr_${row.sourceId}_${row.startDate}_${hash(row.title)}`,
    museum_id: row.museumId,
    title: row.title,
    description: row.description ?? '',
    start_date: row.startDate,
    end_date: row.endDate,
    price: row.price ?? '',
    image_url: row.imageUrl ?? null,
    official_url: row.officialUrl ?? null,
    source: 'crawl',
    source_url: row.sourceUrl ?? null,
    fetched_at: row.fetchedAt ?? new Date().toISOString(),
  }));

  console.log(`\n投入します: ${payload.length}件`);
  for (const p of payload) console.log(`  ・${p.title}（${p.start_date} 〜 ${p.end_date}）`);

  if (dryRun) {
    console.log('\n--dry-run のため実行しませんでした。');
    return;
  }

  const { error } = await supabase
    .from('exhibitions')
    .upsert(payload, { onConflict: 'museum_id,start_date,title' });
  if (error) throw error;

  console.log('\n完了しました。');
}

// タイトルから短い安定した識別子を作る（ID の一部に使うだけで、暗号用途ではない）
function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
