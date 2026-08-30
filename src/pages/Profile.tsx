import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import ReviewList from '../components/ReviewList';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import NotFound from './NotFound';
import { useAuth } from '../contexts/AuthContext';
import { useFollowers, useFollowing, useProfileByHandle, useProfileStats, useReviewsByUser } from '../hooks/queries';
import { useTargetNames } from '../hooks/useTargetNames';
import type { Profile as ProfileType } from '../types';

type Tab = 'reviews' | 'following' | 'followers';

function UserList({ users, empty }: { users: ProfileType[]; empty: string }) {
  if (users.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="mx-auto max-w-2xl space-y-2">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            to={`/u/${user.handle}`}
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <Avatar author={{ displayName: user.displayName, avatarUrl: user.avatarUrl }} size="md" />
            <div className="min-w-0">
              <p className="font-bold text-navy">{user.displayName || user.handle}</p>
              <p className="text-sm text-gray-500">@{user.handle}</p>
              {user.bio && <p className="mt-1 line-clamp-1 text-sm text-gray-600">{user.bio}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Profile() {
  const { handle = '' } = useParams<{ handle: string }>();
  const { userId } = useAuth();
  const [tab, setTab] = useState<Tab>('reviews');

  const profile = useProfileByHandle(handle);
  const targetUserId = profile.data?.id;
  const stats = useProfileStats(targetUserId);
  const reviews = useReviewsByUser(targetUserId);
  const following = useFollowing(targetUserId);
  const followers = useFollowers(targetUserId);
  const { nameOf } = useTargetNames();

  if (profile.error) return <ErrorState error={profile.error} />;
  if (profile.isLoading) return <Loading />;
  if (!profile.data) return <NotFound />;

  const user = profile.data;
  const isMe = userId === user.id;

  const TABS: { value: Tab; label: string; count: number }[] = [
    { value: 'reviews', label: 'レビュー', count: stats.data?.reviewCount ?? 0 },
    { value: 'following', label: 'フォロー中', count: stats.data?.followingCount ?? 0 },
    { value: 'followers', label: 'フォロワー', count: stats.data?.followerCount ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-light">
      <div className="bg-navy-dark px-4 pb-8 pt-12 text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center">
          <Avatar author={{ displayName: user.displayName, avatarUrl: user.avatarUrl }} size="lg" />
          <h1 className="text-2xl font-bold">{user.displayName || user.handle}</h1>
          <p className="text-sm text-gray-400">@{user.handle}</p>
          {user.bio && <p className="max-w-xl whitespace-pre-wrap text-sm text-gray-200">{user.bio}</p>}

          {isMe ? (
            <Link
              to="/settings/profile"
              className="rounded-full border border-gray-500 px-5 py-2 text-sm font-bold transition hover:bg-navy-medium"
            >
              プロフィールを編集
            </Link>
          ) : (
            <FollowButton targetUserId={user.id} />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex border-b border-gray-300">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`flex-1 border-b-2 py-4 text-center font-medium transition-colors ${
                tab === t.value
                  ? 'border-gold text-navy-dark'
                  : 'border-transparent text-gray-medium hover:text-navy-medium'
              }`}
            >
              {t.label} <span className="text-sm text-gray-500">{t.count}</span>
            </button>
          ))}
        </div>

        {tab === 'reviews' &&
          (reviews.isLoading ? (
            <Loading />
          ) : (reviews.data ?? []).length === 0 ? (
            <Empty>まだレビューがありません。</Empty>
          ) : (
            <div className="mx-auto max-w-2xl">
              <ReviewList reviews={reviews.data ?? []} targetNameOf={nameOf} />
            </div>
          ))}

        {tab === 'following' &&
          (following.isLoading ? (
            <Loading />
          ) : (
            <UserList users={following.data ?? []} empty="まだ誰もフォローしていません。" />
          ))}

        {tab === 'followers' &&
          (followers.isLoading ? (
            <Loading />
          ) : (
            <UserList users={followers.data ?? []} empty="まだフォロワーがいません。" />
          ))}
      </div>
    </div>
  );
}
