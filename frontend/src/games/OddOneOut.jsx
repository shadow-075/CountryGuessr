import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFinish } from '../lib/hooks';
import { navigate } from '../lib/router';
import { cx, pick, shuffle } from '../lib/utils';
import Flag from '../components/Flag';
import ResultCard from '../components/ResultCard';
import SetupCard from '../components/SetupCard';
import { Button, Card, GameHeader, Icon } from '../components/ui';
import { GAMES } from './registry';

function makeRound(countries, level) {
  const bySub = {};
  countries.forEach((c) => { if (c.subregion && c.subregion !== 'Unknown') (bySub[c.subregion] ||= []).push(c); });
  const subs = Object.keys(bySub).filter((s) => bySub[s].length >= 3);
  for (let i = 0; i < 50; i++) {
    const sub = pick(subs);
    const trio = shuffle(bySub[sub]).slice(0, 3);
    const region = trio[0].region;
    const odds = level === 'easy' ? countries.filter((c) => c.region !== region && c.region !== 'Unknown') : countries.filter((c) => c.region === region && c.subregion !== sub && c.subregion !== 'Unknown');
    if (!odds.length) continue;
    const odd = pick(odds);
    return { options: shuffle([...trio, odd]), odd, sub };
  }
  return null;
}

function Round({ round, level, index, total, score, onNext, onQuit }) {
  const [chosen, setChosen] = useState(null);
  const over = chosen !== null;
  const ok = over && chosen === round.odd._id;
  const pts = level === 'easy' ? 2 : 3;

  return (
    <div className="animate-rise space-y-4">
      <Card className="flex items-center justify-between px-4 py-3">
        <div className="text-sm"><span className="text-mist">Round </span><span className="font-semibold">{index + 1}</span><span className="text-mist"> / {total}</span></div>
        <div className="flex items-center gap-1.5 rounded-full bg-sun/10 px-3 py-1 text-sm font-semibold text-sun"><Icon name="trophy" className="h-4 w-4" /> {score + (ok ? pts : 0)}</div>
        <button onClick={onQuit} className="text-sm font-medium text-mist transition hover:text-coral">Quit</button>
      </Card>

      <h2 className="font-display-tight text-center text-2xl font-bold">Which one doesn&apos;t belong?</h2>

      <div className="grid grid-cols-2 gap-3">
        {round.options.map((c) => {
          const isOdd = c._id === round.odd._id;
          const state = !over ? 'idle' : isOdd ? 'odd' : chosen === c._id ? 'wrong' : 'dim';
          return (
            <button
              key={c._id}
              disabled={over}
              onClick={() => setChosen(c._id)}
              className={cx(
                'overflow-hidden rounded-2xl border-2 bg-ink-800/70 text-left transition active:scale-[0.97]',
                state === 'idle' && 'border-white/10 hover:border-white/30',
                state === 'odd' && 'border-lagoon',
                state === 'wrong' && 'border-coral',
                state === 'dim' && 'border-white/5 opacity-60'
              )}
            >
              <div className="flex h-24 items-center justify-center bg-ink-900/60 p-3 sm:h-32">
                <Flag id={c._id} alt={`Flag of ${c.name}`} imgClassName="max-h-full max-w-full rounded-sm object-contain shadow-lg" />
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate font-semibold">{c.name}</p>
                <p className={cx('truncate text-xs', over ? 'text-mist' : 'text-transparent')}>{over ? c.subregion : '.'}</p>
              </div>
            </button>
          );
        })}
      </div>

      {over && (
        <Card className={cx('animate-pop border-2 p-4', ok ? 'border-lagoon/50' : 'border-coral/40')}>
          <p className={cx('font-semibold', ok ? 'text-lagoon' : 'text-coral')}>{ok ? `Correct! +${pts} pts` : 'Not quite'}</p>
          <p className="mt-1 text-sm text-mist">
            The other three are in <span className="text-sand">{round.sub}</span>. <span className="text-sand">{round.odd.name}</span> is in {round.odd.subregion}.
          </p>
          <Button className="mt-4 w-full" onClick={() => onNext(ok ? pts : 0, ok)}>{index + 1 >= total ? 'Finish' : 'Next'}</Button>
        </Card>
      )}
    </div>
  );
}

export default function OddOneOut() {
  const { countries } = useApp();
  const finish = useFinish();
  const game = GAMES.oddone;
  const [level, setLevel] = useState('easy');
  const [rounds, setRounds] = useState(10);
  const [phase, setPhase] = useState('setup');
  const [list, setList] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [saved, setSaved] = useState('');

  const usable = useMemo(() => countries.filter((c) => c.region && c.region !== 'Unknown'), [countries]);

  const start = () => {
    const r = Array.from({ length: rounds }, () => makeRound(usable, level)).filter(Boolean);
    setList(r); setIndex(0); setScore(0); setCorrect(0); setSaved(''); setPhase('playing');
  };
  const end = async (s) => { setPhase('over'); setSaved(await finish(s)); };
  const next = (earned, ok) => {
    const s = score + earned;
    setScore(s);
    if (ok) setCorrect((c) => c + 1);
    if (index + 1 >= list.length) end(s); else setIndex((i) => i + 1);
  };

  const groups = [
    { label: 'Difficulty', value: level, onChange: setLevel, cards: true, options: [
      { id: 'easy', icon: '🌱', label: 'Easy', desc: 'The odd one is on another continent · 2 pts' },
      { id: 'hard', icon: '🔥', label: 'Hard', desc: 'Same continent, different subregion · 3 pts' },
    ] },
    { label: 'Rounds', value: rounds, onChange: setRounds, options: [{ id: 10, label: '10' }, { id: 20, label: '20' }] },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <GameHeader title={game.title} onBack={() => navigate('home')} />
      {phase === 'setup' && <SetupCard game={game} groups={groups} onStart={start} startLabel={`Start · ${rounds} rounds`} />}
      {phase === 'playing' && list[index] && (
        <Round key={index} round={list[index]} level={level} index={index} total={list.length} score={score} onNext={next}
          onQuit={() => window.confirm('Quit early? Your current score will still be saved.') && end(score)} />
      )}
      {phase === 'over' && (
        <ResultCard big={score} saved={saved} onAgain={() => setPhase('setup')}>
          You spotted <span className="font-semibold text-sand">{correct}</span> of {Math.min(index + 1, list.length)} odd ones.
        </ResultCard>
      )}
    </div>
  );
}
