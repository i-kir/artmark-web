import { Link } from 'react-router-dom';
import { Museum } from '../types';
import StarRating from './StarRating';

type MuseumCardProps = {
  museum: Museum;
};

export default function MuseumCard({ museum }: MuseumCardProps) {
  return (
    <Link to={`/museum/${museum.id}`} className="block bg-white rounded-xl shadow-sm hover:shadow-md transition p-4">
      <div className="flex items-center">
        <img src={museum.imageUrl} alt={museum.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
        <div className="ml-4 flex flex-col">
          <h3 className="text-lg font-bold text-navy line-clamp-1">{museum.name}</h3>
          <p className="text-gray-500 text-sm">{museum.area}</p>
          <div className="mt-1">
            <StarRating rating={museum.averageRating} size="sm" showCount count={museum.reviewCount} />
          </div>
        </div>
      </div>
    </Link>
  );
}
