export type QuestType = 'steps' | 'gold' | 'damage' | 'enemies';

export type Quest = {
  id: string;
  label: string;
  type: QuestType;
  target: number;
  reward: {
    gold: number;
    exp: number;
  };
};

export type QuestProgressInput = {
  stepsTaken: number;
  totalGoldEarned: number;
  totalDamageDealt: number;
  totalEnemiesDefeated: number;
};

const questPool: Quest[] = [
  { id: 'steps-50', label: 'Take 50 steps', type: 'steps', target: 50, reward: { gold: 40, exp: 20 } },
  { id: 'steps-150', label: 'Take 150 steps', type: 'steps', target: 150, reward: { gold: 90, exp: 40 } },
  { id: 'gold-200', label: 'Earn 200 gold', type: 'gold', target: 200, reward: { gold: 60, exp: 30 } },
  { id: 'gold-500', label: 'Earn 500 gold', type: 'gold', target: 500, reward: { gold: 140, exp: 60 } },
  { id: 'damage-200', label: 'Deal 200 damage', type: 'damage', target: 200, reward: { gold: 50, exp: 35 } },
  { id: 'damage-500', label: 'Deal 500 damage', type: 'damage', target: 500, reward: { gold: 120, exp: 70 } },
  { id: 'enemies-5', label: 'Defeat 5 enemies', type: 'enemies', target: 5, reward: { gold: 80, exp: 40 } },
  { id: 'enemies-12', label: 'Defeat 12 enemies', type: 'enemies', target: 12, reward: { gold: 170, exp: 90 } },
];

const hashSeed = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededRandom = (seed: string) => {
  let value = hashSeed(seed) || 1;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value & 0x7fffffff) / 2147483647;
  };
};

const getDailyQuestSet = (date = new Date()) => {
  const dateKey = date.toISOString().slice(0, 10);
  const rng = seededRandom(dateKey);
  const pool = [...questPool];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return { dateKey, quests: pool.slice(0, 3) };
};

const getQuestProgress = (quest: Quest, stats: QuestProgressInput) => {
  switch (quest.type) {
    case 'steps':
      return stats.stepsTaken;
    case 'gold':
      return stats.totalGoldEarned;
    case 'damage':
      return stats.totalDamageDealt;
    case 'enemies':
      return stats.totalEnemiesDefeated;
    default:
      return 0;
  }
};

export { getDailyQuestSet, getQuestProgress };
