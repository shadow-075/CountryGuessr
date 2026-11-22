import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFinish } from '../lib/hooks';
import { matchCountry } from '../lib/names';
import { navigate } from '../lib/router';
import { cx, normalize } from '../lib/utils';
import ResultCard from '../components/ResultCard';
import SetupCard from '../components/SetupCard';
import { Card, Chip, GameHeader, Icon } from '../components/ui';
import { GAMES } from './registry';

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function Play({ targets, label, seconds, onDone }) {
  const { countries } = useApp();
  const [found, setFound] = useState([]); // country objects, newest first
  const [value, setValue] = useState('');
  const [notice, setNotice] = useState('');
  const [left, setLeft] = useState(seconds);
  const deadline = useRef(seconds ? Date.now() + seconds * 1000 : null);
  const inputRef = useRef(null);
  const finished = useRef(false);
  const end = (timeUp) => {
    if (finished.current) return;
    finished.current = true;
    onDone(found, timeUp);
  };
  const ids = useMemo(() => new Set(targets.map((c) => c._id)), [targets]);
  const foundIds = useMemo(() => new Set(found.map((c) => c._id)), [found]);

  useEffect(() => {
    if (!seconds) return;
    const id = setInterval(() => {
      const l = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) end(true);
    }, 250);
    return () => clearInterval(id);
  });

  const accept = (text, force) => {
    const c = matchCountry(countries, text);
    if (!c) return false;
    if (!force) {
      // "Niger" must wait if "Nigeria" could still be typed
      const q = normalize(text);
      const ambiguous = targets.some((t) => !foundIds.has(t._id) && t._id !== c._id && normalize(t.name).startsWith(q));
      if (ambiguous) return false;
    }
    if (!ids.has(c._id)) setNotice(`${c.name} isn't in this set`);
    else if (foundIds.has(c._id)) setNotice(`Already got ${c.name}`);
    else {
      setFound((f) => [c, ...f]);
      setNotice('');
    }
    setValue('');
    return true;
  };

  const onChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (v.trim().length >= 2) accept(v, false);
  };

  const pct = (found.length / targets.length) * 100;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-mist">{label}</p>
            <p className="font-display-tight text-4xl font-bold">
              <span className="text-sun">{found.length}</span>
              <span className="text-xl text-mist"> / {targets.length}</span>
            </p>
          </div>
          {seconds ? (
            <div className={cx('flex items-center gap-1.5 text-2xl font-bold tabular-nums', left <= 20 ? 'text-coral' : 'text-sand')}>
              <Icon name="clock" className="h-5 w-5" /> {mmss(left)}
            </div>
          ) : (
            <span className="text-sm text-mist">Practice · no timer</span>
          )}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-sun transition-all" style={{ width: `${pct}%` }} /></div>
      </Card>

      <div>
        <input
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => e.key === 'Enter' && accept(value, true)}
          autoFocus
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go"
          placeholder="Type a country — it's added automatically"
          aria-label="Country name"
          className="h-14 w-full rounded-xl border border-white/10 bg-ink-900/80 px-4 text-base outline-none transition placeholder:text-mist/60 focus:border-sun/60 focus:ring-2 focus:ring-sun/20"
        />
        <p className={cx('mt-2 min-h-5 text-sm', notice ? 'text-coral' : 'text-transparent')}>{notice || '.'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {found.map((c, i) => <Chip key={c._id} className={cx('border-lagoon/30 bg-lagoon/10 text-lagoon', i === 0 && 'animate-pop')}>{c.name}</Chip>)}
      </div>

      <div className="pt-2 text-center">
        <button onClick={() => window.confirm('Give up and see what you missed?') && end(false)} className="text-sm font-medium text-mist transition hover:text-coral">Give up</button>
      </div>
    </div>
  );
}

export default function NameThemAll() {
  const { countries } = useApp();
  const finish = useFinish();
  const game = GAMES.nameall;
  const [scope, setScope] = useState('all');
  const [timed, setTimed] = useState('timed');
  const [phase, setPhase] = useState('setup');
  const [run, setRun] = useState(null); // { targets, label, seconds }
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState('');

  const subregions = useMemo(() => [...new Set(countries.map((c) => c.subregion).filter((s) => s && s !== 'Unknown'))].sort(), [countries]);

  const targetsFor = (sc) => {
    if (sc === 'all') return countries;
    if (sc.startsWith('r:')) return countries.filter((c) => c.region === sc.slice(2));
    return countries.filter((c) => c.subregion === sc.slice(2));
  };
  const targets = targetsFor(scope);
  const seconds = Math.min(900, Math.max(90, targets.length * 6));
  const label = scope === 'all' ? 'The world' : scope.slice(2);

  const start = () => { setRun({ targets, label, seconds: timed === 'timed' ? seconds : 0 }); setPhase('playing'); };

  const done = async (found, timeUp) => {
    const n = found.length;
    const complete = n === run.targets.length;
    const points = Math.floor(n / 2) + (complete ? 5 : 0);
    setResult({ found, timeUp, complete, points });
    setPhase('over');
    setSaved(await finish(points));
  };

  const groups = [
    { label: 'Scope', value: scope, onChange: setScope, options: [{ id: 'all', label: 'World' }, ...REGIONS.map((r) => ({ id: `r:${r}`, label: r }))] },
    { label: 'Or a subregion', value: scope, onChange: setScope, options: subregions.map((s) => ({ id: `s:${s}`, label: s })) },
    { label: 'Mode', value: timed, onChange: setTimed, options: [{ id: 'timed', label: 'Timed' }, { id: 'practice', label: 'Practice (no timer)' }] },
  ];

  const missed = result && run ? run.targets.filter((c) => !result.found.some((f) => f._id === c._id)) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <GameHeader title={game.title} onBack={() => navigate('home')} />
      {phase === 'setup' && (
        <SetupCard game={game} groups={groups} onStart={start} disabled={!targets.length}
          startLabel={`Start · ${targets.length} countries${timed === 'timed' ? ` · ${mmss(seconds)}` : ''}`} />
      )}
      {phase === 'playing' && run && <Play key={run.label + run.seconds} {...run} onDone={done} />}
      {phase === 'over' && result && (
        <div className="space-y-4">
          <ResultCard
            label={result.complete ? 'Perfect — every one!' : result.timeUp ? "Time's up" : 'Round over'}
            big={result.points} saved={saved} onAgain={() => setPhase('setup')}
          >
            You named <span className="font-semibold text-sand">{result.found.length}</span> of {run.targets.length} in {run.label}.
            <p className="mt-1 text-xs">1 point per 2 countries{result.complete ? ' + 5 bonus' : ''}</p>
          </ResultCard>
          {missed.length > 0 && (
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-coral">Missed ({missed.length})</p>
              <div className="flex flex-wrap gap-2">{missed.map((c) => <Chip key={c._id} className="border-coral/30 bg-coral/10 text-coral">{c.name}</Chip>)}</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
