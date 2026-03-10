import React, { useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext.tsx';
import './Dashboard.css';

// Encounter data returned by the server on a 'walk' that rolls an enemy.
// enemyIndex is sent back on the follow-up 'fight' call.
interface ServerEncounter {
  name: string;
  hpLoss: number;
  goldReward: number;
  expReward: number;
  enemyIndex: number;
}

const Dashboard: React.FC = () => {
  const [isCooldown, setIsCooldown]   = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [lastAction, setLastAction]   = useState("The road ahead is long...");
  const [encounter, setEncounter]     = useState<ServerEncounter | null>(null);

  const { hp, applyServerStats } = usePlayer();

  const getToken = () => localStorage.getItem('game_token') ?? '';

  // Sends a step action to the server and processes the response.
  // Returns the parsed response data, or null on network failure.
  const postStep = async (body: object) => {
    try {
      const res = await fetch('http://localhost:5000/api/game/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setLastAction(err.message ?? "Something went wrong on the road.");
        return null;
      }
      return await res.json();
    } catch {
      setLastAction("Cannot reach the realm server.");
      return null;
    }
  };

  const handleStep = async () => {
    if (isCooldown || encounter || hp <= 0) return;

    // Start the cooldown ring immediately for responsive feel
    const waitTime = Math.floor(Math.random() * 2000) + 1500;
    setCooldownTime(waitTime);
    setIsCooldown(true);

    const data = await postStep({ action: 'walk', currentHp: hp });

    if (data) {
      if (data.outcome === 'encounter') {
        // Server rolled an enemy — show the encounter card.
        // Stats are NOT updated yet; fight/skip resolves them.
        setEncounter({ ...data.enemy });
        setLastAction(data.message);
        // Don't apply stats yet — server hasn't modified them either
      } else {
        // Safe walk — server updated stats and saved atomically
        setLastAction(data.message);
        applyServerStats(data.updatedStats);
      }
    }

    setTimeout(() => setIsCooldown(false), waitTime);
  };

  const handleFight = async () => {
    if (!encounter) return;

    const data = await postStep({
      action: 'fight',
      enemyIndex: encounter.enemyIndex,
      currentHp: hp,
    });

    if (data) {
      setLastAction(data.message);
      applyServerStats(data.updatedStats);

      // Auto-save milestone: check if the player levelled up or died
      // (stepRoute already saves atomically, so no extra call needed here)
    }

    setEncounter(null);
  };

  const handleSkip = async () => {
    const data = await postStep({ action: 'skip', currentHp: hp });

    if (data) {
      setLastAction(data.message);
      // Skip doesn't change stats — no applyServerStats needed
    } else {
      setLastAction("You carefully snuck past the enemy.");
    }

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