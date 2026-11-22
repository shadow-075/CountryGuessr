import { useEffect, useMemo, useRef, useState } from 'react';
import { normalize, cx } from '../lib/utils';
import { Button } from './ui';

/** Autocomplete field: arrow keys + Enter on desktop, big tap targets on mobile. */
export default function CountryInput({ countries, exclude = [], onSubmit, disabled, buttonLabel = 'Guess', shakeKey = 0 }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!shakeKey) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(t);
  }, [shakeKey]);

  const suggestions = useMemo(() => {
    const q = normalize(value);
    if (!q) return [];
    const skip = new Set(exclude);
    const starts = [];
    const contains = [];
    for (const c of countries) {
      if (skip.has(c._id)) continue;
      const n = normalize(c.name);
      if (n.startsWith(q)) starts.push(c);
      else if (n.includes(q)) contains.push(c);
    }
    return [...starts, ...contains].slice(0, 6);
  }, [value, countries, exclude]);

  const submit = (name) => {
    if (!name.trim()) return;
    onSubmit(name);
    setValue('');
    setOpen(false);
    setActive(-1);
  };

  const pick = (c) => {
    setValue(c.name);
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && active >= 0 && suggestions[active]) {
      e.preventDefault();
      submit(suggestions[active].name);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className="relative"
    >
      <div className={cx('flex gap-2', shaking && 'animate-shake')}>
        <input
          ref={inputRef}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="Type a country…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-label="Country name"
          className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-900/80 px-4 text-base text-sand placeholder:text-mist/60 outline-none transition focus:border-sun/60 focus:ring-2 focus:ring-sun/20 disabled:opacity-50"
        />
        <Button type="submit" disabled={disabled || !value.trim()}>{buttonLabel}</Button>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 bottom-full z-30 mb-2 overflow-hidden rounded-xl border border-white/10 bg-ink-700 shadow-2xl shadow-black/50 sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2"
        >
          {suggestions.map((c, i) => (
            <li key={c._id}>
              <button
                type="button"
                onClick={() => pick(c)}
                className={cx('w-full px-4 py-3 text-left text-base transition', i === active ? 'bg-sun/15 text-sun' : 'hover:bg-white/5')}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
