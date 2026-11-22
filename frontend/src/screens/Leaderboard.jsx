import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getLeaderboard } from '../lib/api';
import { cx } from '../lib/utils';
import { Button, Card, ErrorCard, Loader } from '../components/ui';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user } = useApp();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setRows(null);
    getLeaderboard().then(setRows).catch(() => setError(true));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  if (error) return <ErrorCard title="Couldn't load the leaderboard" action={<Button onClick={load}>Try again</Button>}>The server may be waking up.</ErrorCard>;
  if (!rows) return <Loader title="Fetching rankings…" />;

  return (
    <div className="mx-auto max-w-xl animate-rise">
      <h1 className="font-display-tight text-3xl font-bold">Global leaderboard</h1>
      <p className="mb-6 mt-1 text-sm text-mist">Top 10 explorers by total points.</p>
      <Card className="divide-y divide-white/5 overflow-hidden">
        {rows.length === 0 && <p className="p-8 text-center text-mist">No players yet — be the first!</p>}
        {rows.map((r, i) => (
          <div key={r._id} className={cx('flex items-center gap-4 px-4 py-3.5', r.username === user?.username && 'bg-sun/10')}>
            <span className="w-8 text-center text-xl">{MEDALS[i] || <span className="text-sm font-semibold text-mist">#{i + 1}</span>}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.username}{r.username === user?.username && <span className="ml-2 text-xs text-sun">you</span>}</p>
              <p className="text-xs text-mist">{r.gamesPlayed} games</p>
            </div>
            <span className="font-display-tight text-xl font-bold text-sun tabular-nums">{r.totalScore}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
