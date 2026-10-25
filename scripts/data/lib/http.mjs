// 相手のサーバーに迷惑をかけないための取得層。
// - 連絡先を含む User-Agent を必ず名乗る
// - 同一ホストへは1秒に1回まで
// - ETag / Last-Modified を保存して条件付きGETにする（変わっていなければ本文を貰わない）
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const USER_AGENT =
  process.env.ARTMARK_USER_AGENT ??
  // HTTP ヘッダーは ASCII のみ。日本語を入れると fetch が例外を投げる
  'ArtMarkBot/0.1 (+https://artmark-web.vercel.app; exhibition info collection; see README for contact)';

const MIN_INTERVAL_MS = Number(process.env.ARTMARK_CRAWL_INTERVAL_MS ?? 1000);
const lastRequestAt = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitTurn(host) {
  const last = lastRequestAt.get(host) ?? 0;
  const wait = last + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt.set(host, Date.now());
}

const CACHE_PATH = new URL('../.cache/http.json', import.meta.url).pathname;

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

/**
 * @returns {Promise<{status:number, body:string|null, notModified:boolean}>}
 */
export async function politeFetch(url, { timeoutMs = 15000 } = {}) {
  const host = new URL(url).host;
  await waitTurn(host);

  const cache = await loadCache();
  const entry = cache[url] ?? {};

  const headers = { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,application/json' };
  if (entry.etag) headers['If-None-Match'] = entry.etag;
  if (entry.lastModified) headers['If-Modified-Since'] = entry.lastModified;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });

    if (res.status === 304) return { status: 304, body: null, notModified: true };

    const body = await res.text();
    if (res.ok) {
      cache[url] = {
        etag: res.headers.get('etag') ?? undefined,
        lastModified: res.headers.get('last-modified') ?? undefined,
        fetchedAt: new Date().toISOString(),
      };
      await saveCache(cache);
    }
    return { status: res.status, body, notModified: false };
  } finally {
    clearTimeout(timer);
  }
}
