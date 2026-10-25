// JSON-LD が無い館向けの抽出。ページ本文を Claude に渡し、展覧会の「事実」だけを JSON で返させる。
//
// CSS セレクタ頼みの抽出と違い、サイトの HTML 構造が変わっても壊れにくい。
// ただし LLM は「それらしい嘘」を返すことがあるため、返ってきた値は必ず検証する:
//   - 日付は ISO 形式で、終了日 >= 開始日
//   - タイトルは実際にページ本文に現れていること（でっち上げの排除）
//   - 公式 URL はページ内のリンクに存在すること（無ければ一覧ページに戻す）
// 紹介文と画像は取らない。事実情報（名称・会期・料金・公式URL）だけを保存する。
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-5-5';
const MAX_TEXT_CHARS = 30000;
const CACHE_PATH = new URL('../.cache/llm.json', import.meta.url).pathname;

const TOOL = {
  name: 'record_exhibitions',
  description: '美術館の展覧会一覧ページから読み取った展覧会を記録する。',
  input_schema: {
    type: 'object',
    properties: {
      exhibitions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '展覧会名。ページに書かれている通りに。' },
            startDate: { type: 'string', description: '開始日 YYYY-MM-DD。読み取れなければ空文字。' },
            endDate: { type: 'string', description: '終了日 YYYY-MM-DD。読み取れなければ空文字。' },
            price: { type: 'string', description: '観覧料。書かれていなければ空文字。' },
            officialUrl: { type: 'string', description: 'その展覧会の詳細ページURL（絶対URL）。無ければ空文字。' },
          },
          required: ['title', 'startDate', 'endDate', 'price', 'officialUrl'],
        },
      },
    },
    required: ['exhibitions'],
  },
};

/** HTML を、LLM に渡す本文テキストとリンク一覧に変換する */
export function htmlToText(html, baseUrl) {
  const links = new Set();

  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // <a href="x">text</a> → "text [x]"。詳細ページ URL を LLM に見せるため
  s = s.replace(/<a\b[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
    let abs;
    try {
      abs = new URL(href, baseUrl).href;
    } catch {
      return inner;
    }
    if (!/^https?:/i.test(abs)) return inner;
    links.add(abs);
    return `${inner} [${abs}]`;
  });

  s = s
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t　]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  return { text: s.slice(0, MAX_TEXT_CHARS), links };
}

const squash = (v) => v.replace(/\s+/g, '').toLowerCase();

const isIsoDate = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

/** LLM の出力を検証して、取り込める形にする。弾いた理由は rejected に残す */
export function validate(raw, { text, links, museumId, sourceUrl }) {
  const accepted = [];
  const rejected = [];
  const haystack = squash(text);
  const seen = new Set();

  for (const item of Array.isArray(raw) ? raw : []) {
    const title = typeof item?.title === 'string' ? item.title.trim().replace(/\s+/g, ' ') : '';
    const startDate = typeof item?.startDate === 'string' ? item.startDate.trim() : '';
    const endDate = typeof item?.endDate === 'string' ? item.endDate.trim() : '';

    if (!title) {
      rejected.push({ title: '(なし)', reason: 'タイトルが空' });
      continue;
    }
    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
      rejected.push({ title, reason: `会期が読み取れない（${startDate || '空'} / ${endDate || '空'}）` });
      continue;
    }
    if (endDate < startDate) {
      rejected.push({ title, reason: '終了日が開始日より前' });
      continue;
    }
    if (!haystack.includes(squash(title))) {
      rejected.push({ title, reason: 'タイトルがページ本文に存在しない（誤抽出の疑い）' });
      continue;
    }

    const key = `${startDate}|${squash(title)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // 詳細URLはページ内に実在するものだけ採用。無ければ一覧ページへ送る
    const candidate = typeof item.officialUrl === 'string' ? item.officialUrl.trim() : '';
    const officialUrl = candidate && links.has(candidate) ? candidate : sourceUrl;

    accepted.push({
      museumId,
      title,
      startDate,
      endDate,
      price: typeof item.price === 'string' ? item.price.trim() : '',
      description: '',
      imageUrl: null,
      officialUrl,
      sourceUrl,
    });
  }
  return { accepted, rejected };
}

async function loadCache() {
  try {
    return JSON.parse(await readFile(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function callClaude({ text, museumName, today, apiKey, model }) {
  const system =
    'あなたは美術館サイトの展覧会一覧ページから、展覧会の事実情報だけを抜き出す抽出器です。' +
    'ページに書かれていない情報を推測で補ってはいけません。' +
    '会期に年が書かれていない場合は、今日の日付を基準に、現在開催中または近い将来の展覧会として最も自然な年を選びます。' +
    '過去の展覧会アーカイブ、イベント、ワークショップ、コレクション常設展は含めません。' +
    '紹介文は抜き出さず、事実（名称・会期・観覧料・詳細ページURL）だけを返します。';

  const user =
    `美術館: ${museumName}\n今日の日付: ${today}\n\n` +
    `以下はこの美術館の展覧会一覧ページの本文です。リンクは「テキスト [URL]」の形で入っています。\n` +
    `record_exhibitions ツールで、現在開催中および今後開催予定の展覧会だけを記録してください。\n\n` +
    `-----\n${text}\n-----`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const block = data.content?.find((b) => b.type === 'tool_use' && b.name === TOOL.name);
  if (!block) throw new Error('Claude API の応答に tool_use が含まれていません');
  return block.input?.exhibitions ?? [];
}

/**
 * 一覧ページの HTML から展覧会を抽出する。
 * 同じ本文（ハッシュ一致）なら API を呼ばずに前回の結果を返す。
 *
 * @returns {Promise<{accepted: object[], rejected: object[], cached: boolean}>}
 */
export async function extractWithLlm(html, { museumId, museumName, sourceUrl, today = new Date().toISOString().slice(0, 10) }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が未設定です');
  const model = process.env.ARTMARK_LLM_MODEL ?? DEFAULT_MODEL;

  const { text, links } = htmlToText(html, sourceUrl);
  if (text.length < 200) throw new Error('本文がほとんど取得できません（JSで描画されるページの可能性）');

  // 日付が変わると「今日基準の年推定」が変わるので、キーに日付も含める
  const key = createHash('sha256').update(`${model}\n${today}\n${museumId}\n${text}`).digest('hex');
  const cache = await loadCache();

  let raw = cache[key]?.raw;
  const cached = Array.isArray(raw);
  if (!cached) {
    raw = await callClaude({ text, museumName, today, apiKey, model });
    cache[key] = { raw, at: new Date().toISOString() };
    await saveCache(cache);
  }

  return { ...validate(raw, { text, links, museumId, sourceUrl }), cached };
}
