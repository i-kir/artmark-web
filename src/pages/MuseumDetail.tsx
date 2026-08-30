import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockMuseums } from '../data/museums';
import { mockExhibitions } from '../data/exhibitions';
import ClipButton from '../components/ClipButton';
import ExhibitionCard from '../components/ExhibitionCard';
import ReviewCard from '../components/ReviewCard';
import { useReviews } from '../contexts/ReviewContext';
import { useClips } from '../contexts/ClipContext';

export default function MuseumDetail() {
  const { id } = useParams<{ id: string }>();
  const { getReviewsForTarget, getAverageRating } = useReviews();
  const { getClipStatus, setClipStatus } = useClips();

  const museum = mockMuseums.find((m) => m.id === id);
  const currentExhibitions = mockExhibitions.filter((e) => e.museumId === id);
  const targetReviews = getReviewsForTarget('museum', id || '');
  const avgRating = getAverageRating('museum', id || '');

  if (!museum) return <div className="p-8 text-center">Museum not found</div>;

  return (
    <div className="bg-gray-light min-h-screen pb-12">
      <div className="w-full h-80 bg-gray-300">
        <img src={museum.imageUrl} alt={museum.name} className="w-full h-full object-cover" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 bg-gray-200 text-sm rounded-full text-gray-dark">{museum.area}</div>
            <h1 className="text-4xl font-bold text-navy-dark">{museum.name}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-xl">⭐</span>
              <span className="text-xl font-bold text-navy-dark">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</span>
              <span className="text-gray-medium text-sm">({targetReviews.length}件のレビュー)</span>
            </div>
          </div>
          <ClipButton status={getClipStatus('museum', museum.id)} onStatusChange={(s) => setClipStatus('museum', museum.id, s)} size="lg" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <span className="mr-1">📍</span>
            <div>
              <p className="font-semibold text-navy-dark">住所</p>
              <p className="text-gray-dark">{museum.address}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="mr-1">🕐</span>
            <div>
              <p className="font-semibold text-navy-dark">営業時間</p>
              <p className="text-gray-dark">{museum.openingHours}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="mr-1">📅</span>
            <div>
              <p className="font-semibold text-navy-dark">休館日</p>
              <p className="text-gray-dark">{museum.closedDays}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="mr-1">🌐</span>
            <div>
              <p className="font-semibold text-navy-dark">Webサイト</p>
              <a href={museum.website} target="_blank" rel="noopener noreferrer" className="text-navy-accent hover:underline break-all">
                {museum.website}
              </a>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-gold pl-3">開催中の展覧会</h2>
          {currentExhibitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentExhibitions.map((ex) => (
                <ExhibitionCard key={ex.id} exhibition={ex} />
              ))}
            </div>
          ) : (
            <p className="text-gray-dark">現在開催中の展覧会はありません。</p>
          )}
        </section>

        <section>
          <div className="flex justify-between items-center mb-6 border-l-4 border-gold pl-3">
            <h2 className="text-2xl font-bold text-navy-dark">レビュー</h2>
            <Link
              to={`/review/new?targetType=museum&targetId=${museum.id}`}
              className="bg-gold text-white px-6 py-2 rounded-md font-bold hover:bg-gold-light transition-colors"
            >
              レビューを書く
            </Link>
          </div>
          <div className="space-y-4">
            {targetReviews.length > 0 ? (
              targetReviews.map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <p className="text-gray-dark">まだレビューがありません。</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
