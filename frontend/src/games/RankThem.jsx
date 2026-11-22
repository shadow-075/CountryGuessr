import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFinish } from '../lib/hooks';
import { navigate } from '../lib/router';
import { cx, fmt, shuffle } from '../lib/utils';
import Flag from '../components/Flag';
import ResultCard from '../components/ResultCard';
import { Button, Card, GameHeader, Icon } from '../components/ui';
import { GAMES } from './registry';

const LIVES = 3;

function makeSet(pool) {
  for (let i = 0; i < 80; i++) {
    const four = shuffle(pool).slice(0, 4);
    const sorted = [...four].sort((a, b) => b.population - a.population);
    if (sorted.every((c, k) => k === 0 || sorted[k - 1].population / c.population >= 1.25)) return { shown: four, order: sorted.map((c) => c._id) };
  }
  const four = shuffle(pool).slice(0, 4);
  return { shown: four, order: [...four].sort((a, b) => b.population - a.population).map((c) => c._id) };
}

export default function RankThem() {
  const { countries } = useApp();
  const finish = useFinish();
  const game = GAMES.rank;
  const pool = useMemo(() => countries.filter((c) => c.population > 0), [countries]);

  const [set, setSet] = useState(() => (pool.length >= 4 ? makeSet(pool) : null));
  const [picked, setPicked] = useState([]);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [slipped, setSlipped] = useState(false); // any mistake this round?
  const [shakeId, setShakeId] = useState(null);
  const [phase, setPhase] = useState('play'); // play | roundDone | over
  const [saved, setSaved] = useState('');
  const scoreRef = useRef(0);

  if (!set) return null;
  const roundDone = picked.length === 4;

  const tap = (c) => {
    if (phase !== 'play' || picked.includes(c._id)) return;
    if (c._id === set.order[picked.length]) {
      const np = [...picked, c._id];
      setPicked(np);
      if (np.length === 4) {
        const gain = slipped ? 1 : 3;
        scoreRef.current += gain;
        setScore(scoreRef.current);
        setRounds((r) => r + 1);
        setPhase('roundDone');
      }
    } else {
      setShakeId(c._id);
      setTimeout(() => setShakeId(null), 400);
      setSlipped(true);
      const l = lives - 1;
      setLives(l);
      if (l <= 0) { setPhase('over'); finish(scoreRef.current).then(setSaved); }
    }
  };

  const nextRound = () => { setSet(makeSet(pool)); setPicked([]); setSlipped(false); setPhase('play'); };
  const again = () => { scoreRef.current = 0; setScore(0); setRounds(0); setLives(LIVES); setSaved(''); nextRound(); };

  if (phase === 'over') {
    return (
      <div className="mx-auto max-w-xl">
        <GameHeader title={game.title} onBack={() => navigate('home')} />
        <ResultCard label="Out of lives" big={score} saved={saved} onAgain={again}>
          You ranked <span className="font-semibold text-sand">{rounds}</span> {rounds === 1 ? 'set' : 'sets'} correctly.
        </ResultCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-4">
      <GameHeader title={game.title} onBack={() => navigate('home')} />
      <Card className="flex items-center justify-between px-4 py-3">
        <div className="flex gap-1.5 text-xl" aria-label={`${lives} lives left`}>
          {Array.from({ length: LIVES }).map((_, i) => <span key={i} className={i < lives ? '' : 'opacity-20 grayscale'}>❤️</span>)}
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-sun/10 px-3 py-1 text-sm font-semibold text-sun"><Icon name="trophy" className="h-4 w-4" /> {score}</div>
      </Card>

      <div className="text-center">
        <h2 className="font-display-tight text-2xl font-bold">Tap from <span className="text-sun">most</span> to <span className="text-sun">least</span> populous</h2>
        <p className="mt-1 text-sm text-mist">Perfect set +3 · with a mistake +1</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {set.shown.map((c) => {
          const rank = picked.indexOf(c._id);
          const locked = rank >= 0;
          return (
            <button
              key={c._id}
              onClick={() => tap(c)}
              disabled={locked || phase !== 'play'}
              className={cx(
                'relative overflow-hidden rounded-2xl border-2 bg-ink-800/70 text-left transition active:scale-[0.97]',
                locked ? 'border-lagoon/60' : 'border-white/10 hover:border-white/30',
                shakeId === c._id && 'animate-shake border-coral'
              )}
            >
              <div className="flex h-24 items-center justify-center bg-ink-900/60 p-3 sm:h-28">
                <Flag id={c._id} imgClassName="max-h-full max-w-full rounded-sm object-contain shadow-lg" />
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate font-semibold">{c.name}</p>
                <p className={cx('text-xs tabular-nums', locked ? 'text-lagoon' : 'text-transparent')}>{locked ? fmt(c.population) : '.'}</p>
              </div>
              {locked && <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-lagoon text-sm font-bold text-ink-950">{rank + 1}</span>}
            </button>
          );
        })}
      </div>

      {roundDone && (
        <Button size="lg" className="w-full animate-pop" onClick={nextRound}>Next set</Button>
      )}
    </div>
  );
}
