import { useMemo, useState } from 'react';
import MuseumMap from '../components/MuseumMap';
import MuseumCard from '../components/MuseumCard';
import LocationButton from '../components/LocationButton';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import { useExhibitions, useMuseums } from '../hooks/queries';
import { useGeolocation } from '../hooks/useGeolocation';
import { daysUntil } from '../lib/period';
import { sortByDistance } from '../lib/geo';

export default function MapPage() {
  const museums = useMuseums();
  const exhibitions = useExhibitions();
  const geo = useGeolocation();
  const [onlyOngoing, setOnlyOngoing] = useState(false);

  const error = museums.error ?? exhibitions.error;

  const museumIdsWithOngoing = useMemo(() => {
    const set = new Set<string>();
    for (const e of exhibitions.data ?? []) {
      if (daysUntil(e.startDate) <= 0 && daysUntil(e.endDate) >= 0) set.add(e.museumId);
    }
    return set;
  }, [exhibitions.data]);

  const visible = useMemo(() => {
    const list = (museums.data ?? []).filter((m) => !onlyOngoing || museumIdsWithOngoing.has(m.id));
    return geo.position ? sortByDistance(list, geo.position) : list.map((m) => ({ ...m, distanceKm: undefined }));
  }, [museums.data, onlyOngoing, museumIdsWithOngoing, geo.position]);

  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <h1 className="border-l-4 border-gold pl-3 text-2xl font-bold text-navy-dark">地図から探す</h1>

        <div className="flex flex-wrap items-center gap-4">
          <LocationButton
            status={geo.status}
            message={geo.message}
            onRequest={geo.request}
            onClear={geo.clear}
          />
          <label className="flex items-center gap-2 text-sm text-gray-dark">
            <input
              type="checkbox"
              checked={onlyOngoing}
              onChange={(e) => setOnlyOngoing(e.target.checked)}
              className="rounded border-gray-300"
            />
            開催中の展覧会がある美術館のみ
          </label>
        </div>

        {error && <ErrorState error={error} />}
        {museums.isLoading ? (
          <Loading />
        ) : (
          <>
            <MuseumMap
              museums={visible}
              myPosition={geo.position}
              center={geo.position ?? undefined}
              zoom={geo.position ? 10 : 5}
            />

            <div>
              <h2 className="mb-4 text-lg font-bold text-navy-dark">
                {geo.position ? '現在地から近い順' : '美術館一覧'}
                <span className="ml-2 text-sm font-normal text-gray-medium">{visible.length}件</span>
              </h2>
              {visible.length === 0 ? (
                <Empty>条件に合う美術館がありません。</Empty>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visible.map((museum) => (
                    <MuseumCard key={museum.id} museum={museum} distanceKm={museum.distanceKm} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
