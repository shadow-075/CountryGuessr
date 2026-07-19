export default function GameScreen({ 
  currentIndex, gamePool, score, timeLeft, handleQuit, gameMode, guess, handleInputChange, 
  isRoundOver, handleGuess, handleSkip, showDropdown, suggestions, setGuess, setShowDropdown, 
  difficulty, incorrectGuesses, borderNames, handleReveal, message, handleNext 
}) {
  const currentCountry = gamePool[currentIndex];

  return (
    <div className="panel game-panel">
      <div className="hud-bar">
        <div className="hud-stats">
          <span className="progress-text">Round {currentIndex + 1} / {gamePool.length}</span>
          <span className="score-text">Score: {score}</span>
        </div>
        <div className="hud-right">
          {timeLeft !== null && <span className={`timer-text ${timeLeft <= 10 ? 'urgent' : ''}`}>⏱ {timeLeft}s</span>}
          <button onClick={handleQuit} className="hud-quit-btn">Quit</button>
        </div>
      </div>

      <div className="media-container">
        {gameMode === 'FLAG' ? (
          <div className="flag-wrapper">
            <img src={`http://localhost:5000/api/countries/flag/${currentCountry._id}`} alt="Guess the flag" className="flag-image" />
          </div>
        ) : (
          <div className="capital-box">
            <h2>{currentCountry.capital || "No Capital"}</h2>
          </div>
        )}
      </div>

      <div className="form-wrapper">
        <form onSubmit={handleGuess} className="guess-form">
          <input type="text" value={guess} onChange={handleInputChange} placeholder="Enter country name" disabled={isRoundOver} className="guess-input" autoComplete="off" />
          <button type="submit" disabled={isRoundOver || guess.trim() === ''} className="guess-btn">Guess</button>
          {!isRoundOver && <button type="button" onClick={handleSkip} className="guess-btn skip-btn">Skip</button>}
        </form>
        {showDropdown && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((s, i) => <li key={i} onClick={() => { setGuess(s); setShowDropdown(false); }}>{s}</li>)}
          </ul>
        )}
      </div>

      {difficulty !== 'hard' && incorrectGuesses > 0 && !isRoundOver && (
        <div className="hints-container">
          {difficulty === 'easy' && (
            <>
              {incorrectGuesses >= 1 && <p><strong>Population:</strong> {currentCountry.population?.toLocaleString()}</p>}
              {incorrectGuesses >= 2 && <p><strong>Region:</strong> {currentCountry.region}</p>}
              {incorrectGuesses >= 3 && <p><strong>Subregion:</strong> {currentCountry.subregion}</p>}
              {incorrectGuesses >= 4 && <p><strong>Bordering:</strong> {borderNames.length > 0 ? borderNames.join(', ') : 'None'}</p>}
              {incorrectGuesses >= 5 && <p><strong>Currency:</strong> {currentCountry.currencyName || 'N/A'}</p>}
              {incorrectGuesses >= 6 && <button type="button" onClick={handleReveal} className="reveal-btn-inline">I give up, Reveal!</button>}
            </>
          )}
          {difficulty === 'medium' && (
            <>
              {incorrectGuesses >= 1 && <p><strong>Region:</strong> {currentCountry.region}</p>}
              {incorrectGuesses >= 2 && <p><strong>Capital:</strong> {currentCountry.capital}</p>}
              {incorrectGuesses >= 3 && <p><strong>Currency:</strong> {currentCountry.currencyName || 'N/A'}</p>}
              {incorrectGuesses >= 4 && <button type="button" onClick={handleReveal} className="reveal-btn-inline">I give up, Reveal!</button>}
            </>
          )}
        </div>
      )}

      {message && <p className={`message ${message.includes('Correct') ? 'correct' : 'incorrect'}`}>{message}</p>}
      
      {isRoundOver && (
        <button onClick={handleNext} className="primary-btn next-btn">
          {currentIndex + 1 >= gamePool.length ? 'Finish Game & Save Score ➔' : 'Next Country ➔'}
        </button>
      )}
    </div>
  );
}