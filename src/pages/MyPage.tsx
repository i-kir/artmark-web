import React, { useState } from 'react';
import { useClips, type ClipKey } from '../contexts/ClipContext';
import { useReviews } from '../contexts/ReviewContext';
import ExhibitionCard from '../components/ExhibitionCard';
import MuseumCard from '../components/MuseumCard';
import ReviewCard from '../components/ReviewCard';
import { mockExhibitions } from '../data/exhibitions';
import { mockMuseums } from '../data/museums';

type Tab = 'visited' | 'want' | 'reviews';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('visited');
  const { getClipsByStatus } = useClips();
  const { reviews } = useReviews();

  const visitedClips = getClipsByStatus('visited');
  const wantToGoClips = getClipsByStatus('want');

  const getTarget = (targetType: string, targetId: string) => {
    if (targetType === 'museum') return mockMuseums.find((m) => m.id === targetId);
    return mockExhibitions.find((e) => e.id === targetId);
  };

  const renderClips = (clips: ClipKey[]) => {
    if (clips.length === 0) return <div className="text-center py-12 text-gray-dark">まだ記録がありません。</div>;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clips.map((clip) => {
          const target = getTarget(clip.targetType, clip.targetId);
          if (!target) return null;
          const key = `${clip.targetType}_${clip.targetId}`;
          return 'title' in target ? (
            <ExhibitionCard key={key} exhibition={target} />
          ) : (
            <MuseumCard key={key} museum={target} />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-light">
      <div className="bg-navy-dark text-white pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-navy-medium rounded-full flex items-center justify-center border-2 border-gold">
            <span className="mr-1">👤</span>
          </div>
          <h1 className="text-2xl font-bold">ゲストユーザー</h1>
          
          <div className="flex gap-8 mt-6 bg-navy-medium px-8 py-4 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-400">行った</div>
              <div className="text-xl font-bold text-gold">{visitedClips.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">行きたい</div>
              <div className="text-xl font-bold text-gold">{wantToGoClips.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">レビュー</div>
              <div className="text-xl font-bold text-gold">{reviews.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex border-b border-gray-300 mb-8">
          <button
            className={`flex-1 py-4 text-center font-medium border-b-2 transition-colors ${activeTab === 'visited' ? 'border-gold text-navy-dark' : 'border-transparent text-gray-medium hover:text-navy-medium'}`}
            onClick={() => setActiveTab('visited')}
          >
            行った
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium border-b-2 transition-colors ${activeTab === 'want' ? 'border-gold text-navy-dark' : 'border-transparent text-gray-medium hover:text-navy-medium'}`}
            onClick={() => setActiveTab('want')}
          >
            行きたい
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-gold text-navy-dark' : 'border-transparent text-gray-medium hover:text-navy-medium'}`}
            onClick={() => setActiveTab('reviews')}
          >
            レビュー
          </button>
        </div>

        <div>
          {activeTab === 'visited' && renderClips(visitedClips)}
          {activeTab === 'want' && renderClips(wantToGoClips)}
          {activeTab === 'reviews' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-dark">まだレビューがありません。</div>
              ) : (
                reviews.map((review) => <ReviewCard key={review.id} review={review} showTarget={true} />)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
