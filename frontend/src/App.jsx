import { useState, useEffect } from 'react';
import './App.css';

// 1. IMPORT YOUR NEW COMPONENTS HERE
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';

const shuffleArray = (array) => {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function App() {
  const [allCountries, setAllCountries] = useState([]);
  
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('guessrUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginInput, setLoginInput] = useState('');
  
  const [gameState, setGameState] = useState(currentUser ? 'SETUP' : 'LOGIN'); 
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  const [gameMode, setGameMode] = useState('FLAG');
  const [regions, setRegions] = useState({ All: true, Africa: false, Americas: false, Asia: false, Europe: false, Oceania: false });
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [difficulty, setDifficulty] = useState('easy'); 
  
  const [gamePool, setGamePool] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [maxPossibleScore, setMaxPossibleScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null); 
  const [timerActive, setTimerActive] = useState(false);
  
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [borderNames, setBorderNames] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const response = await fetch('https://country-guessr.vercel.app//api/countries');
        const data = await response.json();
        setAllCountries(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
    if (timeLeft === null || !timerActive) return;
    if (timeLeft <= 0) {
      handleTimeOut();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, timerActive]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginInput.trim()) return;
    try {
      const res = await fetch('https://country-guessr.vercel.app//api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginInput.trim() })
      });
      const userData = await res.json();
      setCurrentUser(userData);
      localStorage.setItem('guessrUser', JSON.stringify(userData));
      setGameState('SETUP');
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('guessrUser');
    setGameState('LOGIN');
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('https://country-guessr.vercel.app//api/users/leaderboard');
      const data = await res.json();
      setLeaderboardData(data);
      setGameState('LEADERBOARD');
    } catch (err) {
      console.error(err);
    }
  };

  const saveScoreAndEndGame = async (finalScore) => {
    setTimerActive(false);
    try {
      if (currentUser && finalScore > 0) {
        const res = await fetch('https://country-guessr.vercel.app//api/users/score', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, score: finalScore })
        });
        const updatedUser = await res.json();
        setCurrentUser(updatedUser); 
        localStorage.setItem('guessrUser', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Failed to save score", err);
    }
    setGameState('GAMEOVER');
  };

  const handleRegionToggle = (region) => {
    setRegions(prev => {
      if (region === 'All') return { All: !prev.All, Africa: false, Americas: false, Asia: false, Europe: false, Oceania: false };
      const newState = { ...prev, All: false, [region]: !prev[region] };
      if (!Object.keys(newState).some(k => k !== 'All' && newState[k])) newState.All = true;
      return newState;
    });
  };

  const startGame = () => {
    let pool = allCountries;
    if (!regions.All) {
      const activeRegions = Object.keys(regions).filter(k => regions[k]);
      pool = allCountries.filter(c => activeRegions.includes(c.region));
    }
    if (pool.length === 0) return alert("No countries found!");

    pool = shuffleArray(pool);
    setGamePool(pool);
    setCurrentIndex(0);
    setScore(0);
    setMaxPossibleScore(pool.length * 3);
    setGameState('PLAYING');
    startRound(pool[0], difficulty);
  };

  const startRound = (countryObj, diffMode) => {
    setGuess(''); setMessage(''); setIncorrectGuesses(0); setIsRevealed(false); setShowDropdown(false);
    if (countryObj.borders?.length > 0) {
      setBorderNames(countryObj.borders.map(code => {
        const match = allCountries.find(c => c.alpha3Code === code || c.cioc === code);
        return match ? match.name : code;
      }));
    } else {
      setBorderNames([]);
    }
    
    if (diffMode === 'easy') setTimeLeft(null);
    if (diffMode === 'medium') setTimeLeft(60);
    if (diffMode === 'hard') setTimeLeft(20);
    setTimerActive(true);
  };

  const calculatePoints = () => difficulty === 'easy' ? 3 : Math.max(1, 3 - incorrectGuesses);

  const handleTimeOut = () => { setTimerActive(false); setIsRevealed(true); setMessage(`Time's up! It was ${gamePool[currentIndex].name}`); setGuess(''); };
  const handleSkip = () => { setTimerActive(false); setIsRevealed(true); setMessage(`Skipped! The answer was ${gamePool[currentIndex].name}`); setGuess(''); };
  const handleReveal = () => { setTimerActive(false); setIsRevealed(true); setMessage(`The answer was ${gamePool[currentIndex].name}`); setGuess(''); };

  const handleQuit = () => {
    if (window.confirm("Quit early? Your current score will be saved to your profile.")) {
      saveScoreAndEndGame(score);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= gamePool.length) {
      saveScoreAndEndGame(score);
    } else {
      setCurrentIndex(prev => prev + 1);
      startRound(gamePool[currentIndex + 1], difficulty);
    }
  };

  const handleGuess = (e) => {
    e.preventDefault();
    if (message.includes('Correct') || isRevealed) return;

    if (guess.trim().toLowerCase() === gamePool[currentIndex].name.toLowerCase()) {
      setTimerActive(false);
      const points = calculatePoints();
      setMessage(`Correct! 🎉 +${points} Points`);
      setScore(prev => prev + points);
    } else {
      setMessage('Incorrect, try again! ❌');
      setIncorrectGuesses(prev => prev + 1);
      setGuess('');
    }
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setGuess(value);
    if (value.trim().length > 0) {
      setSuggestions(allCountries.filter(c => c.name.toLowerCase().startsWith(value.toLowerCase())).map(c => c.name));
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const isRoundOver = message.includes('Correct') || isRevealed;

  return (
    <div className="app-container">
      {/* USE NAVBAR COMPONENT */}
      <Navbar 
        currentUser={currentUser} 
        gameState={gameState} 
        setGameState={setGameState} 
        fetchLeaderboard={fetchLeaderboard} 
        handleQuit={handleQuit} 
        handleLogout={handleLogout} 
      />

      <main className="website-content">
        {/* USE SIDEBAR COMPONENT */}
        <Sidebar currentUser={currentUser} />

        <section className="game-section">
          
          {gameState === 'LOGIN' && (
            <div className="panel setup-panel">
              <h2>Welcome to CountryGuessr</h2>
              <p style={{color: '#94a3b8', marginBottom: '30px'}}>Pick a username to start saving your scores to the global leaderboard.</p>
              <form onSubmit={handleLogin} className="login-form">
                <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="Enter Username" className="guess-input" required maxLength="15" />
                <button type="submit" className="primary-btn play-btn mt-20">Start Playing</button>
              </form>
            </div>
          )}

          {/* USE SETUP COMPONENT */}
          {gameState === 'SETUP' && (
            <SetupScreen 
              gameMode={gameMode} setGameMode={setGameMode}
              regions={regions} handleRegionToggle={handleRegionToggle}
              showDifficulty={showDifficulty} setShowDifficulty={setShowDifficulty}
              difficulty={difficulty} setDifficulty={setDifficulty}
              startGame={startGame}
            />
          )}

          {/* USE GAMEPLAY COMPONENT */}
          {gameState === 'PLAYING' && gamePool[currentIndex] && (
            <GameScreen 
              currentIndex={currentIndex} gamePool={gamePool} score={score} timeLeft={timeLeft}
              handleQuit={handleQuit} gameMode={gameMode} guess={guess} handleInputChange={handleInputChange}
              isRoundOver={isRoundOver} handleGuess={handleGuess} handleSkip={handleSkip} 
              showDropdown={showDropdown} suggestions={suggestions} setGuess={setGuess} setShowDropdown={setShowDropdown}
              difficulty={difficulty} incorrectGuesses={incorrectGuesses} borderNames={borderNames}
              handleReveal={handleReveal} message={message} handleNext={handleNext}
            />
          )}

          {/* GAME OVER SCREEN (Kept inline as it's small) */}
          {gameState === 'GAMEOVER' && (
            <div className="panel game-over-panel">
              <h2 className="final-score-title">Session Complete!</h2>
              <div className="score-circle"><span>{score}</span></div>
              <p className="max-score-text">Points added to your profile.</p>
              <button className="primary-btn play-again-btn mt-20" onClick={() => { setGameState('SETUP'); setShowDifficulty(false); }}>
                Play Again
              </button>
            </div>
          )}

          {/* LEADERBOARD SCREEN (Kept inline as it's small) */}
          {gameState === 'LEADERBOARD' && (
            <div className="panel table-panel">
              <h2>Global Leaderboard</h2>
              <table className="leaderboard-table">
                <thead><tr><th>Rank</th><th>Player</th><th>Total Score</th><th>Games</th></tr></thead>
                <tbody>
                  {leaderboardData.map((user, index) => (
                    <tr key={user._id} className={user.username === currentUser?.username ? 'highlight-row' : ''}>
                      <td>#{index + 1}</td>
                      <td>{user.username}</td>
                      <td style={{color: '#38bdf8', fontWeight: '700'}}>{user.totalScore}</td>
                      <td>{user.gamesPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PROFILE SCREEN (Kept inline as it's small) */}
          {gameState === 'PROFILE' && currentUser && (
            <div className="panel profile-panel">
              <h2>Player Profile</h2>
              <div className="profile-stats-grid">
                <div className="stat-card"><h4>Username</h4><p>{currentUser.username}</p></div>
                <div className="stat-card"><h4>Total Points</h4><p className="highlight">{currentUser.totalScore}</p></div>
                <div className="stat-card"><h4>Matches Played</h4><p>{currentUser.gamesPlayed}</p></div>
                <div className="stat-card"><h4>Joined</h4><p>{new Date(currentUser.createdAt).toLocaleDateString()}</p></div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* USE FOOTER COMPONENT */}
      <Footer />
    </div>
  );
}

export default App;