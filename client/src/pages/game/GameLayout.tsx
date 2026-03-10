import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext.tsx';
import './Dashboard.css';

import ProgressBar from './props/ProgressBar.tsx';

const GameLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    level, gold, exp, expThreshold, hp, maxHp,
    isLoading, loadPlayerState,
    savePlayerState, lastSaved,
  } = usePlayer();

  const [isSaving, setIsSaving]       = useState(false);
  const [saveMsg, setSaveMsg]         = useState<string>('');

  useEffect(() => {
    loadPlayerState();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update the timestamp display whenever lastSaved changes —
  // covers both initial load and every subsequent save (manual or milestone).
  useEffect(() => {
    if (lastSaved) {
      setSaveMsg(formatSaveTime(lastSaved));
    }
  }, [lastSaved]);

  const formatSaveTime = (date: Date) => {
    return `Saved ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleManualSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveMsg('Saving...');

    const result = await savePlayerState();

    setIsSaving(false);
    if (result) {
      setSaveMsg(formatSaveTime(result.lastSaved));
    } else {
      setSaveMsg('⚠ Save failed');
      // Clear the failure message after 3 seconds
      setTimeout(() => setSaveMsg(lastSaved ? formatSaveTime(lastSaved) : ''), 3000);
    }
  };

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

        {/* Manual save — sits at the far right of the stats bar */}
        <div className="save-section">
          <button
            className={`save-btn ${isSaving ? 'saving' : ''}`}
            onClick={handleManualSave}
            disabled={isSaving}
            title="Save your progress"
          >
            {isSaving ? '💾 Saving...' : '💾 Save'}
          </button>
          {saveMsg && <span className="save-timestamp">{saveMsg}</span>}
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