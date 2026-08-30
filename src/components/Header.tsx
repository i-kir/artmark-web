import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'text-gold font-medium' : 'text-white hover:text-gold transition';

export default function Header() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-navy text-white shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="text-gold font-bold text-2xl shrink-0">
          ArtMark
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base">
          <NavLink to="/" className={linkClass}>
            ホーム
          </NavLink>
          <NavLink to="/search" className={linkClass}>
            検索
          </NavLink>
          {session ? (
            <>
              <NavLink to="/mypage" className={linkClass}>
                マイページ
              </NavLink>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-gray-300 hover:text-white transition text-sm"
                title={profile?.displayName ?? undefined}
              >
                ログアウト
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="bg-gold text-navy font-bold px-4 py-1.5 rounded-full hover:bg-gold-light transition"
            >
              ログイン
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
