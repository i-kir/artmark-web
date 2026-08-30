import { supabase } from '../lib/supabase';
import type { Author, Review, TargetType } from '../types';

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
  review_tags: { tag: string }[] | null;
  likes: { count: number }[] | null;
  comments: { count: number }[] | null;
};

// reviews と profiles は user_id 経由と likes 経由の2つの関係があるため、外部キーを明示する
const SELECT =
  '*, author:profiles!reviews_user_id_fkey(handle, display_name, avatar_url), review_tags(tag), likes(count), comments(count)';

const toAuthor = (r: ReviewRow['author']): Author | null =>
  r ? { handle: r.handle, displayName: r.display_name, avatarUrl: r.avatar_url } : null;

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
  author: toAuthor(r.author),
  tags: (r.review_tags ?? []).map((t) => t.tag),
  likeCount: r.likes?.[0]?.count ?? 0,
  commentCount: r.comments?.[0]?.count ?? 0,
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

/** フォロー中のユーザーのレビュー。PostgREST はサブクエリを書けないので id 一覧を渡す */
export async function fetchTimelineReviews(userIds: string[], limit = 50): Promise<Review[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select(SELECT)
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ReviewRow[]).map(toReview);
}

export async function fetchReviewsByTag(tag: string): Promise<Review[]> {
  const { data: tagRows, error: tagError } = await supabase
    .from('review_tags')
    .select('review_id')
    .eq('tag', tag);
  if (tagError) throw tagError;

  const ids = (tagRows as { review_id: string }[]).map((r) => r.review_id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select(SELECT)
    .in('id', ids)
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
  tags: string[];
};

/** 同一ユーザー・同一対象は1件に保つため upsert する */
export async function saveReview(userId: string, input: ReviewInput): Promise<void> {
  const { data, error } = await supabase
    .from('reviews')
    .upsert(
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
    )
    .select('id')
    .single();
  if (error) throw error;

  const reviewId = (data as { id: string }).id;

  // タグは入れ替え方式。差分を取るより単純で、件数も高々数個
  const { error: deleteError } = await supabase.from('review_tags').delete().eq('review_id', reviewId);
  if (deleteError) throw deleteError;

  const tags = Array.from(new Set(input.tags.map((t) => t.trim()).filter(Boolean)));
  if (tags.length > 0) {
    const { error: insertError } = await supabase
      .from('review_tags')
      .insert(tags.map((tag) => ({ review_id: reviewId, tag })));
    if (insertError) throw insertError;
  }
}

export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
}
