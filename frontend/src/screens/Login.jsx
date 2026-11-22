import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, Card, Logo } from '../components/ui';

export default function Login() {
  const { login, loginAsGuest } = useApp();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await login(name.trim());
    } catch {
      setError("Couldn't reach the server. Try again, or play as a guest.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-6 text-center sm:pt-14">
      <Logo className="h-16 w-16" />
      <h1 className="font-display-tight mt-5 text-4xl font-bold sm:text-5xl">
        Where in the <span className="italic text-sun">world</span>?
      </h1>
      <p className="mt-3 text-mist">Flags, capitals, outlines, borders and more. Pick a name to join the global leaderboard.</p>

      <Card className="mt-8 w-full p-5 text-left sm:p-6">
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="username" className="text-xs font-semibold uppercase tracking-widest text-mist">Username</label>
          <input
            id="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={15}
            required
            autoComplete="username"
            placeholder="e.g. MapWizard"
            className="h-12 w-full rounded-xl border border-white/10 bg-ink-900/80 px-4 text-base outline-none transition placeholder:text-mist/60 focus:border-sun/60 focus:ring-2 focus:ring-sun/20"
          />
          {error && <p className="text-sm text-coral">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy || !name.trim()}>{busy ? 'Connecting…' : 'Start playing'}</Button>
        </form>
        <button onClick={loginAsGuest} className="mt-4 w-full text-center text-sm text-mist transition hover:text-sand">
          or continue as guest <span className="text-mist/60">(scores aren&apos;t saved)</span>
        </button>
      </Card>
    </div>
  );
}
