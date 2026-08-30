import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'text-rose font-medium border-b-2 border-rose pb-0.5'
    : 'text-mocha hover:text-rose transition-colors';

export default function Header() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rose-tint bg-cream/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link
          to="/"
          className="shrink-0 font-serif text-2xl font-semibold tracking-wide text-rose"
        >
          ArtMark
        </Link>

        <nav className="no-scrollbar flex items-center gap-3 overflow-x-auto text-sm sm:gap-5 sm:text-base">
          <NavLink to="/" className={linkClass}>
            ホーム
          </NavLink>
          <NavLink to="/search" className={linkClass}>
            検索
          </NavLink>
          <NavLink to="/map" className={linkClass}>
            地図
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
                className="whitespace-nowrap text-sm text-gray-medium transition hover:text-mocha"
              >
                ログアウト
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="whitespace-nowrap rounded-full bg-rose px-4 py-1.5 font-bold text-white shadow-soft transition hover:bg-rose-soft"
            >
              ログイン
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
