import { supabase } from '../lib/supabase';

export type Extracted = {
  ok: true;
  sourceUrl: string;
  title: string;
  startDate: string;
  endDate: string;
  price: string;
  imageUrl: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
};

/**
 * 公式ページの URL から下書きを作る。
 * 完全自動ではなく、人が確認して直す前提の補助。
 */
export async function extractExhibition(url: string): Promise<Extracted> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('ログインが必要です。');

  const res = await fetch(`/api/extract?url=${encodeURIComponent(url)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? `読み込みに失敗しました（HTTP ${res.status}）。`);
  }
  return json as Extracted;
}
