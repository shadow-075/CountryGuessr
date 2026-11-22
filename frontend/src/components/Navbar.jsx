import { useApp } from '../context/AppContext';
import { navigate } from '../lib/router';
import { cx } from '../lib/utils';
import { Icon, Logo } from './ui';

const TABS = [
  { id: 'home', label: 'Games', icon: 'home' },
  { id: 'leaderboard', label: 'Ranks', icon: 'trophy' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export function Navbar({ page }) {
  const { user, logout } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 pt-safe backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <button onClick={() => navigate('home')} className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display-tight text-xl font-bold">
            Country<span className="text-sun">Guessr</span>
          </span>
        </button>

        {user && (
          <nav className="hidden items-center gap-1 sm:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(t.id)}
                className={cx('rounded-lg px-4 py-2 text-sm font-medium transition', page === t.id ? 'bg-white/10 text-sand' : 'text-mist hover:text-sand')}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-white/10 bg-ink-800 px-3 py-1.5 text-sm">
              <span className="text-mist">{user.guest ? 'Guest' : user.username}</span>
              {!user.guest && <span className="ml-2 font-semibold text-sun">{user.totalScore}</span>}
            </div>
            <button onClick={logout} title="Log out" aria-label="Log out" className="hidden rounded-lg p-2 text-mist transition hover:bg-white/5 hover:text-coral sm:block">
              <Icon name="logout" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/** Mobile tab bar — hidden during games so the keyboard has room */
export function BottomNav({ page }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/90 pb-safe backdrop-blur-md sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => navigate(t.id)} className={cx('flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition', page === t.id ? 'text-sun' : 'text-mist')}>
            <Icon name={t.icon} className="h-6 w-6" />
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:pb-8 text-center text-xs text-mist/70">
      <p>© 2026 CountryGuessr · Country data via countries.dev · Map shapes from Natural Earth</p>
    </footer>
  );
}
