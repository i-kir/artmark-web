import { supabase } from '../lib/supabase';
import type { Exhibition, Museum } from '../types';

type MuseumRow = {
  id: string;
  name: string;
  name_kana: string;
  address: string;
  prefecture: string;
  area: string;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  description: string;
  opening_hours: string;
  closed_days: string;
  website: string | null;
};

type ExhibitionRow = {
  id: string;
  museum_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  price: string;
  image_url: string | null;
  official_url: string | null;
  exhibition_genres: { genre: string }[] | null;
};

const toMuseum = (r: MuseumRow): Museum => ({
  id: r.id,
  name: r.name,
  nameKana: r.name_kana,
  address: r.address,
  prefecture: r.prefecture,
  area: r.area,
  lat: r.lat,
  lng: r.lng,
  imageUrl: r.image_url,
  description: r.description,
  openingHours: r.opening_hours,
  closedDays: r.closed_days,
  website: r.website,
});

const toExhibition = (r: ExhibitionRow): Exhibition => ({
  id: r.id,
  museumId: r.museum_id,
  title: r.title,
  description: r.description,
  startDate: r.start_date,
  endDate: r.end_date,
  price: r.price,
  imageUrl: r.image_url,
  officialUrl: r.official_url,
  genre: (r.exhibition_genres ?? []).map((g) => g.genre),
});

export async function fetchMuseums(): Promise<Museum[]> {
  const { data, error } = await supabase.from('museums').select('*').order('name');
  if (error) throw error;
  return (data as MuseumRow[]).map(toMuseum);
}

export async function fetchExhibitions(): Promise<Exhibition[]> {
  const { data, error } = await supabase
    .from('exhibitions')
    .select('*, exhibition_genres(genre)')
    .order('end_date');
  if (error) throw error;
  return (data as ExhibitionRow[]).map(toExhibition);
}
