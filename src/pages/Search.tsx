import React, { useState, useMemo } from 'react';
import GenreTag from '../components/GenreTag';
import ExhibitionCard from '../components/ExhibitionCard';
import MuseumCard from '../components/MuseumCard';
import { mockExhibitions } from '../data/exhibitions';
import { mockMuseums } from '../data/museums';

const GENRES: string[] = ['全て', '西洋画', '日本画', '現代アート', '写真', '彫刻', 'インスタレーション', 'デザイン'];

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('全て');
  const [activeTab, setActiveTab] = useState<'exhibition' | 'museum'>('exhibition');

  const filteredExhibitions = useMemo(() => {
    return mockExhibitions.filter((ex) => {
      const matchSearch = ex.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGenre = selectedGenre === '全て' || ex.genre.includes(selectedGenre as any);
      return matchSearch && matchGenre;
    });
  }, [searchTerm, selectedGenre]);

  const filteredMuseums = useMemo(() => {
    return mockMuseums.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-xl">🔍</span>
            </div>
            <input
              type="text"
              placeholder="キーワードで検索..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-medium focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <GenreTag
                key={genre}
                genre={genre}
                onClick={() => setSelectedGenre(genre)}
                active={selectedGenre === genre}
              />
            ))}
          </div>

          <div className="flex border-b border-gray-200">
            <button
              className={`pb-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'exhibition' ? 'border-gold text-navy-dark' : 'border-transparent text-gray-medium hover:text-navy-medium'
              }`}
              onClick={() => setActiveTab('exhibition')}
            >
              展覧会
            </button>
            <button
              className={`pb-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'museum' ? 'border-gold text-navy-dark' : 'border-transparent text-gray-medium hover:text-navy-medium'
              }`}
              onClick={() => setActiveTab('museum')}
            >
              美術館
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'exhibition' &&
            filteredExhibitions.map((ex) => <ExhibitionCard key={ex.id} exhibition={ex} />)}
          {activeTab === 'museum' &&
            filteredMuseums.map((m) => <MuseumCard key={m.id} museum={m} />)}
        </div>

        {activeTab === 'exhibition' && filteredExhibitions.length === 0 && (
          <div className="text-center py-12 text-gray-dark">条件に一致する展覧会がありません。</div>
        )}
        {activeTab === 'museum' && filteredMuseums.length === 0 && (
          <div className="text-center py-12 text-gray-dark">条件に一致する美術館がありません。</div>
        )}
      </div>
    </div>
  );
};
