import React, { useState } from 'react';
import { usePlayer } from '../../../contexts/PlayerContext.tsx';
import { useItems } from '../../../contexts/ItemContext.tsx';
import { useEnemy } from '../../../contexts/EnemyContext.tsx';
import type { Item } from '../../../contexts/EquipmentContext';
import { calcDamage, calcDodgeChance } from '../../../services/combat';
import './Dashboard.css';

const dialogueBank = [
  'The road hums with old secrets.',
  'You remember to breathe and keep moving.',
  'A gentle breeze carries the scent of rain.',
  'Somewhere, a bell tolls in the distance.',
  'You feel oddly grateful for sturdy boots.',
  'A leaf falls. It feels like a good omen.',
  'You wonder what the next town is like.',
  'A traveler once said: keep your blade sharp.',
  'There is peace in the rhythm of walking.',
  'You spot a cloud shaped like a dragon.',
  'You recall a story about a hidden shrine.',
  'The sun warms your shoulders as you walk.',
  'You hear a faint melody on the wind.',
  'You check your gear. All seems well.',
  'A quiet moment, a steady heartbeat.',
  'You smile at the thought of treasure ahead.',
  'A distant owl hoots. The world feels alive.',
  'You tighten your grip and push onward.',
];

const Dashboard: React.FC = () => {
  // Game Logic State
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0); // Tracks the randomized duration
  const [dialogueLine, setDialogueLine] = useState(dialogueBank[0]);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);

  const {
    hp,
    addGold,
    gainExp,
    takeDamage,
    recordStep,
    addDamageDealt,
    buffs,
    attack,
    defense,
    dexterity,
    regenHP,
    addTempBuff,
  } = usePlayer();
  const { rollForLoot, addItem, inventory, removeItem } = useItems();
  const { encounter, startEncounter, clearEncounter, setEncounter } = useEnemy();

  const consumables = inventory.filter(item => item.type === 'Consumable');

  const pushToast = (message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2600);
  };

  const getRandomDialogue = () => {
    return dialogueBank[Math.floor(Math.random() * dialogueBank.length)];
  };

  const handleStep = () => {
    if (isCooldown || encounter || hp <= 0) return;

    recordStep();
    setDialogueLine(getRandomDialogue());

    // Randomize wait time between 1500ms and 3500ms
    const waitTime = Math.floor(Math.random() * 2000) + 1500;
    setCooldownTime(waitTime);
    setIsCooldown(true);
    
    // 20% chance for an enemy encounter
    const roll = Math.random();
    if (roll < 0.2) {
      startEncounter();
    } else {
      const goldGained = Math.floor(Math.random() * 15) + 10;
      const expGained = Math.floor(Math.random() * 15) + 10;
      
      addGold(goldGained);
      gainExp(expGained);
      pushToast(`+${goldGained} gold`);
      pushToast(`+${expGained} XP`);

      const loot = rollForLoot();
      if (loot) {
        addItem(loot);
        pushToast(`Found ${loot.name}`);
      }
    }

    // Dynamic timeout matching our animation
    setTimeout(() => setIsCooldown(false), waitTime);
  };

  const endEncounterOnDeath = (remainingHp: number) => {
    if (remainingHp <= 0) {
      clearEncounter();
      setDialogueLine('You collapse and escape the encounter.');
      return true;
    }
    return false;
  };

  const enemyTurn = () => {
    if (!encounter) return;

    const dodgeChance = calcDodgeChance(encounter.dex, dexterity);
    const dodged = Math.random() < dodgeChance;
    if (dodged) {
      setDialogueLine(`You dodged the ${encounter.name}'s strike.`);
      return;
    }

    const damage = calcDamage(encounter.atk, defense);
    const remainingHp = Math.max(0, hp - damage);
    takeDamage(damage);
    setDialogueLine(`${encounter.name} hits you for ${damage}.`);

    endEncounterOnDeath(remainingHp);
  };

  const handlePlayerAttack = () => {
    if (!encounter) return;

    const enemyDodgeChance = calcDodgeChance(dexterity, encounter.dex);
    const enemyDodged = Math.random() < enemyDodgeChance;

    if (enemyDodged) {
      setDialogueLine(`${encounter.name} dodged your attack.`);
      enemyTurn();
      return;
    }

    const damage = calcDamage(attack, encounter.def);
    addDamageDealt(damage);

    const updated = { ...encounter, hp: Math.max(0, encounter.hp - damage) };
    setEncounter(updated);
    setDialogueLine(`You hit ${encounter.name} for ${damage}.`);

    if (updated.hp <= 0) {
      addGold(updated.goldReward);
      gainExp(updated.expReward);
      pushToast(`+${updated.goldReward} gold`);
      pushToast(`+${updated.expReward} XP`);

      const loot = rollForLoot();
      if (loot) {
        addItem(loot);
        pushToast(`Found ${loot.name}`);
      }

      clearEncounter();
      setDialogueLine(getRandomDialogue());
      return;
    }

    enemyTurn();
  };

  const handleUseConsumable = (item: Item) => {
    const healAmount = item.effects?.heal ?? 0;
    const tempBuff = item.effects?.tempBuff;

    if (healAmount > 0) {
      regenHP(healAmount);
      pushToast(`+${healAmount} HP`);
    }

    if (tempBuff) {
      addTempBuff(tempBuff.name, tempBuff.bonuses, tempBuff.durationSteps);
      pushToast(`${tempBuff.name} active`);
    }

    removeItem(item.id);

    if (encounter) {
      enemyTurn();
    }
  };

  const handleRunAway = () => {
    clearEncounter();
    setDialogueLine('You slipped away from the encounter.');
  };

  return (
    <div className="page-content">
      <div className="event-log">
        <p>{dialogueLine}</p>
      </div>

      {buffs.length > 0 && (
        <div className="buff-panel">
          <h4>Active Buffs</h4>
          <div className="buff-list">
            {buffs.map(buff => (
              <div key={buff.id} className="buff-item">
                <span>{buff.name}</span>
                <span className="buff-steps">{buff.remainingSteps} steps</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="toast-stack">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        ))}
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
              <div className="enemy-hp">
                <div className="enemy-hp-bar">
                  <div
                    className="enemy-hp-fill"
                    style={{ width: `${(encounter.hp / encounter.maxHp) * 100}%` }}
                  />
                </div>
                <span>{encounter.hp}/{encounter.maxHp} HP</span>
              </div>
              <div className="enemy-stats">
                <span>ATK {encounter.atk}</span>
                <span>DEF {encounter.def}</span>
                <span>DEX {encounter.dex}</span>
              </div>
            </div>

            <div className="combat-actions">
              <button className="fight-btn" onClick={handlePlayerAttack}>Attack</button>
              <button className="skip-btn" onClick={handleRunAway}>Run Away</button>
            </div>

            <div className="combat-consumables">
              <h4>Consumables</h4>
              {consumables.length === 0 && (
                <div className="risk-text">No consumables available.</div>
              )}
              {consumables.map(item => (
                <button key={item.id} onClick={() => handleUseConsumable(item)}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
