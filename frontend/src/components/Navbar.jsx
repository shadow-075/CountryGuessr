export default function Navbar({ currentUser, gameState, setGameState, fetchLeaderboard, handleQuit, handleLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => currentUser && setGameState('SETUP')} style={{cursor: 'pointer'}}>
        🌍 CountryGuessr
      </div>
      
      {currentUser && (
        <div className="nav-links">
          <a href="#" className={`nav-link ${gameState === 'SETUP' || gameState === 'PLAYING' ? 'active' : ''}`} 
             onClick={(e) => { e.preventDefault(); if(gameState !== 'PLAYING') setGameState('SETUP'); }}>Play</a>
          <a href="#" className={`nav-link ${gameState === 'LEADERBOARD' ? 'active' : ''}`} 
             onClick={(e) => { e.preventDefault(); if(gameState !== 'PLAYING') fetchLeaderboard(); }}>Leaderboard</a>
          <a href="#" className={`nav-link ${gameState === 'PROFILE' ? 'active' : ''}`} 
             onClick={(e) => { e.preventDefault(); if(gameState !== 'PLAYING') setGameState('PROFILE'); }}>Profile</a>
        </div>
      )}
      
      <div className="nav-actions">
        {/* Shows ONLY when playing a game */}
        {gameState === 'PLAYING' && (
          <button onClick={handleQuit} className="nav-quit-btn">Quit Match</button>
        )}
        
        {/* Shows ONLY when NOT playing a game (Setup, Profile, Leaderboard) */}
        {currentUser && gameState !== 'PLAYING' && (
          <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
        )}
      </div>
    </nav>
  );
}