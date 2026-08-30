import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4 text-center">
      <div>
        <p className="text-6xl font-bold text-gold">404</p>
        <h1 className="mt-4 text-xl font-bold text-navy-dark">ページが見つかりません</h1>
        <p className="mt-2 text-gray-medium">URL が変わったか、削除された可能性があります。</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-gold px-6 py-2 font-bold text-white">
          ホームへ戻る
        </Link>
      </div>
    </div>
  );
}
