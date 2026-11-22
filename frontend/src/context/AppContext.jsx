import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCountries, loginUser, postScore } from '../lib/api';
import { buildGeoIndex, loadWorld } from '../lib/geo';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const STORAGE_KEY = 'guessrUser';

export function AppProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [features, setFeatures] = useState(null);
  const [geoStatus, setGeoStatus] = useState('loading');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  });

  const loadCountries = useCallback(() => {
    setStatus('loading');
    getCountries()
      .then((data) => {
        setCountries(Array.isArray(data) ? data : []);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    loadCountries();
    loadWorld()
      .then((f) => {
        setFeatures(f);
        setGeoStatus('ready');
      })
      .catch(() => setGeoStatus('error'));
  }, [loadCountries]);

  const geo = useMemo(
    () => (features && countries.length ? buildGeoIndex(countries, features) : new Map()),
    [features, countries]
  );

  const byCode = useMemo(() => {
    const m = new Map();
    countries.forEach((c) => {
      if (c.alpha3Code) m.set(c.alpha3Code, c);
      if (c.cioc) m.set(c.cioc, c);
    });
    return m;
  }, [countries]);

  const persist = (u) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (username) => persist(await loginUser(username));
  const loginAsGuest = () => persist({ username: 'Guest', guest: true, totalScore: 0, gamesPlayed: 0 });
  const logout = () => persist(null);

  /** Adds points to the player's profile. Guests are never saved. */
  const submitScore = async (points) => {
    if (!user || user.guest || !(points > 0)) return { saved: false };
    try {
      persist(await postScore(user.username, points));
      return { saved: true };
    } catch {
      return { saved: false, error: true };
    }
  };

  const value = { countries, status, reload: loadCountries, features, geo, geoStatus, byCode, user, login, loginAsGuest, logout, submitScore };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
