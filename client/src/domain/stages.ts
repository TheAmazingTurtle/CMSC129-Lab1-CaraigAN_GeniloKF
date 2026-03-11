import type { Quest } from './questTypes';
import type { Rarity } from '../contexts/EquipmentContext';

export type LevelBand = {
  min: number;
  max: number;
  weight: number;
};

export type StageShopRules = {
  rarityWeights: Record<Rarity, number>;
  levelBands: LevelBand[];
  powerWeighting: {
    min: number;
    max: number;
  };
};

export type Stage = {
  id: string;
  label: string;
  minLevel: number;
  maxLevel: number;
  quests: Quest[];
  shop: StageShopRules;
};

const STAGES: Stage[] = [
  {
    id: '1',
    label: 'Stage 1',
    minLevel: 1,
    maxLevel: 5,
    quests: [
      { id: 's1-gold', label: 'Earn 120 gold', type: 'gold', target: 120, reward: { gold: 35, exp: 15 } },
      { id: 's1-damage', label: 'Deal 80 damage', type: 'damage', target: 80, reward: { gold: 25, exp: 12 } },
      { id: 's1-enemies', label: 'Defeat 3 enemies', type: 'enemies', target: 3, reward: { gold: 30, exp: 12 } },
    ],
    shop: {
      rarityWeights: { Common: 70, Uncommon: 25, Rare: 5, Epic: 0, Legendary: 0 },
      levelBands: [
        { min: 1, max: 2, weight: 70 },
        { min: 3, max: 4, weight: 30 },
      ],
      powerWeighting: { min: 0.9, max: 1.0 },
    },
  },
  {
    id: '2',
    label: 'Stage 2',
    minLevel: 6,
    maxLevel: 10,
    quests: [
      { id: 's2-gold', label: 'Earn 260 gold', type: 'gold', target: 260, reward: { gold: 70, exp: 28 } },
      { id: 's2-damage', label: 'Deal 180 damage', type: 'damage', target: 180, reward: { gold: 55, exp: 25 } },
      { id: 's2-enemies', label: 'Defeat 6 enemies', type: 'enemies', target: 6, reward: { gold: 60, exp: 24 } },
    ],
    shop: {
      rarityWeights: { Common: 45, Uncommon: 35, Rare: 18, Epic: 2, Legendary: 0 },
      levelBands: [
        { min: 1, max: 3, weight: 35 },
        { min: 4, max: 6, weight: 45 },
        { min: 7, max: 10, weight: 20 },
      ],
      powerWeighting: { min: 1.0, max: 1.1 },
    },
  },
  {
    id: '3',
    label: 'Stage 3',
    minLevel: 11,
    maxLevel: 15,
    quests: [
      { id: 's3-gold', label: 'Earn 420 gold', type: 'gold', target: 420, reward: { gold: 110, exp: 45 } },
      { id: 's3-damage', label: 'Deal 300 damage', type: 'damage', target: 300, reward: { gold: 85, exp: 40 } },
      { id: 's3-enemies', label: 'Defeat 10 enemies', type: 'enemies', target: 10, reward: { gold: 95, exp: 38 } },
    ],
    shop: {
      rarityWeights: { Common: 25, Uncommon: 35, Rare: 28, Epic: 10, Legendary: 2 },
      levelBands: [
        { min: 1, max: 4, weight: 15 },
        { min: 5, max: 8, weight: 45 },
        { min: 9, max: 12, weight: 30 },
        { min: 13, max: 15, weight: 10 },
      ],
      powerWeighting: { min: 1.1, max: 1.2 },
    },
  },
  {
    id: '4',
    label: 'Stage 4',
    minLevel: 16,
    maxLevel: 20,
    quests: [
      { id: 's4-gold', label: 'Earn 620 gold', type: 'gold', target: 620, reward: { gold: 150, exp: 65 } },
      { id: 's4-damage', label: 'Deal 450 damage', type: 'damage', target: 450, reward: { gold: 130, exp: 60 } },
      { id: 's4-enemies', label: 'Defeat 14 enemies', type: 'enemies', target: 14, reward: { gold: 140, exp: 55 } },
    ],
    shop: {
      rarityWeights: { Common: 15, Uncommon: 30, Rare: 30, Epic: 20, Legendary: 5 },
      levelBands: [
        { min: 1, max: 6, weight: 10 },
        { min: 7, max: 10, weight: 40 },
        { min: 11, max: 15, weight: 35 },
        { min: 16, max: 20, weight: 15 },
      ],
      powerWeighting: { min: 1.2, max: 1.35 },
    },
  },
  {
    id: '5',
    label: 'Stage 5',
    minLevel: 21,
    maxLevel: 25,
    quests: [
      { id: 's5-gold', label: 'Earn 900 gold', type: 'gold', target: 900, reward: { gold: 220, exp: 95 } },
      { id: 's5-damage', label: 'Deal 650 damage', type: 'damage', target: 650, reward: { gold: 200, exp: 90 } },
      { id: 's5-enemies', label: 'Defeat 20 enemies', type: 'enemies', target: 20, reward: { gold: 210, exp: 85 } },
    ],
    shop: {
      rarityWeights: { Common: 8, Uncommon: 22, Rare: 30, Epic: 28, Legendary: 12 },
      levelBands: [
        { min: 1, max: 8, weight: 8 },
        { min: 9, max: 12, weight: 24 },
        { min: 13, max: 18, weight: 36 },
        { min: 19, max: 25, weight: 32 },
      ],
      powerWeighting: { min: 1.35, max: 1.5 },
    },
  },
];

const clampLevel = (level: number) => {
  if (level < 1) return 1;
  if (level > 25) return 25;
  return level;
};

export const getStageForLevel = (level: number) => {
  const normalized = clampLevel(level);
  return STAGES.find((stage) => normalized >= stage.minLevel && normalized <= stage.maxLevel) ?? STAGES[0];
};

export { STAGES };
