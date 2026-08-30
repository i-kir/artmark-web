import { Link } from 'react-router-dom';
import type { Exhibition } from '../types';
import ReportButton from './ReportButton';
import { useAuth } from '../contexts/AuthContext';

const LABELS: Record<Exhibition['source'], string> = {
  seed: 'サンプルデータ',
  wikidata: 'Wikidata より',
  crawl: '公式サイトより自動取得',
  user: 'ユーザーによる登録',
};

/**
 * この情報がどこから来たのかを必ず示す。
 * 出典のないデータは、誤りを見つけても直しようがない。
 */
export default function SourceNote({ exhibition }: { exhibition: Exhibition }) {
  const { userId } = useAuth();
  const isMine = exhibition.createdBy !== null && exhibition.createdBy === userId;

  return (
    <div className="mt-8 border-t border-gray-200 pt-4 text-xs text-gray-medium">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>出典: {LABELS[exhibition.source]}</span>

        {exhibition.officialUrl && (
          <a
            href={exhibition.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy-accent hover:underline"
          >
            公式ページを見る
          </a>
        )}

        {isMine && (
          <Link to={`/exhibition/${exhibition.id}/edit`} className="text-navy-accent hover:underline">
            情報を編集
          </Link>
        )}

        <ReportButton targetType="exhibition" targetId={exhibition.id} label="情報の誤りを報告" />
      </div>

      <p className="mt-2">
        会期や料金は変更されることがあります。お出かけの前に公式サイトでご確認ください。
      </p>
    </div>
  );
}
