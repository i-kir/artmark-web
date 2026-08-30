import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { ErrorState, Loading } from '../components/StateMessage';
import NotFound from './NotFound';
import { useExhibitions, useMuseums, useSaveReview } from '../hooks/queries';
import type { TargetType } from '../types';

export default function ReviewNew() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const saveReview = useSaveReview();

  const targetType: TargetType = searchParams.get('targetType') === 'museum' ? 'museum' : 'exhibition';
  const targetId = searchParams.get('targetId') ?? '';

  const museums = useMuseums();
  const exhibitions = useExhibitions();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [hasSpoiler, setHasSpoiler] = useState(false);

  if (museums.isLoading || exhibitions.isLoading) return <Loading />;

  const target =
    targetType === 'museum'
      ? museums.data?.find((m) => m.id === targetId)
      : exhibitions.data?.find((e) => e.id === targetId);

  if (!target) return <NotFound />;
  const targetName = 'title' in target ? target.title : target.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveReview.mutateAsync({
      targetType,
      targetId,
      rating: rating > 0 ? rating : null,
      comment: comment.trim(),
      visitDate: visitDate || null,
      hasSpoiler,
    });
    navigate(`/${targetType}/${targetId}`, { replace: true });
  };

  // 評価かコメントのどちらかがあれば投稿できる（記録だけ残したい人を弾かない）
  const canSubmit = rating > 0 || comment.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-light py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-navy-dark mb-2">レビューを投稿</h1>
          <p className="text-gray-medium mb-8 pb-4 border-b">
            対象: <span className="font-bold text-navy-dark">{targetName}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-2">評価</label>
              <div className="flex items-center gap-3">
                <StarRating rating={rating} size="lg" interactive showValue={false} onRatingChange={setRating} />
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-xs text-gray-500 underline hover:text-gray-700"
                  >
                    評価を取り消す
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">評価なしで記録だけ残すこともできます。</p>
            </div>

            <div>
              <label htmlFor="visitDate" className="block text-sm font-medium text-gray-dark mb-2">
                訪問日
              </label>
              <input
                id="visitDate"
                type="date"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-dark mb-2">
                コメント
              </label>
              <textarea
                id="comment"
                rows={6}
                placeholder="感想やおすすめポイントを書いてください..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold resize-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <label className="mt-3 flex items-center gap-2 text-sm text-gray-dark">
                <input
                  type="checkbox"
                  checked={hasSpoiler}
                  onChange={(e) => setHasSpoiler(e.target.checked)}
                  className="rounded border-gray-300"
                />
                展示内容のネタバレを含む
              </label>
            </div>

            {saveReview.error && <ErrorState error={saveReview.error} />}

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 text-gray-dark font-medium hover:bg-gray-100 rounded-md transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!canSubmit || saveReview.isPending}
                className="px-6 py-2 bg-gold text-white font-bold rounded-md hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveReview.isPending ? '投稿中...' : '投稿する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
