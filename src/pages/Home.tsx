import React from 'react';
import ExhibitionCard from '../components/ExhibitionCard';
import MuseumCard from '../components/MuseumCard';
import ReviewCard from '../components/ReviewCard';
import { mockExhibitions } from '../data/exhibitions';
import { mockMuseums } from '../data/museums';
import { mockReviews } from '../data/reviews';

export default function Home() {
  const topExhibitions = mockExhibitions.slice(0, 6);
  const topMuseums = mockMuseums.slice(0, 6);
  const latestReviews = mockReviews.slice(0, 5);

  return (
    <div className="min-h-screen pb-12 bg-gray-light">
      <div className="relative h-96 flex items-center justify-center bg-navy-dark">
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-full h-full bg-navy opacity-80" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-6xl font-bold text-gold tracking-widest">ArtMark</h1>
          <p className="text-xl text-white">美術館・展覧会を記録しよう</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-16">
        <section>
          <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-gold pl-3">注目の展覧会</h2>
          <div className="flex overflow-x-auto space-x-6 pb-4 snap-x">
            {topExhibitions.map((exhibition) => (
              <div key={exhibition.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
                <ExhibitionCard exhibition={exhibition} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-gold pl-3">人気の美術館</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topMuseums.map((museum) => (
              <MuseumCard key={museum.id} museum={museum} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy-dark mb-6 border-l-4 border-gold pl-3">最新レビュー</h2>
          <div className="space-y-4">
            {latestReviews.map((review) => (
              <ReviewCard key={review.id} review={review} showTarget={true} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
