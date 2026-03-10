import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext.tsx';
import './Dashboard.css';

import ProgressBar from './props/ProgressBar.tsx';

const GameLayout: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const { level, gold, exp, expThreshold, hp, maxHp, isLoading, loadPlayerState } = usePlayer();

  // Load saved state on any fresh page entry (login redirect OR direct URL / refresh).
  // This is the fix for Stage 4 TC4 — Login calls loadPlayerState too, but a
  // second call is harmless and ensures refreshes never show stale defaults.
  useEffect(() => {
    loadPlayerState();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="dashboard-container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: '1rem',
      }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          ⚔️ Loading your hero...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="stats-bar">
        <div className="stat-item"><span className="label">Level:</span> {level}</div>
        <div className="stat-item">
          <span className="label">HP:</span>
          <ProgressBar currentProgress={hp} threshold={maxHp} barColor="var(--hp-color)" />
        </div>
        <div className="stat-item"><span className="label">GOLD:</span> <span className="gold-text">${gold}</span></div>
        <div className="stat-item">
          <span className="label">Exp:</span>
          <ProgressBar currentProgress={exp} threshold={expThreshold} barColor="var(--exp-color)" />
        </div>
      </header>

      <main className="game-area">
        <Outlet />
      </main>

      <footer className="game-nav">
        <button
          className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}>Travel</button>
        <button
          className={`nav-item ${location.pathname === '/inventory' ? 'active' : ''}`}
          onClick={() => navigate('/inventory')}>Bag</button>
        <button
          className={`nav-item ${location.pathname === '/character' ? 'active' : ''}`}
          onClick={() => navigate('/character')}>Hero</button>
      </footer>
    </div>
  );
};

export default GameLayout;