import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** 環境変数が未設定でもアプリ全体は起動させ、データ取得時にだけ案内を出す */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[ArtMark] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です。' +
      '.env.local を作成してください（docs/SUPABASE.md 参照）。'
  );
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
