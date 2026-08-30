import { supabase } from '../lib/supabase';
import type { Review, TargetType } from '../types';

type ReviewRow = {
  id: string;
  user_id: string;
  target_type: TargetType;
  target_id: string;
  rating: number | string | null;
  comment: string;
  visit_date: string | null;
  has_spoiler: boolean;
  created_at: string;
  author: { handle: string; display_name: string; avatar_url: string | null } | null;
};

// reviews と profiles は user_id 経由と likes 経由の2つの関係があるため、外部キーを明示する
const SELECT = '*, author:profiles!reviews_user_id_fkey(handle, display_name, avatar_url)';

const toReview = (r: ReviewRow): Review => ({
  id: r.id,
  userId: r.user_id,
  targetType: r.target_type,
  targetId: r.target_id,
  // numeric 型は文字列で返るため数値に戻す
  rating: r.rating === null ? null : Number(r.rating),
  comment: r.comment,
  visitDate: r.visit_date,
  hasSpoiler: r.has_spoiler,
  createdAt: r.created_at,
  author: r.author
    ? { handle: r.author.handle, displayName: r.author.display_name, avatarUrl: r.author.avatar_url }
    : null,
});

export async function fetchLatestReviews(limit = 10): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ReviewRow[]).map(toReview);
}

export async function fetchReviewsForTarget(targetType: TargetType, targetId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(SELECT)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ReviewRow[]).map(toReview);
}

export async function fetchReviewsByUser(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ReviewRow[]).map(toReview);
}

export type ReviewInput = {
  targetType: TargetType;
  targetId: string;
  rating: number | null;
  comment: string;
  visitDate: string | null;
  hasSpoiler: boolean;
};

/** 同一ユーザー・同一対象は1件に保つため upsert する */
export async function saveReview(userId: string, input: ReviewInput): Promise<void> {
  const { error } = await supabase.from('reviews').upsert(
    {
      user_id: userId,
      target_type: input.targetType,
      target_id: input.targetId,
      rating: input.rating,
      comment: input.comment,
      visit_date: input.visitDate,
      has_spoiler: input.hasSpoiler,
    },
    { onConflict: 'user_id,target_type,target_id' }
  );
  if (error) throw error;
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
}
