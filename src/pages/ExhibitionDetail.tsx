import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockExhibitions } from '../data/exhibitions';
import { mockMuseums } from '../data/museums';
import ClipButton from '../components/ClipButton';
import ReviewCard from '../components/ReviewCard';
import { useReviews } from '../contexts/ReviewContext';
import { useClips } from '../contexts/ClipContext';
import GenreTag from '../components/GenreTag';

export default function ExhibitionDetail() {
  const { id } = useParams<{ id: string }>();
  const { getReviewsForTarget, getAverageRating } = useReviews();
  const { getClipStatus, setClipStatus } = useClips();

  const exhibition = mockExhibitions.find((e) => e.id === id);
  const museum = exhibition ? mockMuseums.find((m) => m.id === exhibition.museumId) : null;
  const targetReviews = getReviewsForTarget('exhibition', id || '');
  const avgRating = getAverageRating('exhibition', id || '');

  if (!exhibition || !museum) return <div className="p-8 text-center">Exhibition not found</div>;

  return (
    <div className="bg-gray-light min-h-screen pb-12">
      <div className="w-full h-96 bg-gray-300">
        <img src={exhibition.imageUrl} alt={exhibition.title} className="w-full h-full object-cover" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap gap-2">
              {exhibition.genre.map((g) => (
                <GenreTag key={g} genre={g} />
              ))}
            </div>
            <h1 className="text-4xl font-bold text-navy-dark leading-tight">{exhibition.title}</h1>
            <Link to={`/museum/${museum.id}`} className="text-xl text-navy-accent hover:underline block">
              {museum.name}
            </Link>
            <div className="flex items-center space-x-3 pt-2">
              <div className="flex items-center">
                <span className="text-xl">⭐</span>
                <span className="text-3xl font-bold text-navy-dark ml-2">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</span>
              </div>
              <span className="text-gray-medium">({targetReviews.length}件のレビュー)</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <ClipButton status={getClipStatus('exhibition', exhibition.id)} onStatusChange={(s) => setClipStatus('exhibition', exhibition.id, s)} size="lg" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-navy-dark border-b pb-2">展覧会詳細</h3>
          <p className="text-gray-dark leading-relaxed whitespace-pre-wrap">{exhibition.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="flex items-start space-x-3">
              <span className="mr-1">📅</span>
              <div>
                <p className="font-semibold text-navy-dark">開催期間</p>
                <p className="text-gray-dark">{exhibition.startDate} 〜 {exhibition.endDate}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-xl">🎟️</span>
              <div>
                <p className="font-semibold text-navy-dark">料金</p>
                <p className="text-gray-dark">{exhibition.price}</p>
              </div>
            </div>
          </div>
        </div>

        <section>
          <div className="flex justify-between items-center mb-6 border-l-4 border-gold pl-3">
            <h2 className="text-2xl font-bold text-navy-dark">レビュー</h2>
            <Link
              to={`/review/new?targetType=exhibition&targetId=${exhibition.id}`}
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
