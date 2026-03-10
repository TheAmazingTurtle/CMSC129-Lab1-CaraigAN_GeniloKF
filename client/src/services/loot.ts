import type { Item, Rarity } from '../contexts/EquipmentContext';

export const rollForLoot = (bank: Item[]) => {
  const roll = Math.random();
  if (roll < 0.65) return null; // 35% chance to find something

  const rarityRoll = Math.random();
  let rarity: Rarity = 'Common';
  if (rarityRoll > 0.98) rarity = 'Legendary';
  else if (rarityRoll > 0.93) rarity = 'Epic';
  else if (rarityRoll > 0.8) rarity = 'Rare';
  else if (rarityRoll > 0.6) rarity = 'Uncommon';

  const candidates = bank.filter(item => item.rarity === rarity);
  if (!candidates.length) return null;
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  return { ...item, id: Date.now() + Math.floor(Math.random() * 1000) } as Item;
};
