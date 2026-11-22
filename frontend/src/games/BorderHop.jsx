import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFinish } from '../lib/hooks';
import { matchCountry } from '../lib/names';
import { navigate } from '../lib/router';
import { cx, pick } from '../lib/utils';
import CountryInput from '../components/CountryInput';
import ResultCard from '../components/ResultCard';
import SetupCard from '../components/SetupCard';
import { Button, Card, Chip, GameHeader, Icon } from '../components/ui';
import { GAMES } from './registry';

const PUZZLES = 5;
const LEVELS = { easy: [3, 4], medium: [5, 6], hard: [7, 12] };

function buildGraph(countries, byCode) {
  const adj = new Map(countries.map((c) => [c._id, new Set()]));
  countries.forEach((c) =>
    (c.borders || []).forEach((code) => {
      const n = byCode.get(code);
      if (n && n._id !== c._id) {
        adj.get(c._id).add(n._id);
        adj.get(n._id)?.add(c._id);
      }
    })
  );
  return adj;
}

function bfs(adj, start) {
  const dist = new Map([[start, 0]]);
  const prev = new Map();
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    for (const n of adj.get(cur) || []) {
      if (!dist.has(n)) {
        dist.set(n, dist.get(cur) + 1);
        prev.set(n, cur);
        queue.push(n);
      }
    }
  }
  return { dist, prev };
}

function shortestPath(adj, a, b) {
  const { prev } = bfs(adj, a);
  if (a !== b && !prev.has(b)) return null;
  const path = [b];
  while (path[0] !== a) path.unshift(prev.get(path[0]));
  return path;
}

function makePuzzle(adj, level) {
  const nodes = [...adj.keys()].filter((id) => adj.get(id).size > 0);
  const tryRange = (range) => {
    for (let i = 0; i < 300; i++) {
      const start = pick(nodes);
      const { dist } = bfs(adj, start);
      const cands = [...dist].filter(([, d]) => d >= range[0] && d <= range[1]);
      if (cands.length) {
        const [target, par] = pick(cands);
        return { start, target, par };
      }
    }
    return null;
  };
  return tryRange(LEVELS[level]) || tryRange([3, 12]);
}

function Puzzle({ puzzle, adj, byId, index, total, score, onNext, onQuit }) {
  const { countries } = useApp();
  const [path, setPath] = useState([puzzle.start]);
  const [hints, setHints] = useState(0);
  const [hint, setHint] = useState('');
  const [status, setStatus] = useState('playing'); // playing | won | gaveUp
  const [notice, setNotice] = useState('');
  const [shake, setShake] = useState(0);

  const name = (id) => byId.get(id)?.name || '?';
  const current = path[path.length - 1];
  const steps = path.length - 1;
  const earned = status === 'won' ? Math.max(1, Math.max(1, 5 - Math.max(0, steps - puzzle.par)) - hints) : 0;
  const solution = useMemo(() => (status === 'gaveUp' ? shortestPath(adj, puzzle.start, puzzle.target) : null), [status, adj, puzzle]);

  const submit = (text) => {
    const c = matchCountry(countries, text);
    const fail = (m) => { setNotice(m); setShake((s) => s + 1); };
    if (!c) return fail('Pick a country from the suggestions');
    if (path.includes(c._id)) return fail(`${c.name} is already on your route`);
    if (!adj.get(current).has(c._id)) return fail(`${c.name} doesn't border ${name(current)}`);
    setNotice(''); setHint('');
    setPath([...path, c._id]);
    if (c._id === puzzle.target) setStatus('won');
  };

  const giveHint = () => {
    const sp = shortestPath(adj, current, puzzle.target);
    if (sp && sp.length > 1) { setHint(name(sp[1])); setHints((h) => h + 1); }
  };

  const over = status !== 'playing';

  return (
    <div className="animate-rise space-y-4">
      <Card className="flex items-center justify-between px-4 py-3">
        <div className="text-sm"><span className="text-mist">Puzzle </span><span className="font-semibold">{index + 1}</span><span className="text-mist"> / {total}</span></div>
        <div className="flex items-center gap-1.5 rounded-full bg-sun/10 px-3 py-1 text-sm font-semibold text-sun"><Icon name="trophy" className="h-4 w-4" /> {score + earned}</div>
        <button onClick={onQuit} className="text-sm font-medium text-mist transition hover:text-coral">Quit</button>
      </Card>

      <Card className="p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-mist">Travel overland from</p>
        <p className="font-display-tight text-2xl font-bold text-sun">{name(puzzle.start)}</p>
        <p className="my-1 text-mist">↓</p>
        <p className="font-display-tight text-2xl font-bold text-lagoon">{name(puzzle.target)}</p>
        <p className="mt-3 text-sm text-mist">Par: <span className="font-semibold text-sand">{puzzle.par}</span> borders crossed</p>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {path.map((id, i) => (
          <span key={id} className="flex items-center gap-2">
            {i > 0 && <span className="text-mist">→</span>}
            <Chip className={cx('animate-pop', i === 0 ? 'border-sun/40 bg-sun/10 text-sun' : id === puzzle.target ? 'border-lagoon/50 bg-lagoon/15 text-lagoon' : '')}>{name(id)}</Chip>
          </span>
        ))}
        {!over && <span className="text-mist">→ ?</span>}
      </div>

      {!over ? (
        <div className="space-y-3">
          <CountryInput countries={countries} exclude={path} onSubmit={submit} buttonLabel="Hop" shakeKey={shake} />
          <p className={cx('min-h-5 text-sm', notice ? 'text-coral' : 'text-transparent')}>{notice || '.'}</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex gap-4">
              <button disabled={steps === 0} onClick={() => { setPath(path.slice(0, -1)); setHint(''); setNotice(''); }} className="font-medium text-mist transition hover:text-sand disabled:opacity-30">↶ Undo</button>
              <button onClick={giveHint} className="font-medium text-sky transition hover:text-sand">Hint (−1 pt)</button>
            </div>
            <button onClick={() => setStatus('gaveUp')} className="font-medium text-mist transition hover:text-coral">Give up</button>
          </div>
          {hint && <p className="animate-pop rounded-lg bg-sky/10 p-3 text-sm text-sky">Try heading to <b>{hint}</b></p>}
          <p className="text-xs text-mist">Type a country that shares a land border with <b className="text-sand">{name(current)}</b>.</p>
        </div>
      ) : (
        <Card className={cx('animate-pop border-2 p-5', status === 'won' ? 'border-lagoon/50' : 'border-coral/40')}>
          {status === 'won' ? (
            <p className="font-semibold text-lagoon">
              Arrived in {steps} {steps === 1 ? 'step' : 'steps'}{steps === puzzle.par ? ' — perfect route!' : ` (par ${puzzle.par})`} · +{earned} pts
            </p>
          ) : (
            <>
              <p className="font-semibold text-coral">Shortest route</p>
              <p className="mt-1 text-sm text-mist">{solution ? solution.map(name).join(' → ') : '—'}</p>
            </>
          )}
          <Button className="mt-4 w-full" onClick={() => onNext(earned, status === 'won')}>{index + 1 >= total ? 'Finish' : 'Next puzzle'}</Button>
        </Card>
      )}
    </div>
  );
}

export default function BorderHop() {
  const { countries, byCode } = useApp();
  const finish = useFinish();
  const game = GAMES.borderhop;
  const adj = useMemo(() => buildGraph(countries, byCode), [countries, byCode]);
  const byId = useMemo(() => new Map(countries.map((c) => [c._id, c])), [countries]);

  const [level, setLevel] = useState('easy');
  const [phase, setPhase] = useState('setup');
  const [list, setList] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [saved, setSaved] = useState('');

  const start = () => {
    const l = Array.from({ length: PUZZLES }, () => makePuzzle(adj, level)).filter(Boolean);
    setList(l); setIndex(0); setScore(0); setSolved(0); setSaved(''); setPhase('playing');
  };
  const end = async (s) => { setPhase('over'); setSaved(await finish(s)); };
  const next = (earned, ok) => {
    const s = score + earned;
    setScore(s);
    if (ok) setSolved((n) => n + 1);
    if (index + 1 >= list.length) end(s); else setIndex((i) => i + 1);
  };

  const groups = [{ label: 'Route length', value: level, onChange: setLevel, cards: true, options: [
    { id: 'easy', icon: '🌱', label: 'Easy', desc: '3–4 borders to cross' },
    { id: 'medium', icon: '⚡', label: 'Medium', desc: '5–6 borders to cross' },
    { id: 'hard', icon: '🔥', label: 'Hard', desc: '7+ borders — a real expedition' },
  ] }];

  return (
    <div className="mx-auto max-w-xl">
      <GameHeader title={game.title} onBack={() => navigate('home')} />
      {phase === 'setup' && <SetupCard game={game} groups={groups} onStart={start} startLabel={`Start · ${PUZZLES} puzzles`} />}
      {phase === 'playing' && list[index] && (
        <Puzzle key={index} puzzle={list[index]} adj={adj} byId={byId} index={index} total={list.length} score={score} onNext={next}
          onQuit={() => window.confirm('Quit early? Your current score will still be saved.') && end(score)} />
      )}
      {phase === 'over' && (
        <ResultCard big={score} saved={saved} onAgain={() => setPhase('setup')}>
          You completed <span className="font-semibold text-sand">{solved}</span> of {list.length} routes.
        </ResultCard>
      )}
    </div>
  );
}
