import React, { useEffect, useMemo, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { getStageQuestSet, getQuestProgress } from '../domain/quests';

type QuestPanelProps = {
  onRewardToast?: (message: string) => void;
};

const QuestPanel: React.FC<QuestPanelProps> = ({ onRewardToast }) => {
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
    onRewardToast?.(`+${quest.reward.gold} gold`);
    onRewardToast?.(`+${quest.reward.exp} XP`);
  };

  return (
    <div className="quest-panel">
      <div className="quest-header">
        <h3>Stage Quests</h3>
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
