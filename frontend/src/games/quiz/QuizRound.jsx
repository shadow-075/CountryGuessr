import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { outlinePath } from '../../lib/geo';
import { cx, fmt } from '../../lib/utils';
import { matchCountry } from '../../lib/names';
import CountryInput from '../../components/CountryInput';
import Flag from '../../components/Flag';
import Globe from '../../components/Globe';
import { Button, Card, Chip, Icon } from '../../components/ui';

const TIME_LIMIT = { easy: null, medium: 60, hard: 20 };

// Which clues unlock (one per wrong guess), per game and difficulty
const HINT_ORDER = {
  flag:      { easy: ['population', 'region', 'subregion', 'borders', 'currency'], medium: ['region', 'capital', 'currency'] },
  capital:   { easy: ['population', 'region', 'subregion', 'borders', 'currency'], medium: ['region', 'subregion', 'currency'] },
  outline:   { easy: ['region', 'subregion', 'capital', 'population', 'currency'], medium: ['region', 'capital', 'currency'] },
  neighbors: { easy: ['region', 'subregion', 'capital', 'population', 'currency'], medium: ['region', 'capital', 'currency'] },
};

function Prompt({ mode, country, byCode, geo }) {
  const outline = useMemo(() => {
    if (mode !== 'outline') return null;
    const entry = geo.get(country._id);
    return entry ? outlinePath(entry.feature) : null;
  }, [mode, country, geo]);

  if (mode === 'flag') {
    return (
      <div className="mx-auto flex h-48 w-full max-w-md items-center justify-center sm:h-60">
        <Flag
          id={country._id}
          alt="Flag to identify"
          imgClassName="max-h-full max-w-full rounded-lg object-contain shadow-2xl shadow-black/50 ring-1 ring-white/10"
        />
      </div>
    );
  }

  if (mode === 'capital') {
    return (
      <div className="py-8 text-center">
        <p className="text-sm uppercase tracking-widest text-mist">is the capital of…</p>
        <h2 className="font-display-tight mt-3 break-words text-4xl font-bold text-sun sm:text-6xl">{country.capital}</h2>
      </div>
    );
  }

  if (mode === 'outline') {
    return (
      <div className="mx-auto aspect-square w-full max-w-xs sm:max-w-sm">
        <svg viewBox="0 0 320 320" className="h-full w-full drop-shadow-[0_10px_30px_rgba(246,196,83,0.25)]" role="img" aria-label="Country outline">
          <defs>
            <linearGradient id="fillGold" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffd36e" />
              <stop offset="100%" stopColor="#d99a1e" />
            </linearGradient>
          </defs>
          {outline && <path d={outline} fill="url(#fillGold)" stroke="#fff3c9" strokeWidth="1" strokeLinejoin="round" />}
        </svg>
      </div>
    );
  }

  // neighbors
  const names = country.borders.map((code) => byCode.get(code)?.name || code);
  return (
    <div className="py-4 text-center">
      <p className="text-sm uppercase tracking-widest text-mist">I share a border with…</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {names.map((n) => (
          <Chip key={n} className="border-lagoon/30 bg-lagoon/10 px-4 py-2 text-base text-lagoon">{n}</Chip>
        ))}
      </div>
    </div>
  );
}

export default function QuizRound({ mode, country, difficulty, index, total, score, onNext, onQuit }) {
  const { countries, byCode, geo } = useApp();
  const limit = TIME_LIMIT[difficulty];

  const [status, setStatus] = useState('guessing'); // guessing | correct | skipped | timeout
  const [wrong, setWrong] = useState(0);
  const [notice, setNotice] = useState('');
  const [shake, setShake] = useState(0);
  const [timeLeft, setTimeLeft] = useState(limit);
  const deadline = useRef(limit ? Date.now() + limit * 1000 : null);

  const over = status !== 'guessing';
  const earned = status === 'correct' ? (difficulty === 'easy' ? 3 : Math.max(1, 3 - wrong)) : 0;

  // Timer based on a deadline so it stays accurate if a phone tab sleeps
  useEffect(() => {
    if (!limit || status !== 'guessing') return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) setStatus('timeout');
    }, 200);
    return () => clearInterval(id);
  }, [limit, status]);

  const guess = (name) => {
    const found = matchCountry(countries, name);
    if (!found) {
      setNotice('Pick a country from the suggestions');
      setShake((s) => s + 1);
      return;
    }
    if (found._id === country._id) {
      setNotice('');
      setStatus('correct');
    } else {
      setWrong((w) => w + 1);
      setNotice(`Not ${found.name} — try again`);
      setShake((s) => s + 1);
    }
  };

  const hints = useMemo(() => {
    const order = HINT_ORDER[mode][difficulty] || [];
    const make = {
      population: ['Population', fmt(country.population)],
      region: ['Region', country.region],
      subregion: ['Subregion', country.subregion],
      capital: ['Capital', country.capital],
      currency: ['Currency', country.currencyName || 'N/A'],
      borders: ['Borders', country.borders?.length ? country.borders.map((c) => byCode.get(c)?.name || c).join(', ') : 'None (island)'],
    };
    return order.slice(0, wrong).map((k) => make[k]);
  }, [mode, difficulty, wrong, country, byCode]);

  const lowTime = limit && timeLeft <= 10;

  return (
    <div className="animate-rise space-y-4">
      {/* HUD */}
      <Card className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm">
          <span className="text-mist">Round </span>
          <span className="font-semibold">{index + 1}</span>
          <span className="text-mist"> / {total}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-sun/10 px-3 py-1 text-sm font-semibold text-sun">
          <Icon name="trophy" className="h-4 w-4" /> {score + earned}
        </div>
        {limit && (
          <div className={cx('flex items-center gap-1.5 text-sm font-semibold tabular-nums', lowTime ? 'text-coral' : 'text-sand')}>
            <Icon name="clock" className="h-4 w-4" /> {timeLeft}s
          </div>
        )}
        <button onClick={onQuit} className="text-sm font-medium text-mist transition hover:text-coral">Quit</button>
      </Card>

      {limit && (
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
          <div className={cx('h-full rounded-full transition-[width] duration-200 ease-linear', lowTime ? 'bg-coral' : 'bg-sun')} style={{ width: `${(timeLeft / limit) * 100}%` }} />
        </div>
      )}

      {/* Prompt */}
      <Card className="px-4 py-6 sm:px-8 sm:py-8">
        <Prompt mode={mode} country={country} byCode={byCode} geo={geo} />
      </Card>

      {/* Hints */}
      {!over && hints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hints.map(([label, value]) => (
            <Chip key={label} className="animate-pop gap-1.5 border-sky/25 bg-sky/10 text-sky">
              <span className="text-sky/70">{label}:</span> <span className="font-semibold">{value}</span>
            </Chip>
          ))}
        </div>
      )}

      {/* Input or result */}
      {!over ? (
        <div className="space-y-3">
          <CountryInput countries={countries} onSubmit={guess} shakeKey={shake} />
          <div className="flex items-center justify-between text-sm">
            <p className={cx('min-h-5', notice ? 'text-coral' : 'text-transparent')}>{notice || '.'}</p>
            <button onClick={() => setStatus('skipped')} className="flex items-center gap-1 font-medium text-mist transition hover:text-sand">
              Skip <Icon name="skip" className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <Card className={cx('animate-pop overflow-hidden border-2 p-5', status === 'correct' ? 'border-lagoon/50' : 'border-coral/40')}>
          <div className="flex items-center gap-4">
            <Globe country={country} size={140} className="h-28 w-28 shrink-0 sm:h-36 sm:w-36" />
            <div className="min-w-0 flex-1">
              <p className={cx('text-sm font-semibold', status === 'correct' ? 'text-lagoon' : 'text-coral')}>
                {status === 'correct' ? `Correct! +${earned} pts` : status === 'timeout' ? "Time's up!" : 'The answer was'}
              </p>
              <h3 className="font-display-tight text-2xl font-bold sm:text-3xl">{country.name}</h3>
              <p className="mt-1 text-sm text-mist">
                {country.capital} · {country.subregion}
              </p>
              <p className="text-sm text-mist">{fmt(country.population)} people</p>
            </div>
          </div>
          <Button size="lg" className="mt-5 w-full" onClick={() => onNext(earned, status === 'correct')}>
            {index + 1 >= total ? 'Finish' : 'Next country'}
          </Button>
        </Card>
      )}
    </div>
  );
}
