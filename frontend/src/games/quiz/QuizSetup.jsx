import { useState } from 'react';
import { Button, Card } from '../../components/ui';
import { cx } from '../../lib/utils';

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
const DIFFICULTIES = [
  { id: 'easy', icon: '🌱', title: 'Easy', desc: 'No timer · a hint after every miss · flat 3 pts' },
  { id: 'medium', icon: '⚡', title: 'Medium', desc: '60s timer · 3 hints · points drop per miss' },
  { id: 'hard', icon: '🔥', title: 'Hard', desc: '20s timer · no hints · points drop per miss' },
];
const ROUNDS = [10, 20, 'all'];

const pill = (on) =>
  cx('rounded-full border px-4 py-2 text-sm font-medium transition', on ? 'border-sun bg-sun/15 text-sun' : 'border-white/10 bg-ink-700/60 text-mist hover:text-sand');

export default function QuizSetup({ game, poolSize, onStart, hideDifficulty = false }) {
  const [regions, setRegions] = useState([]); // empty = everywhere
  const [difficulty, setDifficulty] = useState('easy');
  const [rounds, setRounds] = useState(10);

  const toggle = (r) => setRegions((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  const available = poolSize(regions);
  const total = rounds === 'all' ? available : Math.min(rounds, available);

  return (
    <Card className="animate-rise p-5 sm:p-8">
      <div className="mb-6 flex items-center gap-4">
        <span className="text-5xl">{game.emoji}</span>
        <div>
          <h2 className="font-display-tight text-2xl font-bold">{game.title}</h2>
          <p className="text-sm text-mist">{game.blurb}</p>
        </div>
      </div>

      <section className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">Where in the world</h3>
        <div className="flex flex-wrap gap-2">
          <button className={pill(regions.length === 0)} onClick={() => setRegions([])}>Everywhere</button>
          {REGIONS.map((r) => (
            <button key={r} className={pill(regions.includes(r))} onClick={() => toggle(r)}>{r}</button>
          ))}
        </div>
      </section>

      {!hideDifficulty && <section className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">Difficulty</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={cx('rounded-xl border p-4 text-left transition', difficulty === d.id ? 'border-sun bg-sun/10' : 'border-white/10 bg-ink-700/40 hover:border-white/25')}
            >
              <div className="flex items-center gap-2 font-semibold"><span>{d.icon}</span>{d.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-mist">{d.desc}</p>
            </button>
          ))}
        </div>
      </section>}

      <section className="mb-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">Rounds</h3>
        <div className="flex gap-2">
          {ROUNDS.map((r) => (
            <button key={r} className={pill(rounds === r)} onClick={() => setRounds(r)}>{r === 'all' ? `All (${available})` : r}</button>
          ))}
        </div>
      </section>

      <Button size="lg" className="w-full" disabled={available === 0} onClick={() => onStart({ regions, difficulty, rounds })}>
        {available === 0 ? 'No countries match' : `Start · ${total} rounds`}
      </Button>
    </Card>
  );
}
