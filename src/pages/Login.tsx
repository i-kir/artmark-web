import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { session, signInWithEmail } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/mypage';
  if (session) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await signInWithEmail(email.trim());
      setStatus('sent');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-light py-16 px-4">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-navy-dark">ログイン / 新規登録</h1>
        <p className="mb-8 text-sm text-gray-medium">
          メールアドレスにログイン用のリンクをお送りします。パスワードは不要です。
        </p>

        {status === 'sent' ? (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            <p className="font-bold">メールを送信しました</p>
            <p className="mt-1">
              {email} 宛のリンクを開くとログインが完了します。届かない場合は迷惑メールフォルダをご確認ください。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

            <button
              type="submit"
              disabled={status === 'sending' || !email.trim()}
              className="w-full rounded-md bg-gold py-2 font-bold text-white transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'sending' ? '送信中...' : 'ログインリンクを送る'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
