import type { Author } from '../types';

const SIZES = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-base', lg: 'w-24 h-24 text-3xl' } as const;

export default function Avatar({
  author,
  size = 'sm',
}: {
  author: Pick<Author, 'displayName' | 'avatarUrl'> | null;
  size?: keyof typeof SIZES;
}) {
  const className = `${SIZES[size]} rounded-full object-cover shrink-0`;

  if (author?.avatarUrl) {
    return <img src={author.avatarUrl} alt="" className={className} loading="lazy" />;
  }
  return (
    <div className={`${SIZES[size]} rounded-full bg-navy-medium text-white grid place-items-center shrink-0`}>
      {(author?.displayName ?? '?').slice(0, 1).toUpperCase()}
    </div>
  );
}
