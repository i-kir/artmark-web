import { Link } from 'react-router-dom';

export default function TagChip({ tag }: { tag: string }) {
  return (
    <Link
      to={`/tag/${encodeURIComponent(tag)}`}
      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-navy-accent hover:bg-gray-200 transition"
    >
      #{tag}
    </Link>
  );
}
