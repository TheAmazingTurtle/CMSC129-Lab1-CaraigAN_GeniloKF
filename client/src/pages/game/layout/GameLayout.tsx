import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../../../contexts/PlayerContext.tsx';
import './GameLayout.css';

import ProgressBar from '../components/ProgressBar.tsx';


const GameLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { level, gold, exp, expThreshold, hp, maxHp } = usePlayer();

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
          className={`nav-item ${location.pathname === '/shop' ? 'active' : ''}`} 
          onClick={() => navigate('/shop')}>Shop</button>
        <button 
          className={`nav-item ${location.pathname === '/character' ? 'active' : ''}`} 
          onClick={() => navigate('/character')}>Hero</button>
      </footer>
    </div>
  );
};

export default GameLayout;
