import { useNavigate } from 'react-router-dom';
import type { TargetType } from '../types';
import ClipButton from './ClipButton';
import { useAuth } from '../contexts/AuthContext';
import { useClipStatus, useSetClip } from '../hooks/queries';

/** 未ログインならログイン画面へ誘導し、ログイン済みなら Supabase に保存する */
export default function ClipControl({
  targetType,
  targetId,
  size = 'lg',
}: {
  targetType: TargetType;
  targetId: string;
  size?: 'sm' | 'lg';
}) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const status = useClipStatus(targetType, targetId);
  const setClip = useSetClip();

  return (
    <ClipButton
      status={status}
      size={size}
      onStatusChange={(next) => {
        if (!session) {
          navigate('/login', { state: { from: `/${targetType}/${targetId}` } });
          return;
        }
        setClip.mutate({ targetType, targetId, status: next });
      }}
    />
  );
}
