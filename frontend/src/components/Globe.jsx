import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { globePaths } from '../lib/geo';

/** A small globe turned to face a country, with the country highlighted. */
export default function Globe({ country, size = 220, className = '' }) {
  const { features, geo } = useApp();
  const entry = geo.get(country._id);
  const paths = useMemo(() => (entry && features ? globePaths(entry.feature, features, size) : null), [entry, features, size]);
  if (!paths) return null;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={`${country.name} on a globe`}>
      <defs>
        <radialGradient id="ocean" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#1d2f57" />
          <stop offset="100%" stopColor="#0a1226" />
        </radialGradient>
      </defs>
      <path d={paths.sphere} fill="url(#ocean)" stroke="rgb(255 255 255 / 0.15)" />
      <path d={paths.graticule} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="0.6" />
      <path d={paths.land} fill="#2a3b66" stroke="#0a1226" strokeWidth="0.5" />
      <path d={paths.target} fill="#f6c453" stroke="#fff3c9" strokeWidth="1" />
    </svg>
  );
}
