import { supabase } from '../lib/supabase';
import type { Profile, ProfileStats } from '../types';

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
};

const SELECT = 'id, handle, display_name, avatar_url, bio';

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  handle: r.handle,
  displayName: r.display_name,
  avatarUrl: r.avatar_url,
  bio: r.bio,
});

export async function fetchProfileByHandle(handle: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(SELECT).eq('handle', handle).maybeSingle();
  if (error) throw error;
  return data ? toProfile(data as ProfileRow) : null;
}

export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const { data, error } = await supabase
    .from('profile_stats')
    .select('follower_count, following_count, review_count')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return {
    followerCount: data?.follower_count ?? 0,
    followingCount: data?.following_count ?? 0,
    reviewCount: data?.review_count ?? 0,
  };
}

export async function searchProfiles(term: string): Promise<Profile[]> {
  const query = supabase.from('profiles').select(SELECT).limit(30);
  const { data, error } = term.trim()
    ? await query.or(`handle.ilike.%${term.trim()}%,display_name.ilike.%${term.trim()}%`)
    : await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProfileRow[]).map(toProfile);
}

export type ProfileInput = {
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
};

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      handle: input.handle,
      display_name: input.displayName,
      bio: input.bio,
      avatar_url: input.avatarUrl,
    })
    .eq('id', userId);
  if (error) throw error;
}
