import { Link } from 'react-router-dom';
import { Review } from '../types';
import StarRating from './StarRating';

type ReviewCardProps = {
  review: Review;
  showTarget?: boolean;
};

export default function ReviewCard({ review, showTarget = false }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <img src={review.userAvatar} alt={review.userName} className="w-8 h-8 rounded-full object-cover" />
          <span className="ml-2 font-medium text-navy text-sm">{review.userName}</span>
        </div>
        <span className="text-gray-400 text-xs">{review.visitDate}</span>
      </div>
      
      <div className="mb-2">
        <StarRating rating={review.rating} size="sm" />
      </div>
      
      <p className="text-gray-600 text-sm line-clamp-3">{review.comment}</p>
      
      {showTarget && review.targetId && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link to={`/${review.targetType}/${review.targetId}`} className="text-gold hover:underline text-sm font-medium">
            {review.targetName}
          </Link>
        </div>
      )}
    </div>
  );
}
