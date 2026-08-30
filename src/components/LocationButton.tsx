type LocationButtonProps = {
  status: 'idle' | 'loading' | 'granted' | 'error';
  message: string;
  onRequest: () => void;
  onClear: () => void;
};

export default function LocationButton({ status, message, onRequest, onClear }: LocationButtonProps) {
  return (
    <div>
      {status === 'granted' ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:bg-gray-50"
        >
          ✓ 現在地を使用中（解除）
        </button>
      ) : (
        <button
          type="button"
          onClick={onRequest}
          disabled={status === 'loading'}
          className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-medium disabled:opacity-50"
        >
          {status === 'loading' ? '取得中...' : '📍 現在地から探す'}
        </button>
      )}
      {status === 'error' && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </div>
  );
}
