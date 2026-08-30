import { useState } from 'react';
import type { Review } from '../types';
import ReviewCard from './ReviewCard';
import { Empty } from './StateMessage';

const FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'safe', label: 'ネタバレなし' },
  { value: 'spoiler', label: 'ネタバレ' },
] as const;

type Filter = (typeof FILTERS)[number]['value'];

/** Filmarks と同じく、ネタバレの有無で読み分けられるようにする */
export default function ReviewList({
  reviews,
  targetNameOf,
}: {
  reviews: Review[];
  targetNameOf?: (review: Review) => string | undefined;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = reviews.filter((r) =>
    filter === 'all' ? true : filter === 'spoiler' ? r.hasSpoiler : !r.hasSpoiler
  );

  return (
    <div className="space-y-4">
      {reviews.some((r) => r.hasSpoiler) && (
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                filter === f.value ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty>該当するレビューはありません。</Empty>
      ) : (
        filtered.map((review) => (
          <ReviewCard key={review.id} review={review} targetName={targetNameOf?.(review)} />
        ))
      )}
    </div>
  );
}
