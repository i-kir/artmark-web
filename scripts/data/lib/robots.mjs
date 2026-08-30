// robots.txt の最小限の解釈。
// 「書いてあるルールに従う」ことが目的なので、判断に迷う書式は
// 許可ではなく拒否側に倒す。
import { politeFetch, USER_AGENT } from './http.mjs';

const cache = new Map();

function parse(text) {
  const groups = [];
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [], crawlDelay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (key === 'allow' || key === 'disallow')) {
      current.rules.push({ allow: key === 'allow', path: value });
    } else if (current && key === 'crawl-delay') {
      const n = Number(value);
      if (Number.isFinite(n)) current.crawlDelay = n;
    }
  }
  return groups;
}

function matches(pattern, path) {
  if (pattern === '') return false;
  // * と $ のみ対応。それ以外はリテラル
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const anchored = escaped.endsWith('\\$') ? `^${escaped.slice(0, -2)}$` : `^${escaped}`;
  return new RegExp(anchored).test(path);
}

function pickGroup(groups, agentToken) {
  const specific = groups.find((g) => g.agents.some((a) => a !== '*' && agentToken.includes(a)));
  return specific ?? groups.find((g) => g.agents.includes('*')) ?? null;
}

/**
 * @returns {Promise<{allowed:boolean, reason:string, crawlDelay:number|null}>}
 */
export async function checkRobots(targetUrl) {
  const url = new URL(targetUrl);
  const robotsUrl = `${url.origin}/robots.txt`;

  if (!cache.has(robotsUrl)) {
    try {
      const res = await politeFetch(robotsUrl);
      // robots.txt が無い（404）場合は「制限なし」と解釈するのが慣習
      cache.set(robotsUrl, res.status === 404 ? '' : (res.body ?? ''));
    } catch (error) {
      // 取得できないときは安全側に倒して拒否する
      cache.set(robotsUrl, null);
      return { allowed: false, reason: `robots.txt を取得できませんでした: ${error.message}`, crawlDelay: null };
    }
  }

  const text = cache.get(robotsUrl);
  if (text === null) return { allowed: false, reason: 'robots.txt を取得できませんでした', crawlDelay: null };
  if (text === '') return { allowed: true, reason: 'robots.txt なし（制限なし）', crawlDelay: null };

  const agentToken = USER_AGENT.split('/')[0].toLowerCase();
  const group = pickGroup(parse(text), agentToken);
  if (!group) return { allowed: true, reason: '該当するルールなし', crawlDelay: null };

  const path = url.pathname + url.search;
  let best = null;
  for (const rule of group.rules) {
    if (!matches(rule.path, path)) continue;
    // より長い（＝具体的な）ルールを優先する
    if (!best || rule.path.length > best.path.length) best = rule;
  }

  if (!best) return { allowed: true, reason: '該当するルールなし', crawlDelay: group.crawlDelay };
  return {
    allowed: best.allow,
    reason: `${best.allow ? 'Allow' : 'Disallow'}: ${best.path}`,
    crawlDelay: group.crawlDelay,
  };
}
