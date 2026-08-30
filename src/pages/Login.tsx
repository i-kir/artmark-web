import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'magic' | 'password';

export default function Login() {
  const { session, signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('magic');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/mypage';
  if (session) return <Navigate to={from} replace />;

  const reset = (next: Mode) => {
    setMode(next);
    setStatus('idle');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      if (mode === 'magic') {
        await signInWithEmail(email.trim());
        setStatus('sent');
        return;
      }

      if (isSignUp) {
        const needsConfirmation = await signUpWithPassword(email.trim(), password);
        if (needsConfirmation) {
          setStatus('sent');
          setMessage('確認メールを送信しました。メール内のリンクを開くと登録が完了します。');
          return;
        }
      } else {
        await signInWithPassword(email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const canSubmit =
    email.trim().length > 0 && (mode === 'magic' || password.length >= 6) && status !== 'sending';

  return (
    <div className="min-h-screen bg-gray-light py-16 px-4">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-navy-dark">ログイン / 新規登録</h1>

        <div className="mb-6 flex border-b">
          <button
            type="button"
            onClick={() => reset('magic')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'magic' ? 'border-gold text-navy-dark' : 'border-transparent text-gray-medium'
            }`}
          >
            メールリンク
          </button>
          <button
            type="button"
            onClick={() => reset('password')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'password' ? 'border-gold text-navy-dark' : 'border-transparent text-gray-medium'
            }`}
          >
            パスワード
          </button>
        </div>

        {status === 'sent' ? (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            <p className="font-bold">メールを送信しました</p>
            <p className="mt-1">
              {message || `${email} 宛のリンクを開くとログインが完了します。届かない場合は迷惑メールフォルダをご確認ください。`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-medium">
              {mode === 'magic'
                ? 'メールアドレスにログイン用のリンクをお送りします。パスワードは不要です。'
                : isSignUp
                  ? 'メールアドレスとパスワード（6文字以上）で登録します。'
                  : '登録済みのメールアドレスとパスワードでログインします。'}
            </p>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-dark">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {mode === 'password' && (
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-dark">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            )}

            {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-md bg-gold py-2 font-bold text-white transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'sending'
                ? '処理中...'
                : mode === 'magic'
                  ? 'ログインリンクを送る'
                  : isSignUp
                    ? '登録する'
                    : 'ログイン'}
            </button>

            {mode === 'password' && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setStatus('idle');
                  setMessage('');
                }}
                className="w-full text-sm text-navy-accent underline hover:text-navy"
              >
                {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
