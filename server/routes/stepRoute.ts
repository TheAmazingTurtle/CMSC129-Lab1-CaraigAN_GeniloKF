import express from 'express';
import User from '../models/User.ts';
import { IGetUserAuthInfoRequest } from '../middleware/authenticateToken.ts';

// Enemy table — mirrors the enemies array in Dashboard.tsx exactly.
const ENEMIES = [
  { name: "Wild Slime",   hpLoss: 10, goldReward: 15, expReward: 20 },
  { name: "Angry Goblin", hpLoss: 25, goldReward: 40, expReward: 50 },
  { name: "Shadow Bat",   hpLoss: 5,  goldReward: 5,  expReward: 10 },
];

// Experience required to reach the next level.
// Mirrors the expThreshold logic in PlayerContext.tsx — keep in sync.
const expToNextLevel = (level: number): number => level * 100;

// --- Item pool ---
// Mirrors the Item interface in PlayerContext.tsx / Inventory.tsx exactly.
// 'tier' controls drop weight: 1 = common drops, 2 = enemy drops only.
const ITEM_POOL = [
  // Walk drops (tier 1) — common, low-level loot
  { id: 101, name: "Rusty Broadsword",     type: "Weapon",     level: 1, rarity: "Common",   stat: "+2 ATK",        flavorText: "It's seen better days, but the pointy end still hurts.",    tier: 1 },
  { id: 102, name: "Tattered Breeches",    type: "Pants",      level: 1, rarity: "Common",   stat: "+1 DEF",        flavorText: "A bit drafty in the back.",                                 tier: 1 },
  { id: 103, name: "Lesser Health Potion", type: "Consumable", level: 1, rarity: "Common",   stat: "+50 HP",        flavorText: "Tastes like cherry cough syrup, but it seals wounds.",      tier: 1 },
  { id: 104, name: "Leather Tunic",        type: "Body Armor", level: 2, rarity: "Uncommon", stat: "+5 DEF",        flavorText: "Smells faintly of wet dog, but turns a blade well enough.", tier: 1 },
  { id: 105, name: "Worn Buckler",         type: "Head Wear",  level: 1, rarity: "Common",   stat: "+2 DEF",        flavorText: "Dented but functional.",                                    tier: 1 },
  // Enemy drops (tier 2) — better loot, only from fights
  { id: 201, name: "Iron Helm",            type: "Head Wear",  level: 3, rarity: "Rare",     stat: "+8 DEF",        flavorText: "Heavy, hard to see out of, but keeps your skull intact.",  tier: 2 },
  { id: 202, name: "Goblin Cleaver",       type: "Weapon",     level: 3, rarity: "Uncommon", stat: "+6 ATK",        flavorText: "Still has goblin on it. Adds authenticity.",                tier: 2 },
  { id: 203, name: "Elixir of Strength",   type: "Consumable", level: 5, rarity: "Epic",     stat: "+10 STR (Temp)",flavorText: "Your veins bulge just looking at the bottle.",              tier: 2 },
  { id: 204, name: "Shadow Cloak",         type: "Body Armor", level: 4, rarity: "Rare",     stat: "+6 DEF, +2 DEX",flavorText: "Woven from the wings of a defeated Shadow Bat.",            tier: 2 },
  { id: 205, name: "Slime Ring",           type: "Head Wear",  level: 2, rarity: "Uncommon", stat: "+3 DEF",        flavorText: "Surprisingly solid once it dries.",                        tier: 2 },
];

// Rolls for an item drop. Returns an item (without the tier field) or null.
//   walkDrop: true  → 15% chance, tier-1 pool only
//   walkDrop: false → 40% chance, full pool (tier 1 + 2)
const rollItemDrop = (walkDrop: boolean) => {
  const chance = walkDrop ? 0.15 : 0.40;
  if (Math.random() > chance) return null;

  const pool = walkDrop ? ITEM_POOL.filter(i => i.tier === 1) : ITEM_POOL;
  const { tier: _tier, ...item } = pool[Math.floor(Math.random() * pool.length)];
  return item;
};

// POST /api/game/step
// Processes a single step action server-side and persists the result atomically.
//
// Request body:
//   action: 'walk' | 'fight' | 'skip'
//   enemyIndex?: number  (required when action === 'fight')
//   currentHp: number    (client sends current HP so the server can apply damage)
//
// Response:
//   outcome: 'walk' | 'encounter' | 'fight' | 'skip'
//   message: string
//   enemy?: { name, hpLoss, goldReward, expReward, enemyIndex }  (on encounter only)
//   droppedItem: object | null
//   lastSaved: Date
//   updatedStats: { hp, maxHp, gold, exp, level, inventory }
const Step = async (req: IGetUserAuthInfoRequest, res: express.Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized." });

    const { action, enemyIndex, currentHp } = req.body;

    if (!['walk', 'fight', 'skip'].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Hero not found." });

    if (user.hp <= 0) {
      return res.status(400).json({ message: "Your hero is exhausted and cannot move." });
    }

    let message = '';
    let outcomeType: 'walk' | 'encounter' | 'fight' | 'skip' = action as any;
    let droppedItem: object | null = null;

    if (action === 'walk') {
      const roll = Math.random();

      if (roll < 0.2) {
        // Encounter — pick a random enemy and return it to the client.
        // Stats are NOT updated yet; the client must follow up with 'fight' or 'skip'.
        const idx = Math.floor(Math.random() * ENEMIES.length);
        const enemy = ENEMIES[idx];

        return res.json({
          outcome: 'encounter',
          message: `A ${enemy.name} blocks your path!`,
          enemy:   { ...enemy, enemyIndex: idx },
          updatedStats: {
            hp: user.hp, maxHp: user.maxHp,
            gold: user.gold, exp: user.exp, level: user.level,
          },
        });
      }

      // Safe walk
      const goldGained = Math.floor(Math.random() * 15) + 10; // 10–24
      const expGained  = Math.floor(Math.random() * 15) + 10; // 10–24
      user.gold += goldGained;
      user.exp  += expGained;

      droppedItem = rollItemDrop(true);
      if (droppedItem) {
        user.inventory.push(droppedItem as any);
        message = `You walked safely, found ${goldGained} gold, and picked up a ${(droppedItem as any).name}!`;
      } else {
        message = `You walked safely and found ${goldGained} gold.`;
      }
      outcomeType = 'walk';

    } else if (action === 'fight') {
      if (enemyIndex === undefined || enemyIndex < 0 || enemyIndex >= ENEMIES.length) {
        return res.status(400).json({ message: "Invalid enemy." });
      }
      const enemy = ENEMIES[enemyIndex];

      user.hp   = Math.max(0, (currentHp ?? user.hp) - enemy.hpLoss);
      user.gold += enemy.goldReward;
      user.exp  += enemy.expReward;

      droppedItem = rollItemDrop(false);
      if (droppedItem) {
        user.inventory.push(droppedItem as any);
        message = `Victory! You defeated the ${enemy.name}, lost ${enemy.hpLoss} HP, and looted a ${(droppedItem as any).name}!`;
      } else {
        message = `Victory! You defeated the ${enemy.name} but lost ${enemy.hpLoss} HP.`;
      }
      outcomeType = 'fight';

    } else if (action === 'skip') {
      message = `You carefully snuck past the enemy.`;
      outcomeType = 'skip';
    }

    // --- Level-up check ---
    while (user.exp >= expToNextLevel(user.level)) {
      user.exp   -= expToNextLevel(user.level);
      user.level += 1;
      user.maxHp += 20;
      user.hp     = user.maxHp;
    }

    user.lastSaved = new Date();
    await user.save();

    res.json({
      outcome:     outcomeType,
      message,
      lastSaved:   user.lastSaved,
      droppedItem,
      updatedStats: {
        hp:        user.hp,
        maxHp:     user.maxHp,
        gold:      user.gold,
        exp:       user.exp,
        level:     user.level,
        inventory: user.inventory,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export default Step;