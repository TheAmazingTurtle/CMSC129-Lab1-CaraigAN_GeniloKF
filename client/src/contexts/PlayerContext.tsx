import React, { createContext, useContext, useMemo, useState } from 'react';
import { useEquipment } from './EquipmentContext';
import type { StatBlock } from './types';

type StatModifier = {
  id: string;
  bonuses: Partial<StatBlock>;
  name: string;
  remainingSteps: number;
};

type PlayerSaveData = {
  level: number;
  gold: number;
  exp: number;
  hp: number;
  skillPoints: number;
  skillStats: StatBlock;
  buffs: StatModifier[];
  stepsTaken: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  totalGoldEarned: number;
};

type StatKey = keyof StatBlock;

const baseStats: StatBlock = {
  attack: 5,
  defense: 5,
  dexterity: 5,
};

const emptyStats: StatBlock = {
  attack: 0,
  defense: 0,
  dexterity: 0,
};

const calcScaledValue = (base: number, level: number) => {
  let value = base;
  for (let i = 1; i < level; i += 1) {
    value = Math.floor(value * 1.2);
  }
  return value;
};

interface PlayerContextType {
  gold: number;
  exp: number;
  expThreshold: number;
  hp: number;
  maxHp: number;
  skillPoints: number;
  skillStats: StatBlock;
  attack: number;
  defense: number;
  dexterity: number;
  level: number;
  buffs: StatModifier[];
  stepsTaken: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  totalGoldEarned: number;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => void;
  regenHP: (amount: number) => void;
  takeDamage: (amount: number) => void;
  gainExp: (amount: number) => void;
  levelUp: () => void;
  addBuff: (buff: StatModifier) => void;
  removeBuff: (id: string) => void;
  spendSkillPoint: (stat: StatKey) => void;
  resetSkillPoints: () => void;
  recordStep: () => void;
  addDamageDealt: (amount: number) => void;
  addTempBuff: (name: string, bonuses: Partial<StatBlock>, durationSteps: number) => void;
  hydratePlayer: (data: Partial<PlayerSaveData>) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { equipment } = useEquipment();
  const [gold, setGold] = useState(0);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [exp, setExp] = useState(0);
  const [expThreshold, setExpThreshold] = useState(100);
  const [level, setLevel] = useState(1);
  const [skillPoints, setSkillPoints] = useState(0);
  const [skillStats, setSkillStats] = useState<StatBlock>(emptyStats);
  const [buffs, setBuffs] = useState<StatModifier[]>([]);
  const [stepsTaken, setStepsTaken] = useState(0);
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const [totalDamageReceived, setTotalDamageReceived] = useState(0);
  const [totalGoldEarned, setTotalGoldEarned] = useState(0);

  const addGold = (amount: number) => {
    if (amount <= 0) return;
    setGold(prev => prev + amount);
    setTotalGoldEarned(prev => prev + amount);
  };

  const gainExp = (amount: number) => {
    setExp(prev => {
      const newExp = prev + amount;
      if (newExp >= expThreshold) {
        const remainingExp = newExp - expThreshold;
        levelUp();
        return remainingExp;
      }
      return newExp;
    });
  };

  const takeDamage = (amount: number) => {
    if (amount <= 0) return;
    setHp(prev => Math.max(0, prev - amount));
    setTotalDamageReceived(prev => prev + amount);
  };

  const spendGold = (amount: number) => setGold(prev => Math.max(0, prev - amount));
  const regenHP = (amount: number) => setHp(prev => Math.min(maxHp, prev + amount));

  const levelUp = () => {
    setLevel(prev => {
      const next = prev + 1;
      setSkillPoints(sp => sp + (next % 5 === 0 ? 3 : 2));
      return next;
    });

    var newMaxHp = Math.floor(maxHp * 1.2);
    setHp(newMaxHp);
    setMaxHp(newMaxHp);
    setExpThreshold(prev => Math.floor(prev * 1.2));
  };

  const addBuff = (buff: StatModifier) => setBuffs(prev => [...prev, buff]);
  const removeBuff = (id: string) => setBuffs(prev => prev.filter(b => b.id !== id));

  const addTempBuff = (name: string, bonuses: Partial<StatBlock>, durationSteps: number) => {
    if (durationSteps <= 0) return;
    const id = `${name}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setBuffs(prev => [...prev, { id, name, bonuses, remainingSteps: durationSteps }]);
  };

  const spendSkillPoint = (stat: StatKey) => {
    if (skillPoints <= 0) return;
    setSkillPoints(prev => prev - 1);
    setSkillStats(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
  };

  const resetSkillPoints = () => {
    const spent = skillStats.attack + skillStats.defense + skillStats.dexterity;
    if (spent > 0) {
      setSkillPoints(prev => prev + spent);
      setSkillStats(emptyStats);
    }
  };

  const recordStep = () => {
    setStepsTaken(prev => prev + 1);
    setBuffs(prev =>
      prev
        .map(buff => ({ ...buff, remainingSteps: buff.remainingSteps - 1 }))
        .filter(buff => buff.remainingSteps > 0)
    );
  };

  const addDamageDealt = (amount: number) => {
    if (amount <= 0) return;
    setTotalDamageDealt(prev => prev + amount);
  };

  const hydratePlayer = (data: Partial<PlayerSaveData>) => {
    const nextLevel = typeof data.level === 'number' && data.level > 0 ? data.level : level;
    const nextMaxHp = calcScaledValue(100, nextLevel);
    const nextExpThreshold = calcScaledValue(100, nextLevel);

    if (typeof data.level === 'number') setLevel(data.level);
    setMaxHp(nextMaxHp);
    setExpThreshold(nextExpThreshold);

    if (typeof data.hp === 'number') setHp(Math.min(data.hp, nextMaxHp));
    if (typeof data.gold === 'number') setGold(data.gold);
    if (typeof data.exp === 'number') setExp(data.exp);
    if (typeof data.skillPoints === 'number') setSkillPoints(data.skillPoints);

    if (data.skillStats) {
      setSkillStats({
        attack: data.skillStats.attack ?? 0,
        defense: data.skillStats.defense ?? 0,
        dexterity: data.skillStats.dexterity ?? 0,
      });
    }

    if (Array.isArray(data.buffs)) setBuffs(data.buffs);
    if (typeof data.stepsTaken === 'number') setStepsTaken(data.stepsTaken);
    if (typeof data.totalDamageDealt === 'number') setTotalDamageDealt(data.totalDamageDealt);
    if (typeof data.totalDamageReceived === 'number') setTotalDamageReceived(data.totalDamageReceived);
    if (typeof data.totalGoldEarned === 'number') setTotalGoldEarned(data.totalGoldEarned);
  };

  const derivedStats = useMemo(() => {
    const equipmentBonus = Object.values(equipment).reduce<StatBlock>((acc, item) => {
      if (!item?.bonuses) return acc;
      return {
        attack: acc.attack + (item.bonuses.attack ?? 0),
        defense: acc.defense + (item.bonuses.defense ?? 0),
        dexterity: acc.dexterity + (item.bonuses.dexterity ?? 0),
      };
    }, { attack: 0, defense: 0, dexterity: 0 });

    const buffBonus = buffs.reduce<StatBlock>((acc, buff) => {
      return {
        attack: acc.attack + (buff.bonuses.attack ?? 0),
        defense: acc.defense + (buff.bonuses.defense ?? 0),
        dexterity: acc.dexterity + (buff.bonuses.dexterity ?? 0),
      };
    }, { attack: 0, defense: 0, dexterity: 0 });

    return {
      attack: baseStats.attack + skillStats.attack + equipmentBonus.attack + buffBonus.attack,
      defense: baseStats.defense + skillStats.defense + equipmentBonus.defense + buffBonus.defense,
      dexterity: baseStats.dexterity + skillStats.dexterity + equipmentBonus.dexterity + buffBonus.dexterity,
    };
  }, [equipment, buffs, skillStats]);

  const { attack, defense, dexterity } = derivedStats;

  return (
    <PlayerContext.Provider
      value={{
        gold,
        exp,
        expThreshold,
        hp,
        maxHp,
        skillPoints,
        skillStats,
        attack,
        defense,
        dexterity,
        level,
        buffs,
        stepsTaken,
        totalDamageDealt,
        totalDamageReceived,
        totalGoldEarned,
        addGold,
        spendGold,
        regenHP,
        takeDamage,
        gainExp,
        levelUp,
        addBuff,
        removeBuff,
        spendSkillPoint,
        resetSkillPoints,
        recordStep,
        addDamageDealt,
        addTempBuff,
        hydratePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
