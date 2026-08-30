import { Link } from 'react-router-dom';
import ExhibitionCard from '../components/ExhibitionCard';
import MuseumCard from '../components/MuseumCard';
import ReviewList from '../components/ReviewList';
import EndingSoonClips from '../components/EndingSoonClips';
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
    <div className="min-h-screen bg-cream pb-16">
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-tint via-cream to-sand/60 px-4 py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-soft/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-sand/50 blur-3xl"
        />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-medium tracking-[0.35em] text-rose">ART REVIEW</p>
          <h1 className="font-serif text-3xl font-semibold leading-snug text-navy sm:text-5xl">
            気になる展覧会を、
            <br className="hidden sm:block" />
            そっと集めておく。
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-gray-dark sm:text-base">
            美術館と展覧会をさがして、「行きたい」「行った」を記録。
            心が動いた感想をシェアできる、あなたのアート手帖。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/search"
              className="rounded-full bg-rose px-7 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-rose-soft"
            >
              展覧会をさがす
            </Link>
            <Link
              to="/users"
              className="rounded-full border border-rose/40 bg-white/70 px-7 py-3 text-sm font-bold text-rose transition hover:bg-white"
            >
              みんなの記録を見る
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-6xl space-y-16 px-4">
        {error && <ErrorState error={error} />}
        {isLoading && <Loading />}

        <EndingSoonClips />

        {endingSoon.length > 0 && (
          <section>
            <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold text-navy before:h-5 before:w-1 before:rounded-full before:bg-red-500 before:content-['']">
              まもなく終了する展覧会
            </h2>
            <div className="no-scrollbar flex snap-x gap-6 overflow-x-auto pb-4">
              {endingSoon.map((exhibition) => (
                <div key={exhibition.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
                  <ExhibitionCard exhibition={exhibition} museumName={museumNameById.get(exhibition.museumId)} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold text-navy before:h-5 before:w-1 before:rounded-full before:bg-rose before:content-['']">開催中の展覧会</h2>
          {ongoing.length === 0 && !isLoading ? (
            <Empty>開催中の展覧会はありません。</Empty>
          ) : (
            <div className="no-scrollbar flex snap-x gap-6 overflow-x-auto pb-4">
              {ongoing.slice(0, 10).map((exhibition) => (
                <div key={exhibition.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
                  <ExhibitionCard exhibition={exhibition} museumName={museumNameById.get(exhibition.museumId)} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold text-navy before:h-5 before:w-1 before:rounded-full before:bg-rose before:content-['']">美術館</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(museums.data ?? []).slice(0, 6).map((museum) => (
              <MuseumCard key={museum.id} museum={museum} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold text-navy before:h-5 before:w-1 before:rounded-full before:bg-rose before:content-['']">最新レビュー</h2>
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
