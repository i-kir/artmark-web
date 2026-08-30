import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

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
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="shrink-0 text-2xl font-bold text-gold">
          ArtMark
        </Link>

        <nav className="flex items-center gap-3 overflow-x-auto text-sm sm:gap-5 sm:text-base">
          <NavLink to="/" className={linkClass}>
            ホーム
          </NavLink>
          <NavLink to="/search" className={linkClass}>
            検索
          </NavLink>
          <NavLink to="/users" className={linkClass}>
            ユーザー
          </NavLink>

          {session ? (
            <>
              <NavLink to="/timeline" className={linkClass}>
                タイムライン
              </NavLink>
              <NavLink to="/mypage" className={linkClass}>
                マイページ
              </NavLink>
              {profile && (
                <Link to={`/u/${profile.handle}`} title={profile.displayName || profile.handle}>
                  <Avatar author={{ displayName: profile.displayName, avatarUrl: profile.avatarUrl }} size="sm" />
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="whitespace-nowrap text-sm text-gray-300 transition hover:text-white"
              >
                ログアウト
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="whitespace-nowrap rounded-full bg-gold px-4 py-1.5 font-bold text-navy transition hover:bg-gold-light"
            >
              ログイン
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
