import { useState } from 'react';

type StarRatingProps = {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (r: number) => void;
  showCount?: boolean;
  count?: number;
};

export default function StarRating({ rating, size = 'md', interactive = false, onRatingChange, showCount = false, count = 0 }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);
  
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';
  
  const handleStarClick = (idx: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(idx);
    }
  };

  return (
    <div className={`flex items-center ${sizeClass}`}>
      <div className="flex" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
      <span className="ml-1 text-gray-700 font-medium">{rating.toFixed(1)}</span>
      {showCount && <span className="ml-2 text-gray-500 text-sm">({count})</span>}
    </div>
  );
}
