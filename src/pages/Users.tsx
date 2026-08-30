import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import { useSearchProfiles } from '../hooks/queries';

export default function Users() {
  const [term, setTerm] = useState('');
  const profiles = useSearchProfiles(term);

  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        <h1 className="border-l-4 border-gold pl-3 text-2xl font-bold text-navy-dark">ユーザーを探す</h1>

        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ハンドルまたは表示名で検索..."
          className="w-full rounded-full border border-gray-300 px-4 py-3 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />

        {profiles.error && <ErrorState error={profiles.error} />}
        {profiles.isLoading && <Loading />}

        {profiles.isSuccess &&
          ((profiles.data ?? []).length === 0 ? (
            <Empty>該当するユーザーが見つかりませんでした。</Empty>
          ) : (
            <ul className="space-y-2">
              {(profiles.data ?? []).map((user) => (
                <li
                  key={user.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                >
                  <Link to={`/u/${user.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar author={{ displayName: user.displayName, avatarUrl: user.avatarUrl }} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-navy">{user.displayName || user.handle}</p>
                      <p className="text-sm text-gray-500">@{user.handle}</p>
                      {user.bio && <p className="mt-1 line-clamp-1 text-sm text-gray-600">{user.bio}</p>}
                    </div>
                  </Link>
                  <FollowButton targetUserId={user.id} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
