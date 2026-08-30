import { Link } from 'react-router-dom';
import type { Museum } from '../types';
import StarRating from './StarRating';
import { useRatingOf } from '../hooks/queries';
import { formatDistance } from '../lib/geo';

export default function MuseumCard({
  museum,
  distanceKm,
}: {
  museum: Museum;
  /** 現在地からの距離。指定すると住所の代わりに表示する */
  distanceKm?: number;
}) {
  const { averageRating, reviewCount } = useRatingOf('museum', museum.id);

  return (
    <Link
      to={`/museum/${museum.id}`}
      className="block rounded-2xl bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="flex items-center">
        {museum.imageUrl && (
          <img
            src={museum.imageUrl}
            alt=""
            className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        )}
        <div className="ml-4 flex flex-col min-w-0">
          <h3 className="font-serif text-lg font-semibold text-navy line-clamp-1">{museum.name}</h3>
          <p className="text-gray-500 text-sm">
            {museum.area}
            {distanceKm !== undefined && (
              <span className="ml-2 font-medium text-navy-accent">{formatDistance(distanceKm)}</span>
            )}
          </p>
          <div className="mt-1">
            <StarRating rating={averageRating} size="sm" showCount count={reviewCount} />
          </div>
        </div>
      </div>
    </Link>
  );
}
