import { supabase } from '../lib/supabase';
import type { Rating, TargetType } from '../types';

type RatingRow = {
  target_type: TargetType;
  target_id: string;
  average_rating: number | null;
  review_count: number;
};

export type RatingMap = Record<string, Rating>;

export const ratingKey = (targetType: TargetType, targetId: string) => `${targetType}:${targetId}`;

/** 平均スコアは保持せず、常にレビューから集計したビューを読む */
export async function fetchRatings(): Promise<RatingMap> {
  const { data, error } = await supabase
    .from('target_ratings')
    .select('target_type, target_id, average_rating, review_count');
  if (error) throw error;

  const map: RatingMap = {};
  for (const row of data as RatingRow[]) {
    map[ratingKey(row.target_type, row.target_id)] = {
      averageRating: row.average_rating ?? 0,
      reviewCount: row.review_count,
    };
  }
  return map;
}

export const emptyRating: Rating = { averageRating: 0, reviewCount: 0 };
