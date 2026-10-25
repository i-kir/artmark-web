// .env.scripts を読み込む副作用モジュール。
// http.mjs が import 時に ARTMARK_USER_AGENT を読むため、
// エントリスクリプトでは **他の import より先に** これを import すること。
// （無ければ何もしない。環境変数で直接渡す運用でも動く）
import { readFile } from 'node:fs/promises';

try {
  const text = await readFile(new URL('../../../.env.scripts', import.meta.url), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && m[2].trim() && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  // 無ければ無視
}
