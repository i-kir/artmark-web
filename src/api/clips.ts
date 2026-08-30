import { supabase } from '../lib/supabase';
import type { Clip, ClipStatus, TargetType } from '../types';

type ClipRow = {
  target_type: TargetType;
  target_id: string;
  status: 'want' | 'visited';
  created_at: string;
};

export async function fetchMyClips(): Promise<Clip[]> {
  const { data, error } = await supabase
    .from('clips')
    .select('target_type, target_id, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ClipRow[]).map((r) => ({
    targetType: r.target_type,
    targetId: r.target_id,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function setClip(
  userId: string,
  targetType: TargetType,
  targetId: string,
  status: ClipStatus
): Promise<void> {
  if (status === 'none') {
    const { error } = await supabase
      .from('clips')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('clips')
    .upsert(
      { user_id: userId, target_type: targetType, target_id: targetId, status },
      { onConflict: 'user_id,target_type,target_id' }
    );
  if (error) throw error;
}
