import type { Item, Rarity } from '../contexts/EquipmentContext';

export const rarityMultiplier: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1.5,
  Rare: 2.5,
  Epic: 4,
  Legendary: 6,
};

export const itemBank: Item[] = [
  { id: 1001, name: 'Traveler Dagger', type: 'Weapon', level: 1, rarity: 'Common', stat: '+3 ATK', flavorText: 'Lightweight and reliable for long roads.', bonuses: { attack: 3 } },
  { id: 1002, name: 'Worn Shortsword', type: 'Weapon', level: 2, rarity: 'Uncommon', stat: '+6 ATK', flavorText: 'A blade with nicks from many skirmishes.', bonuses: { attack: 6 } },
  { id: 1003, name: 'Knight Longsword', type: 'Weapon', level: 4, rarity: 'Rare', stat: '+12 ATK', flavorText: 'Balanced steel for serious combat.', bonuses: { attack: 12 } },
  { id: 1004, name: 'Moonsteel Saber', type: 'Weapon', level: 7, rarity: 'Epic', stat: '+20 ATK', flavorText: 'It hums under starlight.', bonuses: { attack: 20 } },
  { id: 1005, name: 'Phoenix Blade', type: 'Weapon', level: 10, rarity: 'Legendary', stat: '+30 ATK', flavorText: 'Forged in flame and legend.', bonuses: { attack: 30 } },

  { id: 1011, name: 'Leather Cap', type: 'Head Wear', level: 1, rarity: 'Common', stat: '+2 DEF', flavorText: 'Keeps the rain and blades off your head.', bonuses: { defense: 2 } },
  { id: 1012, name: 'Iron Visor', type: 'Head Wear', level: 3, rarity: 'Uncommon', stat: '+5 DEF', flavorText: 'A sturdy visor with a dull shine.', bonuses: { defense: 5 } },
  { id: 1013, name: 'Ranger Hood', type: 'Head Wear', level: 5, rarity: 'Rare', stat: '+8 DEF', flavorText: 'Silent and shadow-friendly.', bonuses: { defense: 8 } },

  { id: 1021, name: 'Traveler Vest', type: 'Body Armor', level: 1, rarity: 'Common', stat: '+3 DEF', flavorText: 'Simple padding for long trips.', bonuses: { defense: 3 } },
  { id: 1022, name: 'Chain Vest', type: 'Body Armor', level: 3, rarity: 'Uncommon', stat: '+6 DEF', flavorText: 'The links rattle softly as you move.', bonuses: { defense: 6 } },
  { id: 1023, name: 'Guardian Mail', type: 'Body Armor', level: 6, rarity: 'Rare', stat: '+10 DEF', flavorText: 'A mail that has seen many sieges.', bonuses: { defense: 10 } },

  { id: 1031, name: 'Sturdy Pants', type: 'Pants', level: 1, rarity: 'Common', stat: '+2 DEF', flavorText: 'Tough fabric for rough roads.', bonuses: { defense: 2 } },
  { id: 1032, name: 'Scout Trousers', type: 'Pants', level: 4, rarity: 'Uncommon', stat: '+4 DEF', flavorText: 'Lightweight with deep pockets.', bonuses: { defense: 4 } },
  { id: 1033, name: 'Shadow Greaves', type: 'Pants', level: 7, rarity: 'Rare', stat: '+7 DEF', flavorText: 'Quiet steps, quiet thoughts.', bonuses: { defense: 7 } },

  { id: 1041, name: 'Minor Healing Potion', type: 'Consumable', level: 1, rarity: 'Common', stat: '+50 HP', flavorText: 'Bitter, but it works.', effects: { heal: 50 } },
  { id: 1042, name: 'Lesser Remedy', type: 'Consumable', level: 3, rarity: 'Uncommon', stat: '+80 HP', flavorText: 'A calming glow in a glass bottle.', effects: { heal: 80 } },
  { id: 1043, name: 'Faded Elixir', type: 'Consumable', level: 6, rarity: 'Rare', stat: '+120 HP', flavorText: 'A relic from an old apothecary.', effects: { heal: 120 } },
  { id: 1044, name: 'Elixir of Strength', type: 'Consumable', level: 5, rarity: 'Epic', stat: '+5 ATK (5 steps)', flavorText: 'A rush of power in your veins.', effects: { tempBuff: { name: 'Strength Surge', bonuses: { attack: 5 }, durationSteps: 5 } } },
];

export const defaultStartingItems: Item[] = [
  { id: 1, name: 'Rusty Broadsword', type: 'Weapon', level: 1, rarity: 'Common', stat: '+2 ATK', flavorText: 'It\'s seen better days, but the pointy end still hurts.', bonuses: { attack: 2 } },
  { id: 2, name: 'Lesser Health Potion', type: 'Consumable', level: 1, rarity: 'Common', stat: '+50 HP', flavorText: 'Tastes like cherry cough syrup, but it seals your wounds.', effects: { heal: 50 } },
  { id: 3, name: 'Leather Tunic', type: 'Body Armor', level: 2, rarity: 'Uncommon', stat: '+5 DEF', flavorText: 'Smells faintly of wet dog, but it turns a blade well enough.', bonuses: { defense: 5 } },
  { id: 5, name: 'Tattered Breeches', type: 'Pants', level: 1, rarity: 'Common', stat: '+1 DEF', flavorText: 'A bit drafty in the back.', bonuses: { defense: 1 } },
];

export const getItemValue = (item: Item) => {
  const base = 10 + item.level * 5;
  const multiplier = rarityMultiplier[item.rarity] ?? 1;
  return Math.round(base * multiplier);
};
