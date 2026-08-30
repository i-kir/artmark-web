import { Link, useParams } from 'react-router-dom';
import ClipControl from '../components/ClipControl';
import ExhibitionCard from '../components/ExhibitionCard';
import ReviewList from '../components/ReviewList';
import StarRating from '../components/StarRating';
import MuseumMap from '../components/MuseumMap';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import NotFound from './NotFound';
import { useExhibitions, useMuseums, useRatingOf, useTargetReviews } from '../hooks/queries';

export default function MuseumDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const museums = useMuseums();
  const exhibitions = useExhibitions();
  const reviews = useTargetReviews('museum', id);
  const { averageRating, reviewCount } = useRatingOf('museum', id);

  if (museums.error) return <ErrorState error={museums.error} />;
  if (museums.isLoading) return <Loading />;

  const museum = museums.data?.find((m) => m.id === id);
  if (!museum) return <NotFound />;

  const relatedExhibitions = (exhibitions.data ?? []).filter((e) => e.museumId === museum.id);

  return (
    <div className="bg-gray-light min-h-screen pb-12">
      <div className="w-full h-56 sm:h-80 bg-gray-300">
        {museum.imageUrl && <img src={museum.imageUrl} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 bg-gray-200 text-sm rounded-full text-gray-dark">{museum.area}</div>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-dark">{museum.name}</h1>
            <div className="flex items-center gap-3">
              <StarRating rating={averageRating} size="lg" showCount count={reviewCount} />
            </div>
          </div>
          <ClipControl targetType="museum" targetId={museum.id} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-navy-dark">📍 住所</p>
            <p className="text-gray-dark">{museum.address}</p>
          </div>
          <div>
            <p className="font-semibold text-navy-dark">🕐 開館時間</p>
            <p className="text-gray-dark">{museum.openingHours}</p>
          </div>
          <div>
            <p className="font-semibold text-navy-dark">📅 休館日</p>
            <p className="text-gray-dark">{museum.closedDays}</p>
          </div>
          {museum.website && (
            <div className="min-w-0">
              <p className="font-semibold text-navy-dark">🌐 Webサイト</p>
              <a
                href={museum.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-accent hover:underline break-all"
              >
                {museum.website}
              </a>
            </div>
          )}
        </div>

        {museum.description && (
          <p className="text-gray-dark leading-relaxed whitespace-pre-wrap">{museum.description}</p>
        )}

        {museum.lat !== null && museum.lng !== null && (
          <section>
            <h2 className="mb-4 border-l-4 border-gold pl-3 text-2xl font-bold text-navy-dark">場所</h2>
            <MuseumMap
              museums={[museum]}
              center={{ lat: museum.lat, lng: museum.lng }}
              zoom={16}
              className="h-72 w-full overflow-hidden rounded-xl"
            />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${museum.lat},${museum.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-navy-accent hover:underline"
            >
              Google マップで経路を調べる
            </a>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-gold pl-3">この美術館の展覧会</h2>
          {relatedExhibitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedExhibitions.map((ex) => (
                <ExhibitionCard key={ex.id} exhibition={ex} />
              ))}
            </div>
          ) : (
            <Empty>登録されている展覧会はありません。</Empty>
          )}
        </section>

        <section>
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6 border-l-4 border-gold pl-3">
            <h2 className="text-2xl font-bold text-navy-dark">レビュー</h2>
            <Link
              to={`/review/new?targetType=museum&targetId=${museum.id}`}
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
