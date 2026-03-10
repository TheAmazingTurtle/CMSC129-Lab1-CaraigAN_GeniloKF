const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const calcDodgeChance = (attackerDex: number, defenderDex: number) => {
  const diff = defenderDex - attackerDex;
  return clamp(0.08 + diff * 0.015, 0.05, 0.35);
};

export const calcDamage = (atk: number, def: number) => {
  const mitigated = atk - Math.floor(def * 0.6);
  return Math.max(1, mitigated);
};
