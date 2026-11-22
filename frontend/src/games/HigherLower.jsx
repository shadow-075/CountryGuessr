import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { flagSrc } from '../lib/api';
import Flag from '../components/Flag';
import { navigate } from '../lib/router';
import { cx, fmt, pick } from '../lib/utils';
import { Button, Card, GameHeader, Icon, Loader } from '../components/ui';

function useCountUp(target, run, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) {
      setValue(0);
      return;
    }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return run ? value : 0;
}

function CountryCard({ country, reveal, tone, animate = false }) {
  const shown = useCountUp(country.population, reveal && animate);
  return (
    <Card className={cx('flex-1 overflow-hidden border-2 transition-colors', tone === 'good' ? 'border-lagoon/60' : tone === 'bad' ? 'border-coral/60' : 'border-white/10')}>
      <div className="relative h-32 sm:h-44">
        <Flag id={country._id} className="h-full w-full" imgClassName="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/30 to-transparent" />
      </div>
      <div className="px-4 pb-4 pt-2 text-center">
        <h3 className="font-display-tight text-xl font-bold sm:text-2xl">{country.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-widest text-mist">population</p>
        <p className="font-display-tight text-3xl font-bold tabular-nums text-sun sm:text-4xl">{reveal ? fmt(animate ? shown : country.population) : '?'}</p>
      </div>
    </Card>
  );
}

export default function HigherLower() {
  const { countries, submitScore, user } = useApp();
  const pool = useMemo(() => countries.filter((c) => c.population > 0), [countries]);
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [upcoming, setUpcoming] = useState(null); // drawn early so its flag can preload
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('hl-best')) || 0);
  const [phase, setPhase] = useState('ask'); // ask | right | wrong | over
  const [saved, setSaved] = useState('');
  const streakRef = useRef(0);

  const draw = (avoid) => {
    let c;
    do c = pick(pool); while (c._id === avoid?._id || (avoid && c.population === avoid.population));
    return c;
  };

  const reset = () => {
    const a = draw();
    const b = draw(a);
    setLeft(a);
    setRight(b);
    setUpcoming(draw(b));
    setStreak(0);
    streakRef.current = 0;
    setPhase('ask');
    setSaved('');
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (pool.length > 2 && !left) reset(); }, [pool]);

  // Warm the browser cache for the next flag while the player is deciding
  useEffect(() => {
    if (upcoming) new Image().src = flagSrc(upcoming._id);
  }, [upcoming]);

  // After revealing, move on (correct) or end (wrong)
  useEffect(() => {
    if (phase !== 'right' && phase !== 'wrong') return;
    const t = setTimeout(async () => {
      if (phase === 'right') {
        setLeft(right);
        setRight(upcoming);
        setUpcoming(draw(upcoming));
        setPhase('ask');
      } else {
        setPhase('over');
        const final = streakRef.current;
        if (final > best) { setBest(final); localStorage.setItem('hl-best', String(final)); }
        if (user?.guest) return setSaved('guest');
        const res = await submitScore(final);
        setSaved(res.saved ? 'yes' : '');
      }
    }, phase === 'right' ? 1600 : 1900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!left || !right) return <Loader title="Counting people…" />;

  const answer = (higher) => {
    const isHigher = right.population > left.population;
    if (higher === isHigher) {
      streakRef.current += 1;
      setStreak(streakRef.current);
      setPhase('right');
    } else {
      setPhase('wrong');
    }
  };

  const revealing = phase !== 'ask';

  return (
    <div className="mx-auto max-w-3xl">
      <GameHeader title="Higher or Lower" onBack={() => navigate('home')}>
        <div className="flex items-center gap-1 rounded-full bg-sun/10 px-3 py-1 text-sm font-bold text-sun">
          <Icon name="flame" className="h-4 w-4" /> {streak}
        </div>
      </GameHeader>

      {phase === 'over' ? (
        <Card className="animate-pop p-8 text-center">
          <p className="text-sm uppercase tracking-widest text-mist">Streak ended</p>
          <p className="font-display-tight my-4 text-7xl font-bold text-sun">{streakRef.current}</p>
          <p className="text-mist">Best streak: <span className="font-semibold text-sand">{best}</span></p>
          <p className="mt-1 min-h-5 text-sm text-mist">
            {saved === 'yes' && '✓ Points added to your profile'}
            {saved === 'guest' && 'Playing as guest — log in to save your score'}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button onClick={reset}>Play again</Button>
            <Button variant="secondary" onClick={() => navigate('home')}>All games</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="relative flex flex-col gap-3 sm:flex-row">
            <CountryCard country={left} reveal />
            <div className="absolute left-1/2 top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink-950 text-xs font-bold text-mist">VS</div>
            <CountryCard country={right} animate reveal={revealing} tone={phase === 'right' ? 'good' : phase === 'wrong' ? 'bad' : null} />
          </div>

          <p className="text-center text-sm text-mist">
            Does <span className="font-semibold text-sand">{right.name}</span> have a <span className="font-semibold text-sand">higher</span> or <span className="font-semibold text-sand">lower</span> population than {left.name}?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" disabled={revealing} onClick={() => answer(true)}><Icon name="up" /> Higher</Button>
            <Button size="lg" variant="secondary" disabled={revealing} onClick={() => answer(false)}><Icon name="down" /> Lower</Button>
          </div>
        </div>
      )}
    </div>
  );
}
