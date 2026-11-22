import { cx } from '../lib/utils';

const ICONS = {
  home: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  trophy: ['M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z', 'M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3'],
  user: ['M20 21a8 8 0 0 0-16 0', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  back: ['M15 18l-6-6 6-6'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5M21 12H9'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 7v5l3 2'],
  share: ['M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7', 'M16 6l-4-4-4 4M12 2v14'],
  up: ['M12 19V5M5 12l7-7 7 7'],
  down: ['M12 5v14M19 12l-7 7-7-7'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18M6 6l12 12'],
  flame: ['M12 22c4 0 7-2.6 7-6.5 0-3-2-5-3.5-6.5C14.5 8 14 6 14 4c-3 2-6 5-6 9 0 1 .3 2 1 2.5C9 14 8 12.5 8 11c-2 1.500-3 3.500-3 5.500C5 19.400 8 22 12 22z'],
  skip: ['M5 4l10 8-10 8zM19 5v14'],
};

export function Icon({ name, className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name].map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

export function Logo({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="#f6c453" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="32" cy="32" r="22" />
      <ellipse cx="32" cy="32" rx="9.500" ry="22" />
      <path d="M10 32h44M14 21h36M14 43h36" />
    </svg>
  );
}

const VARIANTS = {
  primary: 'bg-sun text-ink-950 hover:bg-[#ffd36e] shadow-[0_8px_24px_-8px_rgb(246_196_83/0.6)]',
  secondary: 'bg-ink-700 text-sand hover:bg-ink-600 border border-white/10',
  ghost: 'text-mist hover:text-sand hover:bg-white/5',
  danger: 'text-coral border border-coral/40 hover:bg-coral/10',
};
const SIZES = { sm: 'h-9 px-3 text-sm', md: 'h-12 px-5 text-base', lg: 'h-14 px-7 text-lg' };

export function Button({ variant = 'primary', size = 'md', className, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none',
        VARIANTS[variant], SIZES[size], className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }) {
  return <div className={cx('rounded-2xl border border-white/10 bg-ink-800/70 backdrop-blur-sm shadow-xl shadow-black/20', className)} {...props} />;
}

export function Spinner({ className = 'w-8 h-8' }) {
  return <div className={cx('rounded-full border-2 border-white/10 border-t-sun animate-spin', className)} role="status" aria-label="Loading" />;
}

export function Chip({ className, children }) {
  return <span className={cx('inline-flex items-center rounded-full border border-white/10 bg-ink-700/80 px-3 py-1 text-sm', className)}>{children}</span>;
}

export function Loader({ title = 'Loading…', note }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Spinner className="w-10 h-10" />
      <p className="font-display text-xl">{title}</p>
      {note && <p className="max-w-xs text-sm text-mist">{note}</p>}
    </div>
  );
}

export function ErrorCard({ title, children, action }) {
  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <p className="text-4xl">🛰️</p>
      <h2 className="mt-3 font-display text-2xl">{title}</h2>
      <div className="mt-2 text-sm text-mist">{children}</div>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

/** Header strip used at the top of every game */
export function GameHeader({ title, onBack, children }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <button onClick={onBack} className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-2 text-mist transition hover:text-sand">
        <Icon name="back" />
        <span className="text-sm font-medium">Games</span>
      </button>
      <h1 className="font-display-tight truncate text-lg font-semibold sm:text-xl">{title}</h1>
      <div className="flex min-w-16 justify-end">{children}</div>
    </div>
  );
}
