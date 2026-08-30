import { Link } from 'react-router-dom';
import { useExhibitions, useMyClips } from '../hooks/queries';
import { daysUntil } from '../lib/period';

const WARNING_DAYS = 14;

/**
 * 「行きたい」に入れたまま会期が終わりそうな展覧会を知らせる。
 * 展覧会は数週間で消えるため、ここが ArtMark で一番役に立つ通知になる。
 */
export default function EndingSoonClips({ compact = false }: { compact?: boolean }) {
  const clips = useMyClips();
  const exhibitions = useExhibitions();

  const wantIds = new Set(
    (clips.data ?? []).filter((c) => c.status === 'want' && c.targetType === 'exhibition').map((c) => c.targetId)
  );

  const endingSoon = (exhibitions.data ?? [])
    .filter((e) => wantIds.has(e.id))
    .map((e) => ({ exhibition: e, remaining: daysUntil(e.endDate) }))
    .filter(({ remaining }) => remaining >= 0 && remaining <= WARNING_DAYS)
    .sort((a, b) => a.remaining - b.remaining);

  if (endingSoon.length === 0) return null;

  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h2 className="mb-3 font-bold text-red-800">
        行きたい展覧会が、まもなく終了します（{endingSoon.length}件）
      </h2>
      <ul className={compact ? 'space-y-1' : 'space-y-2'}>
        {endingSoon.map(({ exhibition, remaining }) => (
          <li key={exhibition.id} className="flex items-baseline gap-3">
            <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              {remaining === 0 ? '本日まで' : `残り${remaining}日`}
            </span>
            <Link
              to={`/exhibition/${exhibition.id}`}
              className="truncate text-sm text-navy hover:underline"
            >
              {exhibition.title}
            </Link>
            <span className="shrink-0 text-xs text-gray-medium">〜{exhibition.endDate}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
