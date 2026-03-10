import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext.tsx';

const LEVEL_TITLES: Record<number, string> = {
  1: 'Novice', 2: 'Apprentice', 3: 'Journeyman', 4: 'Adept', 5: 'Expert',
};
const getLevelTitle = (level: number) =>
  LEVEL_TITLES[level] ?? (level >= 6 ? 'Veteran' : 'Novice');

const Character: React.FC = () => {
  const navigate = useNavigate();
  const { level } = usePlayer();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('game_token')}` },
      });
    } catch (err) {
      console.error("Server-side logout failed, proceeding with local logout.");
    } finally {
      localStorage.removeItem('game_token');
      navigate('/login');
    }
  };

  return (
    <div className="page-content">
      <div className="character-card">
        <div className="avatar-circle">👤</div>
        <h2>Adventurer</h2>
        <p>Level {level} {getLevelTitle(level)}</p>
        <hr />
        <button className="logout-btn" onClick={handleLogout}>
          LEAVE REALM (LOGOUT)
        </button>
      </div>
    </div>
  );
};

export default Character;