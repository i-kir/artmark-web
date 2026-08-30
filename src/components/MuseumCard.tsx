import { Link } from 'react-router-dom';
import type { Museum } from '../types';
import StarRating from './StarRating';
import { useRatingOf } from '../hooks/queries';

export default function MuseumCard({ museum }: { museum: Museum }) {
  const { averageRating, reviewCount } = useRatingOf('museum', museum.id);

  return (
    <Link
      to={`/museum/${museum.id}`}
      className="block bg-white rounded-xl shadow-sm hover:shadow-md transition p-4"
    >
      <div className="flex items-center">
        {museum.imageUrl && (
          <img
            src={museum.imageUrl}
            alt=""
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="ml-4 flex flex-col min-w-0">
          <h3 className="text-lg font-bold text-navy line-clamp-1">{museum.name}</h3>
          <p className="text-gray-500 text-sm">{museum.area}</p>
          <div className="mt-1">
            <StarRating rating={averageRating} size="sm" showCount count={reviewCount} />
          </div>
        </div>
      </div>
    </Link>
  );
}
