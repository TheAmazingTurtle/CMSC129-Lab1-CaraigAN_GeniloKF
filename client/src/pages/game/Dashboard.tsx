import React, { useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext.tsx';
import './Dashboard.css';

interface Enemy {
  name: string;
  hpLoss: number;
  goldReward: number;
  expReward: number;
}

const Dashboard: React.FC = () => {
  // Game Logic State
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0); // Tracks the randomized duration
  const [lastAction, setLastAction] = useState("The road ahead is long...");
  const [encounter, setEncounter] = useState<Enemy | null>(null);

  const { hp, addGold, gainExp, takeDamage } = usePlayer();

  const handleStep = () => {
    if (isCooldown || encounter || hp <= 0) return;

    // Randomize wait time between 1500ms and 3500ms
    const waitTime = Math.floor(Math.random() * 2000) + 1500;
    setCooldownTime(waitTime);
    setIsCooldown(true);
    
    // 20% chance for an enemy encounter
    const roll = Math.random();
    if (roll < 0.2) {
      triggerEncounter();
    } else {
      const goldGained = Math.floor(Math.random() * 15) + 10;
      const expGained = Math.floor(Math.random() * 15) + 10;
      
      setLastAction(`You walked safely and found ${goldGained} gold.`);
      addGold(goldGained);
      gainExp(expGained);
    }

    // Dynamic timeout matching our animation
    setTimeout(() => setIsCooldown(false), waitTime);
  };

  const triggerEncounter = () => {
    const enemies = [
      { name: "Wild Slime", hpLoss: 10, goldReward: 15, expReward: 20 },
      { name: "Angry Goblin", hpLoss: 25, goldReward: 40, expReward: 50 },
      { name: "Shadow Bat", hpLoss: 5, goldReward: 5, expReward: 10 }
    ];
    const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
    setEncounter(randomEnemy);
    setLastAction(`A ${randomEnemy.name} blocks your path!`);
  };

  const handleFight = () => {
    if (!encounter) return;
    
    takeDamage(encounter.hpLoss);
    setLastAction(`Victory! You defeated the ${encounter.name} but lost ${encounter.hpLoss} HP.`);
    addGold(encounter.goldReward);
    gainExp(encounter.expReward);
    setEncounter(null);
  };

  const handleSkip = () => {
    setLastAction(`You carefully snuck past the enemy.`);
    setEncounter(null);
  };

  return (
    <div className="page-content">
      <div className="event-log">
        <p>{lastAction}</p>
      </div>

      <div className="action-zone">
        {!encounter ? (
          <div className="step-btn-wrapper">
            {/* SVG Progress Ring Overlay */}
            {isCooldown && (
              <svg className="cooldown-ring" viewBox="0 0 180 180">
                <circle 
                  className="cooldown-circle" 
                  cx="90" cy="90" r="86" 
                  style={{ animationDuration: `${cooldownTime}ms` }} 
                />
              </svg>
            )}
            <button 
              className={`step-btn ${isCooldown ? 'cooldown' : ''}`} 
              onClick={handleStep}
              disabled={isCooldown || hp <= 0}
            >
              {hp <= 0 ? 'EXHAUSTED' : isCooldown ? 'WAITING...' : 'TAKE A STEP'}
            </button>
          </div>
        ) : (
          <div className="encounter-card">
            <div className="enemy-preview">
              <h3>{encounter.name}</h3>
              <p className="risk-text">Expected Damage: <strong>{encounter.hpLoss} HP</strong></p>
              
              <div className="loot-preview">
                <span>💰 {encounter.goldReward} Gold</span>
                <span>✨ {encounter.expReward} XP</span>
              </div>
            </div>
            
            <div className="button-group">
              <button className="fight-btn" onClick={handleFight}>⚔️ FIGHT</button>
              <button className="skip-btn" onClick={handleSkip}>🏃 SKIP</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;