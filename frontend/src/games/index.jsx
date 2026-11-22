import { useApp } from '../context/AppContext';
import { navigate } from '../lib/router';
import { Button, ErrorCard, Loader } from '../components/ui';
import { GAMES } from './registry';
import QuizGame from './quiz/QuizGame';
import Countrydle from './Countrydle';
import HigherLower from './HigherLower';
import FindOnMap from './FindOnMap';
import BorderHop from './BorderHop';
import OddOneOut from './OddOneOut';
import NameThemAll from './NameThemAll';
import RankThem from './RankThem';

/** Waits for the country list, then renders the requested game. */
export default function GameRoute({ id }) {
  const { status, reload, geoStatus } = useApp();
  const game = GAMES[id];
  if (!game) return <ErrorCard title="Game not found" action={<Button onClick={() => navigate('home')}>Back to games</Button>} />;

  if (status === 'loading') return <Loader title="Loading countries…" note="The server may take a few seconds to wake up if it has been idle." />;
  if (status === 'error') {
    return (
      <ErrorCard title="Couldn't reach the server" action={<Button onClick={reload}>Try again</Button>}>
        Check your connection and try again. Free-tier servers can be slow on the first request.
      </ErrorCard>
    );
  }

  if (game.needsGeo && geoStatus === 'loading') return <Loader title="Drawing the world…" />;
  if (game.needsGeo && geoStatus === 'error') {
    return (
      <ErrorCard title="Map data unavailable" action={<Button onClick={() => navigate('home')}>Back to games</Button>}>
        The country shapes couldn&apos;t be downloaded. Check your connection, or place a <code>countries.geo.json</code> file in <code>public/</code>.
      </ErrorCard>
    );
  }

  if (game.quiz) return <QuizGame key={id} mode={id} />;
  const SCREENS = { countrydle: Countrydle, higherlower: HigherLower, findmap: FindOnMap, borderhop: BorderHop, oddone: OddOneOut, nameall: NameThemAll, rank: RankThem };
  const Screen = SCREENS[id];
  return <Screen key={id} />;
}
