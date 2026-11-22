import { useApp } from '../context/AppContext';
import { navigate } from '../lib/router';
import { Button, Card, Icon } from '../components/ui';

const RANKS = [
  [0, 'Tourist', '🎒'],
  [50, 'Backpacker', '🧭'],
  [200, 'Navigator', '⛵'],
  [600, 'Cartographer', '🗺️'],
  [1500, 'Globetrotter', '🌍'],
];

export default function Profile() {
  const { user, logout } = useApp();
  if (!user) return null;
  const pts = user.totalScore || 0;
  const idx = RANKS.reduce((acc, [min], i) => (pts >= min ? i : acc), 0);
  const [, title, emoji] = RANKS[idx];
  const next = RANKS[idx + 1];
  const progress = next ? Math.min(100, ((pts - RANKS[idx][0]) / (next[0] - RANKS[idx][0])) * 100) : 100;

  const stats = [
    ['Total points', pts],
    ['Games played', user.gamesPlayed ?? 0],
    ['Avg. per game', user.gamesPlayed ? (pts / user.gamesPlayed).toFixed(1) : '—'],
    ['Joined', user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'],
  ];

  return (
    <div className="mx-auto max-w-xl animate-rise space-y-4">
      <Card className="p-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-sun/40 bg-sun/10 text-4xl">{emoji}</div>
        <h1 className="font-display-tight mt-4 text-3xl font-bold">{user.guest ? 'Guest' : user.username}</h1>
        <p className="text-sun">{title}</p>
        {user.guest ? (
          <p className="mt-4 text-sm text-mist">Guests can&apos;t save scores. Log out and create a username to join the leaderboard.</p>
        ) : (
          next && (
            <div className="mx-auto mt-5 max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-sun" style={{ width: `${progress}%` }} /></div>
              <p className="mt-2 text-xs text-mist">{next[0] - pts} pts to {next[1]} {next[2]}</p>
            </div>
          )
        )}
      </Card>

      {!user.guest && (
        <div className="grid grid-cols-2 gap-3">
          {stats.map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-xs uppercase tracking-wider text-mist">{label}</p>
              <p className="font-display-tight mt-1 text-2xl font-bold">{value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={() => navigate('home')}>Play now</Button>
        <Button variant="danger" onClick={logout}><Icon name="logout" className="h-4 w-4" />Log out</Button>
      </div>
    </div>
  );
}
