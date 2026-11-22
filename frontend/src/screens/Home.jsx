import { useApp } from '../context/AppContext';
import { navigate } from '../lib/router';
import { cx, todayKey } from '../lib/utils';
import { GAME_LIST, GROUPS } from '../games/registry';

const TAG_STYLES = {
  Classic: 'bg-white/10 text-mist',
  New: 'bg-lagoon/20 text-lagoon',
  Daily: 'bg-sun/20 text-sun',
  Arcade: 'bg-coral/20 text-coral',
  Timed: 'bg-sky/20 text-sky',
};

export default function Home() {
  const { user, countries } = useApp();
  const dailyDone = !!localStorage.getItem(`countrydle-done-${todayKey()}`);

  return (
    <div className="space-y-8">
      <section className="animate-rise pt-2">
        <p className="text-sm font-medium text-mist">
          {user?.guest ? 'Playing as guest' : `Welcome back, ${user?.username}`}
        </p>
        <h1 className="font-display-tight mt-1 text-4xl font-bold leading-tight sm:text-5xl">
          Where in the <span className="italic text-sun">world</span> are we?
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {!user?.guest && (
            <>
              <span className="rounded-full border border-white/10 bg-ink-800 px-3 py-1.5"><b className="text-sun">{user?.totalScore ?? 0}</b> <span className="text-mist">points</span></span>
              <span className="rounded-full border border-white/10 bg-ink-800 px-3 py-1.5"><b>{user?.gamesPlayed ?? 0}</b> <span className="text-mist">games</span></span>
            </>
          )}
          {countries.length > 0 && <span className="rounded-full border border-white/10 bg-ink-800 px-3 py-1.5"><b>{countries.length}</b> <span className="text-mist">countries</span></span>}
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">{group}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_LIST.filter((g) => g.group === group).map((g, i) => (
          <button
            key={g.id}
            onClick={() => navigate(`play/${g.id}`)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="group animate-rise relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/70 p-5 text-left shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-white/25 active:scale-[0.98]"
          >
            <div className={cx('pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br to-transparent blur-2xl transition group-hover:scale-125', g.glow)} />
            <div className="relative flex items-start justify-between">
              <span className="text-5xl drop-shadow-lg transition group-hover:scale-110">{g.emoji}</span>
              <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider', TAG_STYLES[g.tag])}>
                {g.id === 'countrydle' && dailyDone ? 'Done ✓' : g.tag}
              </span>
            </div>
            <h2 className="font-display-tight relative mt-4 text-xl font-bold">{g.title}</h2>
            <p className="relative mt-1 text-sm leading-relaxed text-mist">{g.blurb}</p>
          </button>
        ))}
          </div>
        </section>
      ))}
    </div>
  );
}
