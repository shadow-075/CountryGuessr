import { useApp } from '../context/AppContext';

/** Returns an async fn that saves points and reports: 'yes' | 'guest' | 'error' | 'none' */
export function useFinish() {
  const { user, submitScore } = useApp();
  return async (points) => {
    if (user?.guest) return 'guest';
    const res = await submitScore(points);
    return res.saved ? 'yes' : points > 0 ? 'error' : 'none';
  };
}
