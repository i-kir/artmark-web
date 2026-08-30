// 多くの美術館サイトは schema.org の JSON-LD を埋めている。
// あれば構造化データを読むのが、HTML の見た目に依存しない一番安定した方法。
// CSS セレクタ頼みの抽出はサイト改修のたびに壊れる。

function collect(node, out) {
  if (Array.isArray(node)) {
    for (const n of node) collect(n, out);
    return;
  }
  if (!node || typeof node !== 'object') return;

  const type = node['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((t) => typeof t === 'string' && /Event$/.test(t))) out.push(node);

  if (node['@graph']) collect(node['@graph'], out);
  for (const key of ['subEvent', 'event', 'itemListElement', 'item']) {
    if (node[key]) collect(node[key], out);
  }
}

/** HTML から schema.org の Event 系ノードを抜き出す */
export function extractEvents(html) {
  const events = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      collect(JSON.parse(raw), events);
    } catch {
      // 壊れた JSON-LD は珍しくない。1つ失敗しても他を諦めない
    }
  }
  return events;
}

const firstString = (value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return firstString(value[0]);
  if (value && typeof value === 'object') return firstString(value.name ?? value['@value'] ?? value.url);
  return null;
};

const toDate = (value) => {
  const s = firstString(value);
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

/** JSON-LD の Event を ArtMark の展覧会レコードの形に整える */
export function toExhibition(event, { museumId, sourceUrl }) {
  const title = firstString(event.name);
  const startDate = toDate(event.startDate);
  const endDate = toDate(event.endDate);
  if (!title || !startDate || !endDate) return null;

  const offer = Array.isArray(event.offers) ? event.offers[0] : event.offers;
  const price = offer?.price ? `${offer.price}${offer.priceCurrency === 'JPY' ? '円' : ''}` : '';

  return {
    museumId,
    title: title.trim().replace(/\s+/g, ' '),
    startDate,
    endDate,
    price,
    // 本文の丸ごとコピーはしない。事実の要点だけを持ち、詳細は公式サイトへ送る
    description: '',
    imageUrl: firstString(event.image) ?? null,
    officialUrl: firstString(event.url) ?? sourceUrl,
    sourceUrl,
  };
}
