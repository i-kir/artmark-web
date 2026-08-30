import { supabase } from '../lib/supabase';

export type ExhibitionInput = {
  museumId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  price: string;
  imageUrl: string | null;
  officialUrl: string | null;
  genre: string[];
};

/** 同じ館・同じ開始日・同じタイトルの重複を避けるための ID */
function makeId(input: ExhibitionInput): string {
  let h = 0;
  for (let i = 0; i < input.title.length; i++) h = (Math.imul(31, h) + input.title.charCodeAt(i)) | 0;
  return `us_${input.museumId}_${input.startDate}_${(h >>> 0).toString(36)}`;
}

async function replaceGenres(exhibitionId: string, genres: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('exhibition_genres')
    .delete()
    .eq('exhibition_id', exhibitionId);
  if (deleteError) throw deleteError;

  const unique = Array.from(new Set(genres.map((g) => g.trim()).filter(Boolean)));
  if (unique.length === 0) return;

  const { error } = await supabase
    .from('exhibition_genres')
    .insert(unique.map((genre) => ({ exhibition_id: exhibitionId, genre })));
  if (error) throw error;
}

export async function createExhibition(userId: string, input: ExhibitionInput): Promise<string> {
  const id = makeId(input);
  const { error } = await supabase.from('exhibitions').insert({
    id,
    museum_id: input.museumId,
    title: input.title,
    description: input.description,
    start_date: input.startDate,
    end_date: input.endDate,
    price: input.price,
    image_url: input.imageUrl,
    official_url: input.officialUrl,
    source: 'user',
    created_by: userId,
  });
  if (error) throw error;

  await replaceGenres(id, input.genre);
  return id;
}

export async function updateExhibition(id: string, input: ExhibitionInput): Promise<void> {
  const { error } = await supabase
    .from('exhibitions')
    .update({
      museum_id: input.museumId,
      title: input.title,
      description: input.description,
      start_date: input.startDate,
      end_date: input.endDate,
      price: input.price,
      image_url: input.imageUrl,
      official_url: input.officialUrl,
    })
    .eq('id', id);
  if (error) throw error;

  await replaceGenres(id, input.genre);
}
