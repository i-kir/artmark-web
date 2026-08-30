import { useCallback, useState } from 'react';
import type { LatLng } from '../lib/geo';

type Status = 'idle' | 'loading' | 'granted' | 'error';

const MESSAGES: Record<number, string> = {
  1: '位置情報の利用が許可されていません。ブラウザの設定から許可してください。',
  2: '現在地を取得できませんでした。電波状況の良い場所で再度お試しください。',
  3: '現在地の取得がタイムアウトしました。',
};

/** 現在地は明示的に要求されたときだけ取得する（勝手に聞かない） */
export function useGeolocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setMessage('このブラウザは位置情報に対応していません。');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
        setMessage('');
      },
      (error) => {
        setStatus('error');
        setMessage(MESSAGES[error.code] ?? '現在地を取得できませんでした。');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const clear = useCallback(() => {
    setPosition(null);
    setStatus('idle');
    setMessage('');
  }, []);

  return { position, status, message, request, clear };
}
