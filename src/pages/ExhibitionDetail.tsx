import { Link, useParams } from 'react-router-dom';
import ClipControl from '../components/ClipControl';
import GenreTag from '../components/GenreTag';
import PeriodBadge from '../components/PeriodBadge';
import ReviewList from '../components/ReviewList';
import SourceNote from '../components/SourceNote';
import StarRating from '../components/StarRating';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import NotFound from './NotFound';
import { useExhibitions, useMuseums, useRatingOf, useTargetReviews } from '../hooks/queries';

export default function ExhibitionDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const exhibitions = useExhibitions();
  const museums = useMuseums();
  const reviews = useTargetReviews('exhibition', id);
  const { averageRating, reviewCount } = useRatingOf('exhibition', id);

  if (exhibitions.error) return <ErrorState error={exhibitions.error} />;
  if (exhibitions.isLoading) return <Loading />;

  const exhibition = exhibitions.data?.find((e) => e.id === id);
  if (!exhibition) return <NotFound />;

  const museum = museums.data?.find((m) => m.id === exhibition.museumId);

  return (
    <div className="bg-gray-light min-h-screen pb-12">
      <div className="w-full h-56 sm:h-96 bg-gray-300">
        {exhibition.imageUrl && <img src={exhibition.imageUrl} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PeriodBadge startDate={exhibition.startDate} endDate={exhibition.endDate} />
              {exhibition.genre.map((g) => (
                <GenreTag key={g} genre={g} />
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-dark leading-tight">{exhibition.title}</h1>
            {museum && (
              <Link to={`/museum/${museum.id}`} className="text-xl text-navy-accent hover:underline block">
                {museum.name}
              </Link>
            )}
            <StarRating rating={averageRating} size="lg" showCount count={reviewCount} />
          </div>
          <ClipControl targetType="exhibition" targetId={exhibition.id} />
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-navy-dark border-b pb-2">展覧会詳細</h2>
          <p className="text-gray-dark leading-relaxed whitespace-pre-wrap">{exhibition.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <p className="font-semibold text-navy-dark">📅 会期</p>
              <p className="text-gray-dark">
                {exhibition.startDate} 〜 {exhibition.endDate}
              </p>
            </div>
            <div>
              <p className="font-semibold text-navy-dark">🎟️ 料金</p>
              <p className="text-gray-dark">{exhibition.price}</p>
            </div>
          </div>
        </div>

        <SourceNote exhibition={exhibition} />

        <section>
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6 border-l-4 border-gold pl-3">
            <h2 className="text-2xl font-bold text-navy-dark">レビュー</h2>
            <Link
              to={`/review/new?targetType=exhibition&targetId=${exhibition.id}`}
              className="bg-gold text-white px-6 py-2 rounded-md font-bold hover:bg-gold-light transition-colors"
            >
              レビューを書く
            </Link>
          </div>
          {reviews.isLoading ? (
            <Loading />
          ) : (reviews.data ?? []).length === 0 ? (
            <Empty>まだレビューがありません。</Empty>
          ) : (
            <ReviewList reviews={reviews.data ?? []} />
          )}
        </section>
      </div>
    </div>
  );
}
