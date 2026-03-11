import type { Item, Rarity } from '../contexts/EquipmentContext';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const rollForLoot = (bank: Item[], options?: { luck?: number; level?: number }) => {
  const luck = options?.luck ?? 0;
  const level = options?.level ?? 1;

  const dropChance = clamp(0.35 + luck * 0.003, 0.35, 0.6);
  const roll = Math.random();
  if (roll > dropChance) return null;

  const rarityRoll = Math.random();
  const levelBoost = clamp(level * 0.01, 0, 0.2);
  let rarity: Rarity = 'Common';

  if (rarityRoll > 0.98 - levelBoost * 0.3) rarity = 'Legendary';
  else if (rarityRoll > 0.93 - levelBoost * 0.4) rarity = 'Epic';
  else if (rarityRoll > 0.8 - levelBoost * 0.5) rarity = 'Rare';
  else if (rarityRoll > 0.6 - levelBoost * 0.6) rarity = 'Uncommon';

  const candidates = bank.filter(item => item.rarity === rarity);
  if (!candidates.length) return null;
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  return { ...item, id: Date.now() + Math.floor(Math.random() * 1000) } as Item;
};
