import { useEffect, useState } from 'react';

// Tiny hash router so the phone's Back button works: #/home, #/play/flag, #/leaderboard ...
const read = () => window.location.hash.replace(/^#\/?/, '') || 'home';

export function navigate(route) {
  window.location.hash = `/${route}`;
  window.scrollTo({ top: 0 });
}

export function useRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
