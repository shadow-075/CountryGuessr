export default function SetupScreen({ gameMode, setGameMode, regions, handleRegionToggle, showDifficulty, setShowDifficulty, difficulty, setDifficulty, startGame }) {
  return (
    <div className="panel">
      <h2>New Game Session</h2>
      <div className="setup-section">
        <h3>1. Choose Game Mode</h3>
        <div className="mode-selector">
          <button className={`mode-btn ${gameMode === 'FLAG' ? 'active' : ''}`} onClick={() => setGameMode('FLAG')}>Guess by Flag</button>
          <button className={`mode-btn ${gameMode === 'CAPITAL' ? 'active' : ''}`} onClick={() => setGameMode('CAPITAL')}>Guess by Capital</button>
        </div>
      </div>
      <div className="setup-section">
        <h3>2. Select Regions</h3>
        <div className="regions-grid">
          {Object.keys(regions).map(region => (
            <label key={region} className="checkbox-label">
              <input type="checkbox" checked={regions[region]} onChange={() => handleRegionToggle(region)} />
              <span className="custom-checkbox"></span>
              {region}
            </label>
          ))}
        </div>
      </div>
      {!showDifficulty ? (
        <button className="primary-btn mt-20" onClick={() => setShowDifficulty(true)}>Continue to Difficulty ➔</button>
      ) : (
        <div className="setup-section fade-in">
          <h3>3. Select Difficulty</h3>
          <div className="diff-selector">
            <label><input type="radio" name="diff" checked={difficulty === 'easy'} onChange={() => setDifficulty('easy')}/> Easy (No Timer, 6 Hints)</label>
            <label><input type="radio" name="diff" checked={difficulty === 'medium'} onChange={() => setDifficulty('medium')}/> Medium (60s, 3 Hints, Deductions)</label>
            <label><input type="radio" name="diff" checked={difficulty === 'hard'} onChange={() => setDifficulty('hard')}/> Hard (20s, No Hints, Deductions)</label>
          </div>
          <h3> </h3>
          <button className="primary-btn play-btn mt-20" onClick={startGame}>START GAME</button>
        </div>
      )}
    </div>
  );
}