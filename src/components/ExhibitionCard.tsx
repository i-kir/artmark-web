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
        className="block overflow-hidden rounded-2xl bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-soft"
      >
        <div className="flex p-4">
          {exhibition.imageUrl && (
            <img
              src={exhibition.imageUrl}
              alt=""
              className="h-32 w-32 flex-shrink-0 rounded-xl object-cover"
              loading="lazy"
            />
          )}
          <div className="ml-4 flex flex-col justify-between flex-1 min-w-0">
            <div>
              <h3 className="font-serif text-lg font-semibold text-navy line-clamp-1">{exhibition.title}</h3>
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
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="relative aspect-[16/9] w-full bg-sand/50">
        {exhibition.imageUrl && (
          <img src={exhibition.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
        <div className="absolute left-2 top-2">
          <PeriodBadge startDate={exhibition.startDate} endDate={exhibition.endDate} />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="mb-1 font-serif text-lg font-semibold text-navy line-clamp-2">{exhibition.title}</h3>
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
