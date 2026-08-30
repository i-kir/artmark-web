import ExhibitionCard from '../components/ExhibitionCard';
import MuseumCard from '../components/MuseumCard';
import ReviewList from '../components/ReviewList';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import { daysUntil } from '../lib/period';
import { useExhibitions, useLatestReviews, useMuseums, useRatings } from '../hooks/queries';
import { useTargetNames } from '../hooks/useTargetNames';

export default function Home() {
  const museums = useMuseums();
  const exhibitions = useExhibitions();
  const reviews = useLatestReviews(5);
  const ratings = useRatings();

  const error = museums.error ?? exhibitions.error ?? reviews.error ?? ratings.error;
  const isLoading = museums.isLoading || exhibitions.isLoading;

  const ongoing = (exhibitions.data ?? []).filter(
    (e) => daysUntil(e.startDate) <= 0 && daysUntil(e.endDate) >= 0
  );
  const endingSoon = [...ongoing]
    .filter((e) => daysUntil(e.endDate) <= 30)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(0, 6);

  const museumNameById = new Map((museums.data ?? []).map((m) => [m.id, m.name]));
  const { nameOf } = useTargetNames();

  return (
    <div className="min-h-screen pb-12 bg-gray-light">
      <div className="relative h-72 sm:h-96 flex items-center justify-center bg-navy-dark px-4">
        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold text-gold tracking-widest">ArtMark</h1>
          <p className="text-lg sm:text-xl text-white">美術館・展覧会を記録しよう</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-16">
        {error && <ErrorState error={error} />}
        {isLoading && <Loading />}

        {endingSoon.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-red-600 pl-3">
              まもなく終了する展覧会
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
              {endingSoon.map((exhibition) => (
                <div key={exhibition.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
                  <ExhibitionCard exhibition={exhibition} museumName={museumNameById.get(exhibition.museumId)} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-gold pl-3">開催中の展覧会</h2>
          {ongoing.length === 0 && !isLoading ? (
            <Empty>開催中の展覧会はありません。</Empty>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
              {ongoing.slice(0, 10).map((exhibition) => (
                <div key={exhibition.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
                  <ExhibitionCard exhibition={exhibition} museumName={museumNameById.get(exhibition.museumId)} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-gold pl-3">美術館</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(museums.data ?? []).slice(0, 6).map((museum) => (
              <MuseumCard key={museum.id} museum={museum} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-gold pl-3">最新レビュー</h2>
          {reviews.isLoading ? (
            <Loading />
          ) : (reviews.data ?? []).length === 0 ? (
            <Empty>まだレビューがありません。最初の一件を書いてみませんか。</Empty>
          ) : (
            <ReviewList reviews={reviews.data ?? []} targetNameOf={nameOf} />
          )}
        </section>
      </div>
    </div>
  );
}
