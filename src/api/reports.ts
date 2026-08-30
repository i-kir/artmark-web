import { supabase } from '../lib/supabase';

export type ReportTarget = 'review' | 'comment' | 'exhibition';
export type ReportReason = 'spam' | 'abuse' | 'wrong_info' | 'copyright' | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'wrong_info', label: '情報が間違っている' },
  { value: 'spam', label: 'スパム・宣伝' },
  { value: 'abuse', label: '誹謗中傷・不適切な内容' },
  { value: 'copyright', label: '著作権の侵害' },
  { value: 'other', label: 'その他' },
];

export async function submitReport(
  reporterId: string,
  targetType: ReportTarget,
  targetId: string,
  reason: ReportReason,
  detail: string
): Promise<void> {
  const { error } = await supabase.from('reports').upsert(
    {
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      detail,
    },
    { onConflict: 'reporter_id,target_type,target_id' }
  );
  if (error) throw error;
}
