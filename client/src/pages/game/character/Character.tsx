import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../contexts/PlayerContext.tsx';
import './Character.css';
import { apiRequest } from '../../../services/apiClient.ts';

const Character: React.FC = () => {
  const navigate = useNavigate();
  const {
    level,
    skillPoints,
    attack,
    defense,
    dexterity,
    skillStats,
    spendSkillPoint,
    resetSkillPoints,
    stepsTaken,
    totalDamageDealt,
    totalDamageReceived,
    totalGoldEarned,
    totalEnemiesDefeated,
  } = usePlayer();

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        token: localStorage.getItem('game_token'),
      });
    } catch (err) {
      console.error('Server-side logout failed, proceeding with local logout.');
    } finally {
      localStorage.removeItem('game_token');
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Delete your account permanently? This cannot be undone.');
    if (!confirmDelete) return;

    try {
      await apiRequest('/api/auth/delete', {
        method: 'DELETE',
        token: localStorage.getItem('game_token'),
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to delete account.');
      return;
    }

    localStorage.removeItem('game_token');
    navigate('/login');
  };

  const hasSpentPoints =
    skillStats.attack > 0 ||
    skillStats.defense > 0 ||
    skillStats.dexterity > 0;

  return (
    <div className="page-content">
      <div className="character-card">
        <div className="character-header">
          <div className="avatar-circle">??</div>
          <div className="character-meta">
            <h2>Adventurer</h2>
            <p>Level {level} Novice</p>
            <p className="skill-points">Skill Points: {skillPoints}</p>
          </div>
        </div>

        <div className="character-divider" />

        <div className="attributes">
          <h3>Attributes</h3>

          <div className="stat-list">
            <div className="stat-row">
              <div className="stat-info">
                <strong>Attack</strong>
                <div className="stat-base">Total Attack: {attack}</div>
              </div>
              <div className="stat-skill">{skillStats.attack}</div>
              <button className="stat-btn" disabled={skillPoints <= 0} onClick={() => spendSkillPoint('attack')}>+1</button>
            </div>

            <div className="stat-row">
              <div className="stat-info">
                <strong>Defense</strong>
                <div className="stat-base">Total Defense: {defense}</div>
              </div>
              <div className="stat-skill">{skillStats.defense}</div>
              <button className="stat-btn" disabled={skillPoints <= 0} onClick={() => spendSkillPoint('defense')}>+1</button>
            </div>

            <div className="stat-row">
              <div className="stat-info">
                <strong>Dexterity</strong>
                <div className="stat-base">Total Dexterity: {dexterity}</div>
              </div>
              <div className="stat-skill">{skillStats.dexterity}</div>
              <button className="stat-btn" disabled={skillPoints <= 0} onClick={() => spendSkillPoint('dexterity')}>+1</button>
            </div>
          </div>
        </div>

        <div className="character-divider" />

        <div className="adventure-stats">
          <h3>Adventure Stats</h3>
          <div className="stats-grid">
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

        <div className="character-actions">
          <button className="reset-btn" disabled={!hasSpentPoints} onClick={resetSkillPoints}>Reset Skills</button>
          <button className="logout-btn" onClick={handleLogout}>
            LEAVE REALM (LOGOUT)
          </button>
        </div>

        <button className="delete-btn" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Character;
