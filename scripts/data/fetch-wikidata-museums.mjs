#!/usr/bin/env node
// Wikidata から日本の美術館を取得して、投入用 SQL を作る。
// Wikidata のデータは CC0（パブリックドメイン）なので、出典を明記すれば自由に使えます。
//
//   node scripts/data/fetch-wikidata-museums.mjs           上位200件
//   node scripts/data/fetch-wikidata-museums.mjs --limit 500
//
// 出力: supabase/migrations/0006_museums_wikidata.sql
import { writeFile } from 'node:fs/promises';
import { USER_AGENT } from './lib/http.mjs';

const ENDPOINT = 'https://query.wikidata.org/sparql';

const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) : 200;

// Q207694 = 美術館。P31/P279* で下位クラスも拾う。
// 座標（P625）を持つものだけに絞る（地図に出せないデータは今回の用途では使えない）。
const QUERY = `
SELECT ?item ?itemLabel ?coord ?website ?adminLabel ?inception WHERE {
  ?item wdt:P31/wdt:P279* wd:Q207694 ;
        wdt:P17 wd:Q17 ;
        wdt:P625 ?coord .
  OPTIONAL { ?item wdt:P856 ?website }
  OPTIONAL { ?item wdt:P131 ?admin }
  OPTIONAL { ?item wdt:P571 ?inception }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ja,en". }
}
LIMIT ${LIMIT}
`;

const q = (v) => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

// 「都道府県 + 市区町村」を行政区画ラベルから推測する
const PREF = /(北海道|東京都|京都府|大阪府|.{2,3}県)/;

function parsePoint(wkt) {
  // 例: "Point(139.754778 35.690611)"
  const m = wkt.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
  return m ? { lng: Number(m[1]), lat: Number(m[2]) } : null;
}

async function main() {
  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(QUERY)}`;
  console.log(`Wikidata に問い合わせています（最大 ${LIMIT} 件）...`);

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' } });
  if (!res.ok) {
    console.error(`失敗しました: HTTP ${res.status}`);
    console.error(await res.text().catch(() => ''));
    process.exit(1);
  }

  const json = await res.json();
  const rows = json.results.bindings;
  console.log(`${rows.length} 件を取得しました。`);

  const seen = new Set();
  const museums = [];

  for (const row of rows) {
    const qid = row.item.value.split('/').pop();
    if (seen.has(qid)) continue;
    seen.add(qid);

    const name = row.itemLabel?.value ?? '';
    // ラベルが取れず QID のままのものは使わない
    if (!name || /^Q\d+$/.test(name)) continue;

    const point = parsePoint(row.coord.value);
    if (!point) continue;

    const admin = row.adminLabel?.value ?? '';
    const prefecture = admin.match(PREF)?.[1] ?? '';

    museums.push({
      id: `wd_${qid}`,
      wikidataId: qid,
      name,
      area: prefecture.replace(/[都府県]$/, '') || admin,
      prefecture,
      address: admin,
      website: row.website?.value ?? null,
      lat: point.lat,
      lng: point.lng,
    });
  }

  console.log(`座標と名称が揃ったもの: ${museums.length} 件`);

  const lines = [
    '-- 自動生成: node scripts/data/fetch-wikidata-museums.mjs',
    `-- 取得日時: ${new Date().toISOString()}`,
    '-- 出典: Wikidata (https://www.wikidata.org) — ライセンス CC0',
    '-- 開館時間・休館日・紹介文は Wikidata に無いため空です。必要に応じて後から補完してください。',
    '',
    'insert into public.museums',
    '  (id, wikidata_id, name, name_kana, address, prefecture, area, lat, lng, website, source, source_url)',
    'values',
    museums
      .map(
        (m) =>
          `  (${[
            q(m.id),
            q(m.wikidataId),
            q(m.name),
            q(''),
            q(m.address),
            q(m.prefecture),
            q(m.area),
            m.lat,
            m.lng,
            q(m.website),
            `'wikidata'`,
            q(`https://www.wikidata.org/wiki/${m.wikidataId}`),
          ].join(', ')})`
      )
      .join(',\n'),
    'on conflict (id) do update set',
    '  name = excluded.name, address = excluded.address, prefecture = excluded.prefecture,',
    '  area = excluded.area, lat = excluded.lat, lng = excluded.lng, website = excluded.website,',
    '  source = excluded.source, source_url = excluded.source_url;',
    '',
  ];

  const outPath = new URL('../../supabase/migrations/0006_museums_wikidata.sql', import.meta.url);
  await writeFile(outPath, lines.join('\n'));
  console.log('書き出しました: supabase/migrations/0006_museums_wikidata.sql');
  console.log('中身を確認してから Supabase の SQL Editor で実行してください。');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
