import { daysUntil } from '../lib/period';

/** 展覧会は「もう観られなくなる」ことが行動の引き金になるので、残り日数を目立たせる */
export default function PeriodBadge({ startDate, endDate }: { startDate: string; endDate: string }) {
  const remaining = daysUntil(endDate);
  const started = daysUntil(startDate) <= 0;

  if (remaining < 0) {
    return <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">会期終了</span>;
  }
  if (!started) {
    return <span className="rounded-full bg-navy-accent px-2 py-0.5 text-xs text-white">開催予定</span>;
  }
  if (remaining <= 7) {
    return (
      <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
        {remaining === 0 ? '本日まで' : `残り${remaining}日`}
      </span>
    );
  }
  if (remaining <= 30) {
    return <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy">残り{remaining}日</span>;
  }
  return <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs text-white">開催中</span>;
}
