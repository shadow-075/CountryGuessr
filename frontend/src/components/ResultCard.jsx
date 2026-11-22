import { navigate } from '../lib/router';
import { Button, Card } from './ui';

const SAVE_TEXT = {
  yes: '✓ Points added to your profile',
  guest: 'Playing as guest — log in to save your score',
  error: "Couldn't reach the server to save your score",
};

export default function ResultCard({ label = 'Session complete', big, bigLabel = 'points', children, saved, onAgain, againLabel = 'Play again' }) {
  return (
    <Card className="animate-pop p-8 text-center">
      <p className="text-sm uppercase tracking-widest text-mist">{label}</p>
      <div className="mx-auto my-6 flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-sun bg-sun/10 shadow-[0_0_60px_-10px_rgb(246_196_83/0.5)]">
        <span className="font-display-tight text-5xl font-bold text-sun">{big}</span>
        <span className="text-xs text-mist">{bigLabel}</span>
      </div>
      <div className="text-mist">{children}</div>
      <p className="mt-2 min-h-5 text-sm text-mist">{SAVE_TEXT[saved] || ''}</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button onClick={onAgain}>{againLabel}</Button>
        <Button variant="secondary" onClick={() => navigate('home')}>All games</Button>
      </div>
    </Card>
  );
}
