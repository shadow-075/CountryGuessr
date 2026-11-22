import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { flagSrc } from '../../lib/api';
import { navigate } from '../../lib/router';
import { shuffle } from '../../lib/utils';
import { Button, Card, ErrorCard, GameHeader, Loader } from '../../components/ui';
import { GAMES } from '../registry';
import QuizSetup from './QuizSetup';
import QuizRound from './QuizRound';

function eligible(c, mode, geo) {
  if (mode === 'capital') return !!c.capital && c.capital !== 'Unknown';
  if (mode === 'neighbors') return c.borders?.length > 0;
  if (mode === 'outline') return geo.has(c._id);
  return true;
}

export default function QuizGame({ mode }) {
  const { countries, geo, geoStatus, submitScore, user } = useApp();
  const game = GAMES[mode];

  const [phase, setPhase] = useState('setup'); // setup | playing | over
  const [pool, setPool] = useState([]);
  const [difficulty, setDifficulty] = useState('easy');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [saved, setSaved] = useState(null);

  const candidates = useMemo(() => countries.filter((c) => eligible(c, mode, geo)), [countries, mode, geo]);
  const poolSize = (regions) => (regions.length ? candidates.filter((c) => regions.includes(c.region)).length : candidates.length);

  // Preload the next flag so rounds feel instant
  useEffect(() => {
    if (phase === 'playing' && mode === 'flag' && pool[index + 1]) new Image().src = flagSrc(pool[index + 1]._id);
  }, [phase, mode, pool, index]);

  if (game.needsGeo && geoStatus === 'loading') return <Loader title="Drawing the world…" />;
  if (game.needsGeo && geoStatus === 'error') {
    return (
      <ErrorCard title="Map data unavailable" action={<Button onClick={() => navigate('home')}>Back to games</Button>}>
        The country shapes couldn&apos;t be downloaded. Check your connection, or place a <code>countries.geo.json</code> file in <code>public/</code>.
      </ErrorCard>
    );
  }

  const start = ({ regions, difficulty: diff, rounds }) => {
    let list = regions.length ? candidates.filter((c) => regions.includes(c.region)) : candidates;
    list = shuffle(list);
    if (rounds !== 'all') list = list.slice(0, rounds);
    setPool(list);
    setDifficulty(diff);
    setIndex(0);
    setScore(0);
    setCorrect(0);
    setSaved(null);
    setPhase('playing');
  };

  const finish = async (finalScore) => {
    setPhase('over');
    if (user?.guest) return setSaved('guest');
    const res = await submitScore(finalScore);
    setSaved(res.saved ? 'yes' : finalScore > 0 ? 'error' : 'none');
  };

  const next = (earned, wasCorrect) => {
    const newScore = score + earned;
    setScore(newScore);
    if (wasCorrect) setCorrect((c) => c + 1);
    if (index + 1 >= pool.length) finish(newScore);
    else setIndex((i) => i + 1);
  };

  const quit = () => {
    if (window.confirm('Quit early? Your current score will still be saved.')) finish(score);
  };

  return (
    <div className="mx-auto max-w-xl">
      <GameHeader title={game.title} onBack={() => navigate('home')} />

      {phase === 'setup' && <QuizSetup game={game} poolSize={poolSize} onStart={start} />}

      {phase === 'playing' && pool[index] && (
        <QuizRound
          key={`${index}-${pool[index]._id}`}
          mode={mode}
          country={pool[index]}
          difficulty={difficulty}
          index={index}
          total={pool.length}
          score={score}
          onNext={next}
          onQuit={quit}
        />
      )}

      {phase === 'over' && (
        <Card className="animate-pop p-8 text-center">
          <p className="text-sm uppercase tracking-widest text-mist">Session complete</p>
          <div className="mx-auto my-6 flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-sun bg-sun/10 shadow-[0_0_60px_-10px_rgb(246_196_83/0.5)]">
            <span className="font-display-tight text-5xl font-bold text-sun">{score}</span>
            <span className="text-xs text-mist">points</span>
          </div>
          <p className="text-mist">
            You got <span className="font-semibold text-sand">{correct}</span> of {Math.min(index + 1, pool.length)} right.
          </p>
          <p className="mt-1 min-h-5 text-sm text-mist">
            {saved === 'yes' && '✓ Points added to your profile'}
            {saved === 'guest' && 'Playing as guest — log in to save your score'}
            {saved === 'error' && "Couldn't reach the server to save your score"}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button onClick={() => setPhase('setup')}>Play again</Button>
            <Button variant="secondary" onClick={() => navigate('home')}>All games</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
