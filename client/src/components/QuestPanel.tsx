import React, { useEffect, useMemo, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { getStageQuestSet, getQuestProgress } from '../domain/quests';

const QuestPanel: React.FC = () => {
  const {
    level,
    stepsTaken,
    totalGoldEarned,
    totalDamageDealt,
    totalEnemiesDefeated,
    addGold,
    gainExp,
  } = usePlayer();

  const { stage, quests } = useMemo(() => getStageQuestSet(level), [level]);
  const storageKey = `quests_stage_${stage.id}`;
  const [claimed, setClaimed] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { claimed?: string[] };
        setClaimed(parsed.claimed ?? []);
      } catch {
        setClaimed([]);
      }
    }
  }, [storageKey]);

  const saveClaimed = (next: string[]) => {
    setClaimed(next);
    localStorage.setItem(storageKey, JSON.stringify({ claimed: next }));
  };

  const stats = useMemo(() => ({
    stepsTaken,
    totalGoldEarned,
    totalDamageDealt,
    totalEnemiesDefeated,
  }), [stepsTaken, totalGoldEarned, totalDamageDealt, totalEnemiesDefeated]);

  const handleClaim = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const progress = getQuestProgress(quest, stats);
    if (progress < quest.target) return;

    if (claimed.includes(questId)) return;

    addGold(quest.reward.gold);
    gainExp(quest.reward.exp);

    const next = [...claimed, questId];
    saveClaimed(next);
    setMessage(`Claimed ${quest.reward.gold} gold and ${quest.reward.exp} XP.`);
    window.setTimeout(() => setMessage(null), 2200);
  };

  return (
    <div className="quest-panel">
      <div className="quest-header">
        <h3>Stage Quests</h3>
        {message && <span className="quest-toast">{message}</span>}
      </div>
      <div className="quest-list">
        {quests.map(quest => {
          const progress = getQuestProgress(quest, stats);
          const complete = progress >= quest.target;
          const isClaimed = claimed.includes(quest.id);

          return (
            <div key={quest.id} className="quest-item">
              <div className="quest-info">
                <strong>{quest.label}</strong>
                <span className="quest-progress">{Math.min(progress, quest.target)} / {quest.target}</span>
              </div>
              <div className="quest-reward">
                <span>+{quest.reward.gold} gold</span>
                <span>+{quest.reward.exp} XP</span>
              </div>
              <button
                className="quest-claim"
                disabled={!complete || isClaimed}
                onClick={() => handleClaim(quest.id)}
              >
                {isClaimed ? 'CLAIMED' : complete ? 'CLAIM' : 'IN PROGRESS'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestPanel;
