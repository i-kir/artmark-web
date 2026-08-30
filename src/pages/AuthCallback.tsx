import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** メールのリンクから戻ってきたときの着地点。supabase-js が URL からセッションを復元する */
export default function AuthCallback() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate(session ? '/mypage' : '/login', { replace: true });
  }, [session, loading, navigate]);

  return <div className="py-24 text-center text-gray-500">ログイン処理中...</div>;
}
