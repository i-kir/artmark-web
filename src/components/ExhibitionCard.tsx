import { Link } from 'react-router-dom';
import { Exhibition } from '../types';
import StarRating from './StarRating';
import GenreTag from './GenreTag';

type ExhibitionCardProps = {
  exhibition: Exhibition;
  museumName?: string;
  variant?: 'horizontal' | 'vertical';
};

export default function ExhibitionCard({ exhibition, museumName, variant = 'vertical' }: ExhibitionCardProps) {
  if (variant === 'horizontal') {
    return (
      <Link to={`/exhibition/${exhibition.id}`} className="block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
        <div className="flex p-4">
          <img src={exhibition.imageUrl} alt={exhibition.title} className="w-32 h-32 object-cover rounded-lg flex-shrink-0" />
          <div className="ml-4 flex flex-col justify-between flex-1">
            <div>
              <h3 className="text-lg font-bold text-navy line-clamp-1">{exhibition.title}</h3>
              {museumName && <p className="text-gray-500 text-sm">{museumName}</p>}
            </div>
            <p className="text-gray-600 text-sm">{exhibition.startDate} - {exhibition.endDate}</p>
            <StarRating rating={exhibition.averageRating} size="sm" showCount count={exhibition.reviewCount} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/exhibition/${exhibition.id}`} className="block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="relative aspect-[16/9] w-full">
        <img src={exhibition.imageUrl} alt={exhibition.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-navy line-clamp-2 mb-1">{exhibition.title}</h3>
        {museumName && <p className="text-gray-500 text-sm mb-2">{museumName}</p>}
        <p className="text-gray-600 text-sm mb-2">{exhibition.startDate} - {exhibition.endDate}</p>
        
        <div className="mt-auto pt-2 flex items-center justify-between">
          <StarRating rating={exhibition.averageRating} size="sm" showCount count={exhibition.reviewCount} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {exhibition.genre?.map(g => <GenreTag key={g} genre={g} />)}
        </div>
      </div>
    </Link>
  );
}
