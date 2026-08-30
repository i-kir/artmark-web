import { Link } from 'react-router-dom';
import ReviewList from '../components/ReviewList';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import { useFollowingIds, useTimeline } from '../hooks/queries';
import { useTargetNames } from '../hooks/useTargetNames';

export default function Timeline() {
  const following = useFollowingIds();
  const timeline = useTimeline();
  const { nameOf } = useTargetNames();

  const error = following.error ?? timeline.error;

  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-6 border-l-4 border-gold pl-3 text-2xl font-bold text-navy-dark">タイムライン</h1>

        {error && <ErrorState error={error} />}
        {(following.isLoading || timeline.isLoading) && <Loading />}

        {following.isSuccess && (following.data?.length ?? 0) === 0 && (
          <Empty>
            まだ誰もフォローしていません。
            <br />
            <Link to="/users" className="text-navy-accent underline">
              ユーザーを探す
            </Link>
            からフォローすると、その人のレビューがここに流れます。
          </Empty>
        )}

        {timeline.isSuccess && (timeline.data?.length ?? 0) === 0 && (following.data?.length ?? 0) > 0 && (
          <Empty>フォロー中のユーザーはまだレビューを投稿していません。</Empty>
        )}

        {(timeline.data?.length ?? 0) > 0 && (
          <ReviewList reviews={timeline.data ?? []} targetNameOf={nameOf} />
        )}
      </div>
    </div>
  );
}
