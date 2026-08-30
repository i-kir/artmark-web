import { supabase } from '../lib/supabase';
import type { Author, Comment, Profile } from '../types';

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
};

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  handle: r.handle,
  displayName: r.display_name,
  avatarUrl: r.avatar_url,
  bio: r.bio,
});

const toAuthor = (r: { handle: string; display_name: string; avatar_url: string | null } | null): Author | null =>
  r ? { handle: r.handle, displayName: r.display_name, avatarUrl: r.avatar_url } : null;

// ---------- フォロー ----------

/** 自分がフォローしている相手の id 一覧。タイムラインの絞り込みに使う */
export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('follows').select('followee_id').eq('follower_id', userId);
  if (error) throw error;
  return (data as { followee_id: string }[]).map((r) => r.followee_id);
}

export async function fetchFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('followee:profiles!follows_followee_id_fkey(id, handle, display_name, avatar_url, bio)')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data as unknown as { followee: ProfileRow | null }[])
    .map((r) => r.followee)
    .filter((p): p is ProfileRow => p !== null)
    .map(toProfile);
}

export async function fetchFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower:profiles!follows_follower_id_fkey(id, handle, display_name, avatar_url, bio)')
    .eq('followee_id', userId);
  if (error) throw error;
  return (data as unknown as { follower: ProfileRow | null }[])
    .map((r) => r.follower)
    .filter((p): p is ProfileRow => p !== null)
    .map(toProfile);
}

export async function setFollow(followerId: string, followeeId: string, follow: boolean): Promise<void> {
  if (follow) {
    const { error } = await supabase
      .from('follows')
      .upsert({ follower_id: followerId, followee_id: followeeId }, { onConflict: 'follower_id,followee_id' });
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId);
  if (error) throw error;
}

// ---------- いいね ----------

/** 自分がいいねしたレビュー id の一覧。一覧表示で「いいね済み」を出すために使う */
export async function fetchMyLikedReviewIds(): Promise<string[]> {
  const { data, error } = await supabase.from('likes').select('review_id');
  if (error) throw error;
  return (data as { review_id: string }[]).map((r) => r.review_id);
}

export async function setLike(userId: string, reviewId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from('likes')
      .upsert({ user_id: userId, review_id: reviewId }, { onConflict: 'user_id,review_id' });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('likes').delete().eq('user_id', userId).eq('review_id', reviewId);
  if (error) throw error;
}

// ---------- コメント ----------

type CommentRow = {
  id: string;
  review_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: { handle: string; display_name: string; avatar_url: string | null } | null;
};

export async function fetchComments(reviewId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_user_id_fkey(handle, display_name, avatar_url)')
    .eq('review_id', reviewId)
    .order('created_at');
  if (error) throw error;
  return (data as CommentRow[]).map((r) => ({
    id: r.id,
    reviewId: r.review_id,
    userId: r.user_id,
    body: r.body,
    createdAt: r.created_at,
    author: toAuthor(r.author),
  }));
}

export async function addComment(userId: string, reviewId: string, body: string): Promise<void> {
  const { error } = await supabase.from('comments').insert({ user_id: userId, review_id: reviewId, body });
  if (error) throw error;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}
