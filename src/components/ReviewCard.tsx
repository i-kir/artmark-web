import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Review } from '../types';
import StarRating from './StarRating';
import Avatar from './Avatar';
import TagChip from './TagChip';
import CommentSection from './CommentSection';
import { useAuth } from '../contexts/AuthContext';
import { useMyLikes, useSetLike } from '../hooks/queries';

type ReviewCardProps = {
  review: Review;
  /** レビュー対象の名称。指定すると対象へのリンクを表示する */
  targetName?: string;
};

export default function ReviewCard({ review, targetName }: ReviewCardProps) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const myLikes = useMyLikes();
  const setLike = useSetLike();
  const liked = Boolean(myLikes.data?.includes(review.id));

  const author = review.author;
  const hidden = review.hasSpoiler && !revealed;

  const handleLike = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    setLike.mutate({ reviewId: review.id, liked: !liked });
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar author={author} size="sm" />
          {author ? (
            <Link to={`/u/${author.handle}`} className="truncate text-sm font-medium text-navy hover:underline">
              {author.displayName || author.handle}
            </Link>
          ) : (
            <span className="truncate text-sm text-gray-500">退会したユーザー</span>
          )}
        </div>
        {review.visitDate && <span className="shrink-0 text-xs text-gray-400">{review.visitDate} 訪問</span>}
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
          className="w-full rounded bg-gray-100 py-3 text-sm text-gray-600 transition hover:bg-gray-200"
        >
          このレビューはネタバレを含みます（クリックで表示）
        </button>
      ) : (
        review.comment && <p className="whitespace-pre-wrap text-sm text-gray-600">{review.comment}</p>
      )}

      {review.tags.length > 0 && !hidden && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={handleLike}
          disabled={setLike.isPending}
          className={`flex items-center gap-1 transition ${
            liked ? 'font-bold text-gold' : 'text-gray-500 hover:text-gold'
          }`}
        >
          <span>{liked ? '♥' : '♡'}</span>
          <span>いいね</span>
          {review.likeCount > 0 && <span>{review.likeCount}</span>}
        </button>

        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-gray-500 transition hover:text-navy"
        >
          <span>💬</span>
          <span>コメント</span>
          {review.commentCount > 0 && <span>{review.commentCount}</span>}
        </button>
      </div>

      {showComments && <CommentSection reviewId={review.id} />}

      {targetName && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <Link
            to={`/${review.targetType}/${review.targetId}`}
            className="text-sm font-medium text-gold hover:underline"
          >
            {targetName}
          </Link>
        </div>
      )}
    </div>
  );
}
