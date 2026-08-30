#!/usr/bin/env node
// 展覧会情報の巡回取得。
//
//   node scripts/data/crawl.mjs --check           robots.txt と規約の確認だけ
//   node scripts/data/crawl.mjs --dry-run         取得して結果を表示（保存しない）
//   node scripts/data/crawl.mjs                   取得して data/exhibitions.json に保存
//   node scripts/data/crawl.mjs --only momat      特定の取得先だけ
//
// 取得するのは事実情報（名称・会期・料金・公式URL）だけです。
// 紹介文や画像を複製せず、詳細は公式サイトへリンクします。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { checkRobots } from './lib/robots.mjs';
import { politeFetch } from './lib/http.mjs';
import { extractEvents, toExhibition } from './lib/jsonld.mjs';

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const SOURCES_PATH = new URL('./sources.json', import.meta.url);
const OUTPUT_PATH = new URL('./data/exhibitions.json', import.meta.url);

const log = (...a) => console.log(...a);

async function main() {
  const config = JSON.parse(await readFile(SOURCES_PATH, 'utf8'));
  const only = valueOf('--only');
  const checkOnly = has('--check');

  const sources = config.sources.filter((s) => (only ? s.id === only : true));
  if (sources.length === 0) {
    console.error('対象の取得先が見つかりません。');
    process.exit(1);
  }

  const results = [];
  let blocked = 0;

  for (const source of sources) {
    log(`\n── ${source.museumName} (${source.id})`);
    log(`   ${source.listUrl}`);

    if (!source.termsCheckedAt) {
      log('   ⚠ 利用規約が未確認です。termsUrl を読み、自動取得の可否を確認して');
      log('     sources.json の termsCheckedAt と termsNote に記録してください。');
      if (!checkOnly) {
        blocked++;
        continue;
      }
    }

    let robots;
    try {
      robots = await checkRobots(source.listUrl);
    } catch (error) {
      log(`   ✗ robots.txt の確認に失敗: ${error.message}`);
      blocked++;
      continue;
    }

    log(`   robots.txt: ${robots.allowed ? '✓ 許可' : '✗ 拒否'}（${robots.reason}）`);
    if (robots.crawlDelay) log(`   Crawl-delay: ${robots.crawlDelay}秒`);

    if (!robots.allowed) {
      log('   → robots.txt が拒否しているため取得しません。');
      blocked++;
      continue;
    }
    if (!source.enabled) {
      log('   → enabled が false のため取得しません。');
      continue;
    }
    if (checkOnly) continue;

    let res;
    try {
      res = await politeFetch(source.listUrl);
    } catch (error) {
      log(`   ✗ 取得に失敗: ${error.message}`);
      continue;
    }

    if (res.notModified) {
      log('   前回から変更なし（304）。スキップします。');
      continue;
    }
    if (res.status !== 200) {
      log(`   ✗ HTTP ${res.status}`);
      continue;
    }

    const events = extractEvents(res.body);
    log(`   JSON-LD の Event: ${events.length}件`);

    if (events.length === 0) {
      log('   → 構造化データが見つかりません。このサイトは個別の抽出処理が必要です。');
      log('     docs/DATA.md の「取得先を追加する」を参照してください。');
      continue;
    }

    const fetchedAt = new Date().toISOString();
    for (const event of events) {
      const exhibition = toExhibition(event, { museumId: source.museumId, sourceUrl: source.listUrl });
      if (!exhibition) continue;
      results.push({ ...exhibition, source: 'crawl', sourceId: source.id, fetchedAt });
      log(`   ・${exhibition.title}（${exhibition.startDate} 〜 ${exhibition.endDate}）`);
    }
  }

  log('');
  if (checkOnly) {
    log('確認のみ実行しました。取得はしていません。');
    return;
  }
  if (blocked > 0) log(`${blocked}件の取得先を、規約未確認または robots.txt の指示によりスキップしました。`);

  log(`取得した展覧会: ${results.length}件`);
  if (has('--dry-run')) {
    log('--dry-run のため保存しませんでした。');
    return;
  }

  await mkdir(new URL('./data/', import.meta.url), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2));
  log(`保存しました: scripts/data/data/exhibitions.json`);
  log('次は node scripts/data/ingest.mjs で Supabase に投入します。');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
