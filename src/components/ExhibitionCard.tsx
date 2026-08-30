import { Link } from 'react-router-dom';
import type { Exhibition } from '../types';
import StarRating from './StarRating';
import GenreTag from './GenreTag';
import PeriodBadge from './PeriodBadge';
import { useRatingOf } from '../hooks/queries';

type ExhibitionCardProps = {
  exhibition: Exhibition;
  museumName?: string;
  variant?: 'horizontal' | 'vertical';
};

export default function ExhibitionCard({ exhibition, museumName, variant = 'vertical' }: ExhibitionCardProps) {
  const { averageRating, reviewCount } = useRatingOf('exhibition', exhibition.id);
  const period = `${exhibition.startDate} - ${exhibition.endDate}`;

  if (variant === 'horizontal') {
    return (
      <Link
        to={`/exhibition/${exhibition.id}`}
        className="block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
      >
        <div className="flex p-4">
          {exhibition.imageUrl && (
            <img
              src={exhibition.imageUrl}
              alt=""
              className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="ml-4 flex flex-col justify-between flex-1 min-w-0">
            <div>
              <h3 className="text-lg font-bold text-navy line-clamp-1">{exhibition.title}</h3>
              {museumName && <p className="text-gray-500 text-sm">{museumName}</p>}
            </div>
            <p className="text-gray-600 text-sm">{period}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} size="sm" showCount count={reviewCount} />
              <PeriodBadge startDate={exhibition.startDate} endDate={exhibition.endDate} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/exhibition/${exhibition.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[16/9] w-full bg-gray-200">
        {exhibition.imageUrl && (
          <img src={exhibition.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
        <div className="absolute left-2 top-2">
          <PeriodBadge startDate={exhibition.startDate} endDate={exhibition.endDate} />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-navy line-clamp-2 mb-1">{exhibition.title}</h3>
        {museumName && <p className="text-gray-500 text-sm mb-2">{museumName}</p>}
        <p className="text-gray-600 text-sm mb-2">{period}</p>

        <div className="mt-auto pt-2">
          <StarRating rating={averageRating} size="sm" showCount count={reviewCount} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {exhibition.genre.map((g) => (
            <GenreTag key={g} genre={g} />
          ))}
        </div>
      </div>
    </Link>
  );
}
