import { useParams } from 'react-router-dom';
import ReviewList from '../components/ReviewList';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import { useReviewsByTag } from '../hooks/queries';
import { useTargetNames } from '../hooks/useTargetNames';

export default function Tag() {
  const { tag = '' } = useParams<{ tag: string }>();
  const reviews = useReviewsByTag(tag);
  const { nameOf } = useTargetNames();

  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-6 border-l-4 border-gold pl-3 text-2xl font-bold text-navy-dark">#{tag}</h1>

        {reviews.error && <ErrorState error={reviews.error} />}
        {reviews.isLoading && <Loading />}
        {reviews.isSuccess &&
          ((reviews.data ?? []).length === 0 ? (
            <Empty>このタグのレビューはまだありません。</Empty>
          ) : (
            <ReviewList reviews={reviews.data ?? []} targetNameOf={nameOf} />
          ))}
      </div>
    </div>
  );
}
