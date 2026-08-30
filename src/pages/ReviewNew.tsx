import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReviews } from '../contexts/ReviewContext';
import StarRating from '../components/StarRating';
import { mockExhibitions } from '../data/exhibitions';
import { mockMuseums } from '../data/museums';

export default function ReviewNew() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addReview } = useReviews();

  const targetType = searchParams.get('targetType') as 'museum' | 'exhibition';
  const targetId = searchParams.get('targetId') || '';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [visitDate, setVisitDate] = useState('');

  const target = targetType === 'museum'
    ? mockMuseums.find(m => m.id === targetId)
    : mockExhibitions.find(e => e.id === targetId);

  const targetName = target
    ? (targetType === 'museum' ? (target as any).name : (target as any).title)
    : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !comment || !visitDate || !target) return;

    addReview({
      id: `r_${Date.now()}`,
      targetId,
      targetType,
      rating,
      comment,
      visitDate,
      userId: 'guest-1',
      userName: 'ゲストユーザー',
      userAvatar: 'https://picsum.photos/seed/guest/100/100',
      targetName,
      createdAt: new Date().toISOString(),
    });

    navigate(-1);
  };

  if (!target) return <div className="p-8 text-center">対象が見つかりません</div>;

  return (
    <div className="min-h-screen bg-gray-light py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-navy-dark mb-2">レビューを投稿</h1>
          <p className="text-gray-medium mb-8 pb-4 border-b">
            対象: <span className="font-bold text-navy-dark">{targetName}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-2">評価 <span className="text-red-500">*</span></label>
              <span className="text-xl">⭐</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark mb-2">訪問日 <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-dark mb-2">コメント <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={6}
                placeholder="感想やおすすめポイントを書いてください..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold resize-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 text-gray-dark font-medium hover:bg-gray-100 rounded-md transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!rating || !comment || !visitDate}
                className="px-6 py-2 bg-gold text-white font-bold rounded-md hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                投稿する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
