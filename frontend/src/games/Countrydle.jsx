import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { navigate } from '../lib/router';
import { bearing, compact, cx, fmt, hashString, haversineKm, pick, todayKey } from '../lib/utils';
import { matchCountry } from '../lib/names';
import CountryInput from '../components/CountryInput';
import Flag from '../components/Flag';
import Globe from '../components/Globe';
import { Button, Card, ErrorCard, GameHeader, Icon, Loader } from '../components/ui';

const MAX = 8;
const HALF_WORLD_KM = 20037;

function compare(g, t, geo) {
  const gi = geo.get(g._id);
  const ti = geo.get(t._id);
  const dist = gi && ti ? haversineKm(gi.centroid, ti.centroid) : null;
  const exact = g._id === t._id;
  return {
    exact,
    dist: exact ? 0 : dist,
    dir: dist != null && !exact ? bearing(gi.centroid, ti.centroid) : null,
    prox: dist != null ? Math.max(0, Math.round((1 - dist / HALF_WORLD_KM) * 100)) : null,
    region: g.region === t.region,
    subregion: g.subregion === t.subregion,
    border: !exact && (t.borders || []).some((b) => b === g.alpha3Code || b === g.cioc),
    pop: g.population === t.population ? 0 : t.population > g.population ? 1 : -1,
  };
}

function Tile({ label, tone = 'miss', children }) {
  const tones = {
    hit: 'border-lagoon/50 bg-lagoon/15 text-lagoon',
    near: 'border-sun/50 bg-sun/15 text-sun',
    miss: 'border-white/10 bg-ink-700/60 text-mist',
  };
  return (
    <div className={cx('flex min-h-16 flex-col justify-center rounded-lg border px-2.5 py-2 text-center', tones[tone])}>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-sm font-semibold leading-tight">{children}</span>
    </div>
  );
}

function GuessRow({ guess, result }) {
  const distTone = result.exact ? 'hit' : result.dist != null && result.dist < 1500 ? 'near' : 'miss';
  return (
    <Card className={cx('animate-pop p-3', result.exact && 'border-lagoon/60')}>
      <div className="mb-2.5 flex items-center gap-3">
        <Flag id={guess._id} className="h-6 w-9 shrink-0" imgClassName="h-full w-full rounded-sm object-cover ring-1 ring-white/10" />
        <span className="flex-1 truncate font-semibold">{guess.name}</span>
        {result.prox != null && (
          <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-bold', result.exact ? 'bg-lagoon text-ink-950' : 'bg-white/10 text-sand')}>{result.prox}%</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {result.dist != null && (
          <Tile label="Distance" tone={distTone}>
            {result.exact ? (
              '🎯'
            ) : (
              <span className="flex items-center justify-center gap-1">
                {fmt(Math.round(result.dist))} km
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" style={{ transform: `rotate(${result.dir}deg)` }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="direction">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </span>
            )}
          </Tile>
        )}
        <Tile label="Region" tone={result.region ? 'hit' : 'miss'}>{guess.region}</Tile>
        <Tile label="Subregion" tone={result.subregion ? 'hit' : 'miss'}>{guess.subregion}</Tile>
        <Tile label="Population" tone={result.pop === 0 ? 'hit' : 'miss'}>
          <span className="flex items-center justify-center gap-1">
            {compact(guess.population)}
            {result.pop !== 0 && <Icon name={result.pop > 0 ? 'up' : 'down'} className="h-3.5 w-3.5" />}
          </span>
        </Tile>
        <Tile label="Neighbour?" tone={result.exact ? 'hit' : result.border ? 'near' : 'miss'}>{result.exact ? '✓' : result.border ? 'Yes' : 'No'}</Tile>
      </div>
    </Card>
  );
}

function shareText(dateLabel, guesses, results, won) {
  const rows = guesses.map((_, i) => {
    const p = results[i].prox ?? (results[i].region ? 60 : 20);
    const filled = Math.max(0, Math.min(5, Math.round(p / 20)));
    return '🟩'.repeat(filled) + '⬜'.repeat(5 - filled);
  });
  return `Countrydle ${dateLabel} ${won ? guesses.length : 'X'}/${MAX}\n${rows.join('\n')}`;
}

function Board({ target, storageKey, onFinish, onAgain }) {
  const { countries, geo } = useApp();
  const [guesses, setGuesses] = useState(() => {
    if (!storageKey) return [];
    try {
      const ids = JSON.parse(localStorage.getItem(storageKey))?.ids || [];
      return ids.map((id) => countries.find((c) => c._id === id)).filter(Boolean);
    } catch {
      return [];
    }
  });
  const [notice, setNotice] = useState('');
  const [shake, setShake] = useState(0);
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => guesses.map((g) => compare(g, target, geo)), [guesses, target, geo]);
  const won = guesses.some((g) => g._id === target._id);
  const lost = !won && guesses.length >= MAX;
  const done = won || lost;

  const submit = (name) => {
    const found = matchCountry(countries, name);
    if (!found) {
      setNotice('Pick a country from the suggestions');
      return setShake((s) => s + 1);
    }
    if (guesses.some((g) => g._id === found._id)) {
      setNotice('You already guessed that one');
      return setShake((s) => s + 1);
    }
    setNotice('');
    const next = [...guesses, found];
    setGuesses(next);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify({ ids: next.map((g) => g._id) }));
    const nowWon = found._id === target._id;
    if (nowWon || next.length >= MAX) onFinish(nowWon ? MAX + 1 - next.length : 0);
  };

  const share = async () => {
    const text = shareText(todayKey(), guesses, results, won);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled share */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-mist">
        <span>
          Guess <span className="font-semibold text-sand">{Math.min(guesses.length + (done ? 0 : 1), MAX)}</span> / {MAX}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: MAX }).map((_, i) => (
            <span key={i} className={cx('h-2 w-4 rounded-full', i < guesses.length ? (won && i === guesses.length - 1 ? 'bg-lagoon' : 'bg-sun') : 'bg-ink-600')} />
          ))}
        </div>
      </div>

      {!done && (
        <div className="space-y-2">
          <CountryInput countries={countries} exclude={guesses.map((g) => g._id)} onSubmit={submit} shakeKey={shake} />
          <p className={cx('min-h-5 text-sm', notice ? 'text-coral' : 'text-transparent')}>{notice || '.'}</p>
        </div>
      )}

      {done && (
        <Card className={cx('animate-pop overflow-hidden border-2 p-5 text-center', won ? 'border-lagoon/50' : 'border-coral/40')}>
          <Globe country={target} size={160} className="mx-auto h-36 w-36" />
          <p className={cx('mt-3 text-sm font-semibold', won ? 'text-lagoon' : 'text-coral')}>
            {won ? `Solved in ${guesses.length}!` : 'Out of guesses — it was'}
          </p>
          <h2 className="font-display-tight text-3xl font-bold">{target.name}</h2>
          <p className="mt-1 text-sm text-mist">{target.capital} · {target.subregion}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button onClick={share} variant="primary"><Icon name="share" className="h-4 w-4" />{copied ? 'Copied!' : 'Share result'}</Button>
            {onAgain ? <Button variant="secondary" onClick={onAgain}>Another country</Button> : <Button variant="secondary" onClick={() => navigate('home')}>More games</Button>}
          </div>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-3">
        {guesses.map((g, i) => <GuessRow key={g._id} guess={g} result={results[i]} />)}
      </div>

      {guesses.length === 0 && (
        <Card className="p-5 text-sm leading-relaxed text-mist">
          <p className="mb-2 font-semibold text-sand">How it works</p>
          Guess any country. Each guess shows how <b className="text-sand">far</b> it is from the mystery country and which <b className="text-sand">direction</b> to head,
          plus whether the region, subregion, population and borders line up. You have {MAX} tries.
        </Card>
      )}
    </div>
  );
}

export default function Countrydle() {
  const { countries, geo, geoStatus, submitScore, user } = useApp();
  const [mode, setMode] = useState('daily');
  const [round, setRound] = useState(0);
  const [toast, setToast] = useState('');

  const pool = useMemo(() => {
    const withGeo = geo.size ? countries.filter((c) => geo.has(c._id)) : countries;
    return [...withGeo].sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, geo]);

  const day = todayKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const target = useMemo(() => (mode === 'daily' ? pool[hashString(`countrydle-${day}`) % pool.length] : pick(pool)), [mode, round, pool, day]);

  if (geoStatus === 'loading') return <Loader title="Drawing the world…" />;
  if (!target) return <ErrorCard title="No countries loaded" />;

  const onFinish = async (points) => {
    if (user?.guest) return setToast('Log in to save points to your profile');
    const res = await submitScore(points);
    setToast(res.saved ? `+${points} points added to your profile` : '');
  };

  const tab = (id, label) => (
    <button
      onClick={() => { setMode(id); setToast(''); setRound((r) => r + 1); }}
      className={cx('flex-1 rounded-lg py-2 text-sm font-semibold transition', mode === id ? 'bg-sun text-ink-950' : 'text-mist hover:text-sand')}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <GameHeader title="Countrydle" onBack={() => navigate('home')} />
      <div className="mb-5 flex gap-1 rounded-xl border border-white/10 bg-ink-800/70 p-1">
        {tab('daily', `Daily · ${day}`)}
        {tab('practice', 'Practice')}
      </div>
      {geoStatus === 'error' && <p className="mb-3 rounded-lg bg-sun/10 p-3 text-sm text-sun">Map data didn&apos;t load, so distance and direction are hidden. Other clues still work.</p>}
      {toast && <p className="mb-3 rounded-lg bg-lagoon/10 p-3 text-center text-sm text-lagoon">{toast}</p>}
      <Board
        key={`${mode}-${round}-${target._id}`}
        target={target}
        storageKey={mode === 'daily' ? `countrydle-${day}` : null}
        onFinish={mode === 'daily' && localStorage.getItem(`countrydle-done-${day}`) ? () => {} : (p) => { if (mode === 'daily') localStorage.setItem(`countrydle-done-${day}`, '1'); onFinish(p); }}
        onAgain={mode === 'practice' ? () => { setToast(''); setRound((r) => r + 1); } : null}
      />
    </div>
  );
}
