// 展覧会ページの下書きを作る API。
// ブラウザから他サイトを直接読むことはできない（CORS）ため、サーバー側で取得する。
//
// ログイン済みユーザーだけが使えるようにしてある。
// 誰でも叩ける状態にすると、他人のサーバーを踏み台にする穴になるため。
import { extract } from './_extract.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

async function verifyUser(authHeader) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { ok: false, error: 'サーバーの設定が不足しています。' };
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, error: 'ログインが必要です。' };

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) return { ok: false, error: 'ログインが必要です。' };
  return { ok: true };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'GET のみ対応しています。' });
    return;
  }

  const url = new URL(req.url, 'http://localhost').searchParams.get('url');
  if (!url) {
    res.status(400).json({ ok: false, error: 'url パラメータが必要です。' });
    return;
  }

  const auth = await verifyUser(req.headers.authorization);
  if (!auth.ok) {
    res.status(401).json({ ok: false, error: auth.error });
    return;
  }

  try {
    const result = await extract(url);
    res.status(200).json(result);
  } catch (error) {
    res.status(422).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
