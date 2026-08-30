import { useMemo, useState } from 'react';
import GenreTag from '../components/GenreTag';
import ExhibitionCard from '../components/ExhibitionCard';
import MuseumCard from '../components/MuseumCard';
import { Empty, ErrorState, Loading } from '../components/StateMessage';
import { daysUntil } from '../lib/period';
import { Link } from 'react-router-dom';
import { useExhibitions, useMuseums } from '../hooks/queries';
import { useGeolocation } from '../hooks/useGeolocation';
import LocationButton from '../components/LocationButton';
import { sortByDistance } from '../lib/geo';

const GENRES = ['全て', '西洋画', '日本画', '現代アート', '写真', '彫刻', 'インスタレーション', 'デザイン', '映像'];
const PERIODS = [
  { value: 'all', label: 'すべて' },
  { value: 'ongoing', label: '開催中' },
  { value: 'soon', label: 'まもなく終了' },
  { value: 'upcoming', label: '開催予定' },
] as const;

type Period = (typeof PERIODS)[number]['value'];

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('全て');
  const [period, setPeriod] = useState<Period>('all');
  const [selectedArea, setSelectedArea] = useState('全て');
  const [activeTab, setActiveTab] = useState<'exhibition' | 'museum'>('exhibition');

  const museums = useMuseums();
  const exhibitions = useExhibitions();
  const geo = useGeolocation();
  const error = museums.error ?? exhibitions.error;

  const museumById = useMemo(
    () => new Map((museums.data ?? []).map((m) => [m.id, m])),
    [museums.data]
  );

  const areas = useMemo(
    () => ['全て', ...Array.from(new Set((museums.data ?? []).map((m) => m.area))).sort()],
    [museums.data]
  );

  const filteredExhibitions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (exhibitions.data ?? []).filter((ex) => {
      const museum = museumById.get(ex.museumId);
      const matchSearch =
        !term ||
        ex.title.toLowerCase().includes(term) ||
        (museum?.name.toLowerCase().includes(term) ?? false);
      const matchGenre = selectedGenre === '全て' || ex.genre.includes(selectedGenre);
      const matchArea = selectedArea === '全て' || museum?.area === selectedArea;

      const toStart = daysUntil(ex.startDate);
      const toEnd = daysUntil(ex.endDate);
      const matchPeriod =
        period === 'all' ||
        (period === 'ongoing' && toStart <= 0 && toEnd >= 0) ||
        (period === 'soon' && toStart <= 0 && toEnd >= 0 && toEnd <= 14) ||
        (period === 'upcoming' && toStart > 0);

      return matchSearch && matchGenre && matchArea && matchPeriod;
    });
  }, [exhibitions.data, museumById, searchTerm, selectedGenre, selectedArea, period]);

  const filteredMuseums = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = (museums.data ?? []).filter(
      (m) =>
        (!term || m.name.toLowerCase().includes(term) || m.nameKana.includes(searchTerm.trim())) &&
        (selectedArea === '全て' || m.area === selectedArea)
    );
    // 現在地が取れているときだけ、近い順に並べ替える
    return geo.position
      ? sortByDistance(list, geo.position)
      : list.map((m) => ({ ...m, distanceKm: undefined }));
  }, [museums.data, searchTerm, selectedArea, geo.position]);

  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm space-y-6">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="展覧会名・美術館名で検索..."
              className="w-full rounded-full border border-gray-300 py-3 pl-10 pr-4 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <GenreTag
                key={genre}
                genre={genre}
                active={selectedGenre === genre}
                onClick={() => setSelectedGenre(genre)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="text-sm text-gray-dark">
              エリア
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1"
              >
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-dark">
              会期
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="ml-2 rounded border border-gray-300 px-2 py-1"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeTab === 'museum' && (
            <LocationButton
              status={geo.status}
              message={geo.message}
              onRequest={geo.request}
              onClear={geo.clear}
            />
          )}

          <div className="flex border-b">
            {(['exhibition', 'museum'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab ? 'border-gold text-navy-dark' : 'border-transparent text-gray-medium'
                }`}
              >
                {tab === 'exhibition' ? '展覧会' : '美術館'}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorState error={error} />}
        {(museums.isLoading || exhibitions.isLoading) && <Loading />}

        {activeTab === 'exhibition' && (
          <p className="text-sm text-gray-medium">
            探している展覧会が見つかりませんか？{' '}
            <Link to="/exhibition/new" className="text-navy-accent underline">
              展覧会を登録する
            </Link>
          </p>
        )}

        {activeTab === 'exhibition' ? (
          filteredExhibitions.length === 0 && !exhibitions.isLoading ? (
            <Empty>
              条件に合う展覧会がありませんでした。
              <br />
              <Link to="/exhibition/new" className="text-navy-accent underline">
                展覧会を登録する
              </Link>
              から追加できます。
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExhibitions.map((ex) => (
                <ExhibitionCard key={ex.id} exhibition={ex} museumName={museumById.get(ex.museumId)?.name} />
              ))}
            </div>
          )
        ) : filteredMuseums.length === 0 && !museums.isLoading ? (
          <Empty>条件に合う美術館がありませんでした。</Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMuseums.map((m) => (
              <MuseumCard key={m.id} museum={m} distanceKm={m.distanceKm} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
