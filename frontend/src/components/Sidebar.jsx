export default function Sidebar({ currentUser }) {
  return (
    <aside className="sidebar">
      {currentUser && (
        <div className="sidebar-box user-badge-box">
          <h3>Player: {currentUser.username}</h3>
          <p>Total Score: <strong>{currentUser.totalScore}</strong></p>
        </div>
      )}
      <div className="sidebar-box">
        <h3>How to Play</h3>
        <ul className="rules-list">
          <li><strong>Easy:</strong> No timer, 6 hints, 3 pts.</li>
          <li><strong>Medium:</strong> 60s timer, 3 hints, pts decrease with wrong guesses.</li>
          <li><strong>Hard:</strong> 20s timer, zero hints, max pressure.</li>
        </ul>
      </div>
    </aside>
  );
}