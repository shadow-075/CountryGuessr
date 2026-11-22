import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { geoArea, viewFor, worldMap } from '../lib/geo';
import { useFinish } from '../lib/hooks';
import { navigate } from '../lib/router';
import { cx, shuffle } from '../lib/utils';
import Globe from '../components/Globe';
import ResultCard from '../components/ResultCard';
import WorldMap from '../components/WorldMap';
import { Button, Card, GameHeader, Icon } from '../components/ui';
import { GAMES } from './registry';
import QuizSetup from './quiz/QuizSetup';

const MAX_TRIES = 3;
const MIN_AREA = 3e-5; // skip specks too small to tap (~15,000 km²)

function MapRound({ country, world, features, featureCountry, view0, index, total, score, onNext, onQuit }) {
  const [wrong, setWrong] = useState([]);
  const [status, setStatus] = useState('guessing'); // guessing | correct | failed
  const [last, setLast] = useState('');
  const over = status !== 'guessing';
  const earned = status === 'correct' ? MAX_TRIES - wrong.length : 0;

  const pick = (c) => {
    if (over || wrong.includes(c._id)) return;
    if (c._id === country._id) return setStatus('correct');
    const next = [...wrong, c._id];
    setWrong(next);
    setLast(c.name);
    if (next.length >= MAX_TRIES) setStatus('failed');
  };

  return (
    <div className="animate-rise space-y-3">
      <Card className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm"><span className="text-mist">Round </span><span className="font-semibold">{index + 1}</span><span className="text-mist"> / {total}</span></div>
        <div className="flex items-center gap-1.5 rounded-full bg-sun/10 px-3 py-1 text-sm font-semibold text-sun"><Icon name="trophy" className="h-4 w-4" /> {score + earned}</div>
        <div className="flex gap-1" aria-label="Tries left">
          {Array.from({ length: MAX_TRIES }).map((_, i) => <span key={i} className={cx('h-2.5 w-2.5 rounded-full', i < MAX_TRIES - wrong.length ? 'bg-sun' : 'bg-ink-600')} />)}
        </div>
        <button onClick={onQuit} className="text-sm font-medium text-mist transition hover:text-coral">Quit</button>
      </Card>

      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-mist">Find on the map</p>
        <h2 className="font-display-tight text-3xl font-bold text-sun sm:text-4xl">{country.name}</h2>
      </div>

      <WorldMap
        world={world} features={features} featureCountry={featureCountry} view0={view0}
        onPick={pick} wrongIds={wrong} revealId={over ? country._id : null}
        className="h-[52dvh] min-h-72 sm:h-[460px]"
      />
      <p className="min-h-5 text-center text-sm text-mist">
        {!over && (last ? <span className="text-coral">That was {last}. {MAX_TRIES - wrong.length} {MAX_TRIES - wrong.length === 1 ? 'try' : 'tries'} left.</span> : 'Tap a country · drag to pan · pinch or +/− to zoom')}
      </p>

      {over ? (
        <Card className={cx('animate-pop flex items-center gap-4 border-2 p-4', status === 'correct' ? 'border-lagoon/50' : 'border-coral/40')}>
          <Globe country={country} size={110} className="h-20 w-20 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className={cx('text-sm font-semibold', status === 'correct' ? 'text-lagoon' : 'text-coral')}>{status === 'correct' ? `Found it! +${earned} pts` : "It's highlighted in green"}</p>
            <p className="text-sm text-mist">{country.capital} · {country.subregion}</p>
          </div>
          <Button onClick={() => onNext(earned, status === 'correct')}>{index + 1 >= total ? 'Finish' : 'Next'}</Button>
        </Card>
      ) : (
        <div className="text-center">
          <button onClick={() => setStatus('failed')} className="text-sm font-medium text-mist transition hover:text-sand">Show me</button>
        </div>
      )}
    </div>
  );
}

export default function FindOnMap() {
  const { countries, geo, features } = useApp();
  const finish = useFinish();
  const game = GAMES.findmap;

  const [phase, setPhase] = useState('setup');
  const [pool, setPool] = useState([]);
  const [regions, setRegions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [saved, setSaved] = useState('');

  const world = useMemo(() => worldMap(features), [features]);
  const featureCountry = useMemo(() => {
    const byId = new Map(countries.map((c) => [c._id, c]));
    const m = new Map();
    geo.forEach((v, id) => m.set(v.feature, byId.get(id)));
    return m;
  }, [countries, geo]);
  const candidates = useMemo(() => countries.filter((c) => geo.has(c._id) && geoArea(geo.get(c._id).feature) > MIN_AREA), [countries, geo]);
  const poolSize = (r) => (r.length ? candidates.filter((c) => r.includes(c.region)).length : candidates.length);
  const view0 = useMemo(() => viewFor(regions, world.projection), [regions, world]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [phase]);

  const start = ({ regions: r, rounds }) => {
    let list = shuffle(r.length ? candidates.filter((c) => r.includes(c.region)) : candidates);
    if (rounds !== 'all') list = list.slice(0, rounds);
    setRegions(r); setPool(list); setIndex(0); setScore(0); setCorrect(0); setSaved(''); setPhase('playing');
  };

  const end = async (final) => {
    setPhase('over');
    setSaved(await finish(final));
  };

  const next = (earned, ok) => {
    const s = score + earned;
    setScore(s);
    if (ok) setCorrect((c) => c + 1);
    if (index + 1 >= pool.length) end(s);
    else setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <GameHeader title={game.title} onBack={() => navigate('home')} />
      {phase === 'setup' && <div className="mx-auto max-w-xl"><QuizSetup game={game} poolSize={poolSize} hideDifficulty onStart={start} /></div>}
      {phase === 'playing' && pool[index] && (
        <MapRound
          key={pool[index]._id}
          country={pool[index]} world={world} features={features} featureCountry={featureCountry} view0={view0}
          index={index} total={pool.length} score={score} onNext={next}
          onQuit={() => window.confirm('Quit early? Your current score will still be saved.') && end(score)}
        />
      )}
      {phase === 'over' && (
        <div className="mx-auto max-w-xl">
          <ResultCard big={score} saved={saved} onAgain={() => setPhase('setup')}>
            You found <span className="font-semibold text-sand">{correct}</span> of {Math.min(index + 1, pool.length)} countries.
          </ResultCard>
        </div>
      )}
    </div>
  );
}
