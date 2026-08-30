import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Review } from '../types';
import StarRating from './StarRating';

type ReviewCardProps = {
  review: Review;
  /** レビュー対象の名称。指定すると対象へのリンクを表示する */
  targetName?: string;
};

export default function ReviewCard({ review, targetName }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false);
  const author = review.author;
  const hidden = review.hasSpoiler && !revealed;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center min-w-0">
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-navy-medium text-white grid place-items-center text-xs">
              {(author?.displayName ?? '?').slice(0, 1)}
            </div>
          )}
          <span className="ml-2 font-medium text-navy text-sm truncate">
            {author?.displayName || author?.handle || '退会したユーザー'}
          </span>
        </div>
        {review.visitDate && <span className="text-gray-400 text-xs shrink-0">{review.visitDate} 訪問</span>}
      </div>

      <div className="mb-2">
        {review.rating === null ? (
          <span className="text-xs text-gray-500">記録のみ（評価なし）</span>
        ) : (
          <StarRating rating={review.rating} size="sm" />
        )}
      </div>

      {hidden ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="w-full rounded bg-gray-100 py-3 text-sm text-gray-600 hover:bg-gray-200 transition"
        >
          このレビューはネタバレを含みます（クリックで表示）
        </button>
      ) : (
        review.comment && <p className="text-gray-600 text-sm whitespace-pre-wrap">{review.comment}</p>
      )}

      {targetName && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link
            to={`/${review.targetType}/${review.targetId}`}
            className="text-gold hover:underline text-sm font-medium"
          >
            {targetName}
          </Link>
        </div>
      )}
    </div>
  );
}
