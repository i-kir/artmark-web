import { useMemo, useState } from 'react';
import ExhibitionCard from '../components/ExhibitionCard';
import MuseumCard from '../components/MuseumCard';
import ReviewList from '../components/ReviewList';
import EndingSoonClips from '../components/EndingSoonClips';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import { useAuth } from '../contexts/AuthContext';
import { useExhibitions, useMuseums, useMyClips, useMyReviews, useProfileStats } from '../hooks/queries';
import { useTargetNames } from '../hooks/useTargetNames';
import { Link } from 'react-router-dom';
import type { Clip } from '../types';

type Tab = 'visited' | 'want' | 'reviews';

const TABS: { value: Tab; label: string }[] = [
  { value: 'visited', label: '行った' },
  { value: 'want', label: '行きたい' },
  { value: 'reviews', label: 'レビュー' },
];

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('visited');
  const { profile, session, userId } = useAuth();
  const stats = useProfileStats(userId);
  const { nameOf } = useTargetNames();
  const clips = useMyClips();
  const reviews = useMyReviews();
  const museums = useMuseums();
  const exhibitions = useExhibitions();

  const error = clips.error ?? reviews.error ?? museums.error ?? exhibitions.error;

  const museumById = useMemo(() => new Map((museums.data ?? []).map((m) => [m.id, m])), [museums.data]);
  const exhibitionById = useMemo(
    () => new Map((exhibitions.data ?? []).map((e) => [e.id, e])),
    [exhibitions.data]
  );

  const visitedClips = (clips.data ?? []).filter((c) => c.status === 'visited');
  const wantClips = (clips.data ?? []).filter((c) => c.status === 'want');

  const renderClips = (list: Clip[]) => {
    if (clips.isLoading) return <Loading />;
    if (list.length === 0) return <Empty>まだ記録がありません。</Empty>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((clip) => {
          const key = `${clip.targetType}_${clip.targetId}`;
          if (clip.targetType === 'museum') {
            const museum = museumById.get(clip.targetId);
            return museum ? <MuseumCard key={key} museum={museum} /> : null;
          }
          const exhibition = exhibitionById.get(clip.targetId);
          return exhibition ? (
            <ExhibitionCard
              key={key}
              exhibition={exhibition}
              museumName={museumById.get(exhibition.museumId)?.name}
            />
          ) : null;
        })}
      </div>
    );
  };

  const displayName = profile?.displayName || session?.user.email || 'ユーザー';

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-rose-tint bg-gradient-to-br from-rose-tint via-cream to-sand/50 pt-14 pb-10 text-navy">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-white rounded-full grid place-items-center border-2 border-rose/40 font-serif text-3xl text-rose shadow-soft">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <h1 className="font-serif text-2xl font-semibold">{displayName}</h1>
          {profile?.handle && <p className="text-sm text-gray-medium">@{profile.handle}</p>}

          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-6 bg-white/70 px-6 sm:px-8 py-4 rounded-2xl shadow-soft">
            <div className="text-center">
              <div className="text-sm text-gray-medium">行った</div>
              <div className="text-xl font-bold text-rose">{visitedClips.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-medium">行きたい</div>
              <div className="text-xl font-bold text-rose">{wantClips.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-medium">レビュー</div>
              <div className="text-xl font-bold text-rose">{(reviews.data ?? []).length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-medium">フォロー中</div>
              <div className="text-xl font-bold text-rose">{stats.data?.followingCount ?? 0}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-medium">フォロワー</div>
              <div className="text-xl font-bold text-rose">{stats.data?.followerCount ?? 0}</div>
            </div>
          </div>

          {profile?.handle && (
            <div className="flex gap-3">
              <Link
                to={`/u/${profile.handle}`}
                className="rounded-full border border-rose/40 bg-white/70 px-4 py-1.5 text-sm text-rose transition hover:bg-white"
              >
                公開プロフィール
              </Link>
              <Link
                to="/settings/profile"
                className="rounded-full border border-rose/40 bg-white/70 px-4 py-1.5 text-sm text-rose transition hover:bg-white"
              >
                編集
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && <ErrorState error={error} />}

        <div className="mb-8">
          <EndingSoonClips />
        </div>

        <div className="flex border-b border-gray-300 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-4 text-center font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-gold text-navy-dark'
                  : 'border-transparent text-gray-medium hover:text-navy-medium'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'visited' && renderClips(visitedClips)}
        {activeTab === 'want' && renderClips(wantClips)}
        {activeTab === 'reviews' &&
          (reviews.isLoading ? (
            <Loading />
          ) : (reviews.data ?? []).length === 0 ? (
            <Empty>まだレビューがありません。</Empty>
          ) : (
            <div className="max-w-3xl mx-auto">
              <ReviewList reviews={reviews.data ?? []} targetNameOf={nameOf} />
            </div>
          ))}
      </div>
    </div>
  );
}
