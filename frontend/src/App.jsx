import { AppProvider, useApp } from './context/AppContext';
import { useRoute } from './lib/router';
import { BottomNav, Footer, Navbar } from './components/Navbar';
import GameRoute from './games';
import Home from './screens/Home';
import Leaderboard from './screens/Leaderboard';
import Login from './screens/Login';
import Profile from './screens/Profile';

function Shell() {
  const { user } = useApp();
  const route = useRoute();
  const [page, arg] = route.split('/');
  const inGame = page === 'play';

  let content;
  if (!user) content = <Login />;
  else if (page === 'play') content = <GameRoute id={arg} />;
  else if (page === 'leaderboard') content = <Leaderboard />;
  else if (page === 'profile') content = <Profile />;
  else content = <Home />;

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar page={page} />
      <main className={`mx-auto w-full max-w-5xl flex-1 px-4 pt-6 ${inGame ? 'pb-6' : 'pb-6'}`}>{content}</main>
      <Footer />
      {user && !inGame && <BottomNav page={page} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
