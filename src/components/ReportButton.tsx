import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { REPORT_REASONS, type ReportReason, type ReportTarget } from '../api/reports';
import { useAuth } from '../contexts/AuthContext';
import { useSubmitReport } from '../hooks/queries';
import { ErrorState } from './StateMessage';

/** ユーザー投稿を受け入れる以上、その場で報告できる導線を必ず置く */
export default function ReportButton({
  targetType,
  targetId,
  label = '通報',
}: {
  targetType: ReportTarget;
  targetId: string;
  label?: string;
}) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const submitReport = useSubmitReport();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('wrong_info');
  const [detail, setDetail] = useState('');
  const [done, setDone] = useState(false);

  const handleOpen = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitReport.mutateAsync({ targetType, targetId, reason, detail: detail.trim() });
    setDone(true);
  };

  if (done) {
    return <p className="text-xs text-gray-medium">報告を受け付けました。ありがとうございます。</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={handleOpen} className="text-xs text-gray-400 hover:text-gray-600">
        {label}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-sm font-medium text-gray-dark">この内容を報告する</p>

      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as ReportReason)}
        className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      >
        {REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="補足があれば（任意）"
        className="w-full resize-none rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />

      {submitReport.error && <ErrorState error={submitReport.error} />}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1 text-sm text-gray-medium hover:text-gray-dark"
        >
          やめる
        </button>
        <button
          type="submit"
          disabled={submitReport.isPending}
          className="rounded-md bg-gold px-3 py-1 text-sm font-bold text-white disabled:opacity-50"
        >
          送信
        </button>
      </div>
    </form>
  );
}
