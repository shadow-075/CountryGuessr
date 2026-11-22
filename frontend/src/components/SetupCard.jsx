import { Button, Card } from './ui';
import { cx } from '../lib/utils';

const pill = (on) =>
  cx('rounded-full border px-4 py-2 text-sm font-medium transition', on ? 'border-sun bg-sun/15 text-sun' : 'border-white/10 bg-ink-700/60 text-mist hover:text-sand');

/** Generic single-select setup panel. groups: [{ label, value, onChange, options: [{id,label,desc?,icon?}], cards? }] */
export default function SetupCard({ game, groups, onStart, startLabel, disabled }) {
  return (
    <Card className="animate-rise p-5 sm:p-8">
      <div className="mb-6 flex items-center gap-4">
        <span className="text-5xl">{game.emoji}</span>
        <div>
          <h2 className="font-display-tight text-2xl font-bold">{game.title}</h2>
          <p className="text-sm text-mist">{game.blurb}</p>
        </div>
      </div>
      {groups.map((g) => (
        <section key={g.label} className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">{g.label}</h3>
          {g.cards ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {g.options.map((o) => (
                <button key={o.id} onClick={() => g.onChange(o.id)} className={cx('rounded-xl border p-4 text-left transition', g.value === o.id ? 'border-sun bg-sun/10' : 'border-white/10 bg-ink-700/40 hover:border-white/25')}>
                  <div className="flex items-center gap-2 font-semibold"><span>{o.icon}</span>{o.label}</div>
                  {o.desc && <p className="mt-1 text-xs leading-relaxed text-mist">{o.desc}</p>}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => <button key={o.id} className={pill(g.value === o.id)} onClick={() => g.onChange(o.id)}>{o.label}</button>)}
            </div>
          )}
        </section>
      ))}
      <Button size="lg" className="w-full" disabled={disabled} onClick={onStart}>{startLabel}</Button>
    </Card>
  );
}
