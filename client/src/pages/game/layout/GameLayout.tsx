import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../../../contexts/PlayerContext.tsx';
import { useItems } from '../../../contexts/ItemContext.tsx';
import { useEquipment } from '../../../contexts/EquipmentContext.tsx';
import { useEnemy } from '../../../contexts/EnemyContext.tsx';
import { getStageForLevel } from '../../../domain/stages';
import './GameLayout.css';

import ProgressBar from '../components/ProgressBar.tsx';
import { useSaveStatus } from '../../../contexts/SaveContext.tsx';

const GameLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { level, gold, exp, expThreshold, hp, maxHp, stepsTaken, totalGoldEarned, totalDamageDealt, totalDamageReceived, totalEnemiesDefeated, resetPlayer } = usePlayer();
  const { saveNow, saving, lastSavedAt, saveError } = useSaveStatus();
  const { resetInventory } = useItems();
  const { resetEquipment } = useEquipment();
  const { clearEncounter } = useEnemy();
  const [pendingResetSave, setPendingResetSave] = useState(false);

  const lastSavedLabel = lastSavedAt
    ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
    : 'Not saved yet';

  const handleRestart = () => {
    const stage = getStageForLevel(level);
    localStorage.removeItem(`quests_stage_${stage.id}`);
    clearEncounter();
    resetPlayer();
    resetInventory();
    resetEquipment();
    setPendingResetSave(true);
  };

  useEffect(() => {
    if (!pendingResetSave) return;
    if (hp === 100 && level === 1 && exp === 0 && gold === 0 && stepsTaken === 0) {
      saveNow();
      setPendingResetSave(false);
    }
  }, [pendingResetSave, hp, level, exp, gold, stepsTaken, saveNow]);

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
        <div className="stat-item save-item">
          <button className="save-btn" onClick={saveNow} disabled={saving}>
            {saving ? 'SAVING...' : 'SAVE'}
          </button>
          <div className="save-meta">
            <span>{saveError ? 'Save failed' : lastSavedLabel}</span>
          </div>
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
          className={`nav-item ${location.pathname === '/shop' ? 'active' : ''}`} 
          onClick={() => navigate('/shop')}>Shop</button>
        <button 
          className={`nav-item ${location.pathname === '/character' ? 'active' : ''}`} 
          onClick={() => navigate('/character')}>Hero</button>
      </footer>

      {hp <= 0 && (
        <div className="death-overlay">
          <div className="death-modal">
            <h2>YOU HAVE FALLEN</h2>
            <p className="death-sub">Your journey ends here.</p>
            <div className="death-stats">
              <h3>Adventure Stats</h3>
              <div className="death-stats-grid">
                <div>
                  <span>Steps Taken</span>
                  <strong>{stepsTaken}</strong>
                </div>
                <div>
                  <span>Gold Earned</span>
                  <strong>{totalGoldEarned}</strong>
                </div>
                <div>
                  <span>Damage Dealt</span>
                  <strong>{totalDamageDealt}</strong>
                </div>
                <div>
                  <span>Damage Received</span>
                  <strong>{totalDamageReceived}</strong>
                </div>
                <div>
                  <span>Enemies Defeated</span>
                  <strong>{totalEnemiesDefeated}</strong>
                </div>
              </div>
            </div>
            <button className="death-restart-btn" onClick={handleRestart}>
              Restart Journey
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameLayout;






