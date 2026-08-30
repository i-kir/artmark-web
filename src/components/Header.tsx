import { NavLink, Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-navy text-white shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-gold font-bold text-2xl">
          ArtMark
        </Link>
        <nav className="flex items-center space-x-6">
          <NavLink to="/" className={({ isActive }) => isActive ? "text-gold font-medium" : "text-white hover:text-gold transition"}>ホーム</NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? "text-gold font-medium" : "text-white hover:text-gold transition"}>検索</NavLink>
          <NavLink to="/mypage" className={({ isActive }) => isActive ? "text-gold font-medium" : "text-white hover:text-gold transition"}>マイページ</NavLink>
        </nav>
      </div>
    </header>
  );
}
