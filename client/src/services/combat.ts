const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const calcDodgeChance = (attackerDex: number, defenderDex: number) => {
  const diff = defenderDex - attackerDex;
  return clamp(0.08 + diff * 0.015, 0.05, 0.35);
};

export const calcCritChance = (attackerDex: number, defenderDex: number) => {
  const diff = attackerDex - defenderDex;
  return clamp(0.05 + diff * 0.012, 0.05, 0.25);
};

export const calcDamage = (atk: number, def: number) => {
  const mitigated = atk - Math.floor(def * 0.6);
  return Math.max(1, mitigated);
};

export const applyCrit = (damage: number) => Math.max(1, Math.round(damage * 1.5));
