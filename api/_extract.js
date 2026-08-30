// 展覧会ページから、タイトル・会期・料金を推測する。
// 完全自動ではなく「人が確認して直す前提の下書き」を作るのが目的。
import dns from 'node:dns/promises';
import net from 'node:net';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 12000;

// ---------- SSRF 対策 ----------
// ユーザーが自由に URL を渡せる以上、社内ネットワークや
// クラウドのメタデータサーバーを叩かせない防御が必須になる。
function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // クラウドのメタデータ
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  return (
    lower === '::1' ||
    lower === '::' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80') ||
    lower.startsWith('::ffff:')
  );
}

async function assertPublicUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('URL の形式が正しくありません。');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('http または https の URL を指定してください。');
  }

  const host = url.hostname;
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('この URL は取得できません。');
  }

  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new Error('この URL は取得できません。');
    return url;
  }

  const records = await dns.lookup(host, { all: true }).catch(() => []);
  if (records.length === 0) throw new Error('ホスト名を解決できませんでした。');
  if (records.some((r) => isPrivateAddress(r.address))) throw new Error('この URL は取得できません。');
  return url;
}

async function fetchHtml(rawUrl) {
  let current = rawUrl;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const url = await assertPublicUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ArtMark/0.1 (入力補助; +https://artmark-web.vercel.app)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.8',
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error(`リダイレクト先が不明です（HTTP ${res.status}）。`);
      current = new URL(location, url).toString();
      continue;
    }

    if (!res.ok) throw new Error(`ページを取得できませんでした（HTTP ${res.status}）。`);

    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('html')) throw new Error('HTML ページではありません。');

    // 巨大なページで詰まらないよう、途中で打ち切る
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      chunks.push(value);
      if (size > MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    return { html: buffer.toString('utf8'), finalUrl: url.toString() };
  }

  throw new Error('リダイレクトが多すぎます。');
}

// ---------- 抽出 ----------

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

function meta(html, property) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    'i'
  );
  const m = html.match(re) ?? html.match(alt);
  return m ? decode(m[1]).trim() : null;
}

function textOf(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t　]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n');
}

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/**
 * 日本の展覧会ページによくある会期表記を拾う。
 * 「2026年4月1日（水）〜6月30日（火）」のように終了側の年が省かれる形が多い。
 */
function findPeriod(text) {
  const DASH = '[〜～~\\-–—ー−]';

  const patterns = [
    // 2026年4月1日 〜 2026年6月30日
    new RegExp(
      `(\\d{4})\\s*年\\s*(\\d{1,2})\\s*月\\s*(\\d{1,2})\\s*日[^\\d]{0,12}?${DASH}[^\\d]{0,12}?(\\d{4})\\s*年\\s*(\\d{1,2})\\s*月\\s*(\\d{1,2})\\s*日`
    ),
    // 2026年4月1日 〜 6月30日（終了側の年を省略）
    new RegExp(
      `(\\d{4})\\s*年\\s*(\\d{1,2})\\s*月\\s*(\\d{1,2})\\s*日[^\\d]{0,12}?${DASH}[^\\d]{0,12}?(\\d{1,2})\\s*月\\s*(\\d{1,2})\\s*日`
    ),
    // 2026.4.1 - 2026.6.30
    new RegExp(
      `(\\d{4})[./](\\d{1,2})[./](\\d{1,2})\\s*${DASH}\\s*(\\d{4})[./](\\d{1,2})[./](\\d{1,2})`
    ),
    // 2026.4.1 - 6.30
    new RegExp(`(\\d{4})[./](\\d{1,2})[./](\\d{1,2})\\s*${DASH}\\s*(\\d{1,2})[./](\\d{1,2})`),
  ];

  for (const [index, re] of patterns.entries()) {
    const m = text.match(re);
    if (!m) continue;

    const nums = m.slice(1).map(Number);
    let start;
    let end;

    if (nums.length === 6) {
      start = iso(nums[0], nums[1], nums[2]);
      end = iso(nums[3], nums[4], nums[5]);
    } else {
      const [y, sm, sd, em, ed] = nums;
      // 終了月が開始月より前なら年をまたいでいる
      const endYear = em < sm ? y + 1 : y;
      start = iso(y, sm, sd);
      end = iso(endYear, em, ed);
    }

    if (end < start) continue;
    return { start, end, matched: m[0].replace(/\s+/g, ' ').trim(), pattern: index };
  }
  return null;
}

function findPrice(text) {
  const patterns = [
    /(?:一般|当日|大人)[^\d]{0,8}([\d,]{3,7})\s*円/,
    /観覧料[^\d]{0,20}([\d,]{3,7})\s*円/,
    /入場料[^\d]{0,20}([\d,]{3,7})\s*円/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return `一般 ${m[1]}円`;
  }
  if (/入場無料|観覧無料|無料/.test(text)) return '無料';
  return '';
}

function cleanTitle(raw) {
  if (!raw) return '';
  // 「展覧会名 | 美術館名」「展覧会名 - 美術館名」の後半を落とす
  const parts = raw.split(/\s*[|｜]\s*|\s+[-–—]\s+/);
  const head = parts[0].trim();
  return (head.length >= 4 ? head : raw).replace(/\s+/g, ' ').trim();
}

function fromJsonLd(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const events = [];
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        const t = node['@type'];
        const types = Array.isArray(t) ? t : [t];
        if (types.some((x) => typeof x === 'string' && /Event$/.test(x))) events.push(node);
        if (node['@graph']) walk(node['@graph']);
      };
      walk(JSON.parse(match[1]));
    } catch {
      // 壊れた JSON-LD は無視する
    }
  }

  const event = events[0];
  if (!event) return null;

  const date = (v) => {
    const s = typeof v === 'string' ? v : null;
    const m = s?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  };

  return {
    title: typeof event.name === 'string' ? event.name.trim() : null,
    startDate: date(event.startDate),
    endDate: date(event.endDate),
  };
}

export async function extract(rawUrl) {
  const { html, finalUrl } = await fetchHtml(rawUrl);
  const text = textOf(html);

  const ld = fromJsonLd(html);
  const period = findPeriod(text);

  const ogTitle = meta(html, 'og:title');
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = ld?.title ?? ogTitle ?? (titleTag ? decode(titleTag[1]) : '');

  const startDate = ld?.startDate ?? period?.start ?? '';
  const endDate = ld?.endDate ?? period?.end ?? '';

  const notes = [];
  if (ld) notes.push('構造化データ（JSON-LD）から取得しました。');
  else if (period) notes.push(`本文の「${period.matched}」から会期を推測しました。`);
  else notes.push('会期を読み取れませんでした。手で入力してください。');

  return {
    ok: true,
    sourceUrl: finalUrl,
    title: cleanTitle(rawTitle),
    startDate,
    endDate,
    price: findPrice(text),
    imageUrl: meta(html, 'og:image') ?? '',
    description: meta(html, 'og:description') ?? meta(html, 'description') ?? '',
    confidence: ld ? 'high' : period ? 'medium' : 'low',
    notes,
  };
}
