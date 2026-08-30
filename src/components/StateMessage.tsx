import { isSupabaseConfigured } from '../lib/supabase';

/** Supabase のエラーは Error インスタンスではなく { message, details, hint, code } の素のオブジェクト */
function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const lines = (['message', 'code', 'details', 'hint'] as const)
      .filter((k) => e[k])
      .map((k) => `${k}: ${typeof e[k] === 'string' ? e[k] : JSON.stringify(e[k])}`);
    if (lines.length > 0) return lines.join('\n');
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

export function Loading({ label = '読み込み中...' }: { label?: string }) {
  return <div className="py-12 text-center text-gray-500">{label}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-12 text-center text-gray-500">{children}</div>;
}

/** 環境変数の設定漏れは一番よくある詰まりどころなので、専用の案内を出す */
export function ErrorState({ error }: { error: unknown }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="my-8 rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-bold mb-2">Supabase に接続できていません</p>
        <p>
          プロジェクト直下に <code className="font-mono">.env.local</code> を作り、
          <code className="font-mono"> VITE_SUPABASE_URL</code> と
          <code className="font-mono"> VITE_SUPABASE_ANON_KEY</code> を設定してから開発サーバーを再起動してください。
          手順は <code className="font-mono">docs/SUPABASE.md</code> にあります。
        </p>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-lg border border-red-300 bg-red-50 p-6 text-sm text-red-800">
      <p className="font-bold mb-2">データを取得できませんでした</p>
      <pre className="whitespace-pre-wrap break-all font-mono text-xs">{describe(error)}</pre>
    </div>
  );
}
