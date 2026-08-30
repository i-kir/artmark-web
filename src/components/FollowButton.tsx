import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsFollowing, useSetFollow } from '../hooks/queries';

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { session, userId } = useAuth();
  const navigate = useNavigate();
  const isFollowing = useIsFollowing(targetUserId);
  const setFollow = useSetFollow();

  // 自分自身はフォローできない（DB 側にも制約を入れてある）
  if (userId === targetUserId) return null;

  const handleClick = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    setFollow.mutate({ targetUserId, follow: !isFollowing });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={setFollow.isPending}
      className={`rounded-full px-5 py-2 text-sm font-bold transition disabled:opacity-50 ${
        isFollowing
          ? 'border border-gray-300 bg-white text-navy hover:bg-gray-50'
          : 'bg-gold text-white hover:bg-gold-light'
      }`}
    >
      {isFollowing ? 'フォロー中' : 'フォローする'}
    </button>
  );
}
